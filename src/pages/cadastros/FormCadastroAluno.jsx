import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, serverTimestamp, doc, getDoc, getDocs, query, where, writeBatch, orderBy, limit 
} from 'firebase/firestore';
import { 
  UserPlus, Save, Loader2, AlertCircle, School, X, ArrowLeft,
  Hash, CreditCard, Users, Stethoscope, Brain, Search, MapPin
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const aplicarMascaraTelefone = (valor) => {
  if (!valor) return "";
  const n = valor.replace(/\D/g, "");
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const FormCadastroAluno = ({ onVoltar, dadosEdicao, alunoParaEditar, modoPastaDigital = !!(dadosEdicao || alunoParaEditar), onClose, onSucesso }) => {
  const navigate = useNavigate();
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);

  const dadosIniciais = alunoParaEditar || dadosEdicao;
  
  const paraBanco = (txt) => txt ? String(txt).toLowerCase().trim() : "";

  const defaultValues = {
    nome: '',
    matriculaInteligente: '',
    naoSabeEtnia: false,
    naoSabePeso: false,
    naoSabeAltura: false,
    naoSabeEndereco: false,
    sexo: '',
    dataNascimento: '',
    idade: '',
    turma: '',
    etnia: '',
    peso: '',
    altura: '',
    isPCD: 'não',
    tipoNecessidade: '',
    numeroCid: '',
    contato1_nome: '',
    contato1_parentesco: 'mãe',
    contato1_telefone: '',
    contato2_nome: '',
    contato2_parentesco: 'pai',
    contato2_telefone: '',
    temAlergia: 'não',
    historicoMedico: '',
    endereco_rua: '',
    endereco_cep: '',
    endereco_bairro: ''
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm({
    mode: "onChange", 
    defaultValues
  });

  const watchDataNasc = watch("dataNascimento");
  const naoSabeMatricula = watch("naoSabeMatricula");
  const naoSabeEndereco = watch("naoSabeEndereco");
  const watchTemAlergia = watch("temAlergia");
  const watchIsPCD = watch("isPCD");
  const watchCep = watch("endereco_cep");

  // --- BUSCA CEP AUTOMÁTICA ---
  useEffect(() => {
    const cepLimpo = watchCep?.replace(/\D/g, "");
    if (cepLimpo?.length === 8) {
      const buscarCep = async () => {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
          const data = await res.json();
          if (!data.erro) {
            setValue("endereco_rua", data.logradouro);
            setValue("endereco_bairro", `${data.bairro} - ${data.localidade}/${data.uf}`);
            toast.success("endereço localizado!");
          } else {
            toast.error("cep não encontrado.");
          }
        } catch (e) {
          toast.error("erro ao buscar cep.");
        }
      };
      buscarCep();
    }
  }, [watchCep, setValue]);

  useEffect(() => {
    const carregarNomes = async () => {
      try {
        const q = query(collection(db, "alunos"));
        const snap = await getDocs(q);
        const nomes = snap.docs.map(doc => doc.data().nome).filter(Boolean);
        setSugestoes([...new Set(nomes)]);
      } catch (e) { console.error("Erro ao carregar sugestões", e); }
    };
    carregarNomes();
  }, []);

  useEffect(() => {
    if (dadosIniciais) {
      reset({
        ...dadosIniciais,
        contato1_telefone: aplicarMascaraTelefone(dadosIniciais.contato1_telefone || ""),
        contato2_telefone: aplicarMascaraTelefone(dadosIniciais.contato2_telefone || ""),
      });
      setValue("naoSabeEtnia", !dadosIniciais.etnia);
      setValue("naoSabePeso", !dadosIniciais.peso);
      setValue("naoSabeAltura", !dadosIniciais.altura);
      setValue("naoSabeEndereco", !!dadosIniciais.naoSabeEndereco);
      setValue("naoSabeMatricula", !dadosIniciais.matriculaInteligente);
    }
  }, [dadosIniciais, reset, setValue]);

  const buscarAluno = async () => {
    const nomeAtual = watch("nome");
    const nomeBusca = paraBanco(nomeAtual);
    if (nomeBusca.length < 3) {
      toast.error("digite ao menos 3 letras para buscar");
      return;
    }
    setBuscando(true);
    const toastId = toast.loading("sincronizando dados...");
    try {
      let pacienteId = null;
      const qPasta = query(collection(db, "pastas_digitais"), where("nomeBusca", "==", nomeBusca), where("tipoPerfil", "==", "aluno"), limit(1));
      const snapId = await getDocs(qPasta);
      
      if (!snapId.empty) pacienteId = snapId.docs[0].id;
      else {
        const qAlu = query(collection(db, "alunos"), where("nomeBusca", "==", nomeBusca), limit(1));
        const snapAluOnly = await getDocs(qAlu);
        if (!snapAluOnly.empty) pacienteId = snapAluOnly.docs[0].id;
      }

      if (!pacienteId) {
        toast.error("aluno não localizado.", { id: toastId });
        setBuscando(false);
        return;
      }

      const qAtend = query(collection(db, "atendimentos_enfermagem"), where("pacienteId", "==", pacienteId), orderBy("createdAt", "desc"), limit(1));
      const [snapQuest, snapPasta, snapAlu, snapAtend] = await Promise.all([
        getDoc(doc(db, "questionarios_saude", pacienteId)),
        getDoc(doc(db, "pastas_digitais", pacienteId)),
        getDoc(doc(db, "alunos", pacienteId)),
        getDocs(qAtend)
      ]);

      const dQuest = snapQuest.exists() ? snapQuest.data() : {};
      const dPasta = snapPasta.exists() ? snapPasta.data() : {};
      const dAlu = snapAlu.exists() ? snapAlu.data() : {};
      const dAtend = !snapAtend.empty ? snapAtend.docs[0].data() : {};

      reset({
        pacienteId: pacienteId,
        nome: dQuest.alunoNome || dAtend.nomePaciente || dPasta.nomeBusca || dAlu.nome || nomeAtual,
        dataNascimento: dQuest.dataNascimento || dAtend.dataNascimento || dPasta.dataNascimento || dAlu.dataNascimento || "",
        turma: dQuest.turma || dAtend.turma || dPasta.turma || dAlu.turma || "",
        sexo: dQuest.sexo || dAtend.sexo || dPasta.sexo || "",
        etnia: dQuest.etnia || dAtend.etnia || dPasta.etnia || "",
        peso: dQuest.peso || dAtend.peso || dPasta.peso || "",
        altura: dQuest.altura || dAtend.altura || dPasta.altura || "",
        isPCD: dPasta.isPCD || dQuest.isPCD || 'não',
        tipoNecessidade: dPasta.tipoNecessidade || dQuest.tipoNecessidade || "",
        numeroCid: dPasta.numeroCid || dQuest.numeroCid || "",
        cartaoSus: dPasta.cartaoSus || dAtend.cartaoSus || "",
        matriculaInteligente: dPasta.matriculaInteligente || dAlu.matriculaInteligente || "",
        temAlergia: dQuest.alergias?.possui || dAtend.alunoPossuiAlergia || dPasta.alunoPossuiAlergia || "não",
        historicoMedico: dQuest.alergias?.detalhes || dAtend.qualAlergia || dPasta.qualAlergia || "",
        contato1_nome: dPasta.contato1_nome || dPasta.responsavel || dAlu.contato1_nome || dAlu.responsavel || dQuest.contatos?.[0]?.nome || "",
        contato1_telefone: aplicarMascaraTelefone(dPasta.contato1_telefone || dPasta.contato || dAlu.contato1_telefone || dAlu.contato || dQuest.contatos?.[0]?.telefone || ""),
        contato1_parentesco: dPasta.contato1_parentesco || dAlu.contato1_parentesco || "mãe",
        contato2_nome: dPasta.contato2_nome || dAlu.contato2_nome || dQuest.contatos?.[1]?.nome || "",
        contato2_telefone: aplicarMascaraTelefone(dPasta.contato2_telefone || dAlu.contato2_telefone || dQuest.contatos?.[1]?.telefone || ""),
        contato2_parentesco: dPasta.contato2_parentesco || dAlu.contato2_parentesco || "pai",
        endereco_rua: dPasta.endereco_rua || "",
        endereco_bairro: dPasta.endereco_bairro || "",
        endereco_cep: dPasta.endereco_cep || "",
        tipoPerfil: 'aluno'
      });
      toast.success("perfil sincronizado!", { id: toastId });
    } catch (error) {
      toast.error("erro ao cruzar dados.", { id: toastId });
    } finally { setBuscando(false); }
  };

  useEffect(() => {
    if (watchDataNasc) {
      const hoje = new Date();
      const nasc = new Date(watchDataNasc);
      let idade = hoje.getFullYear() - nasc.getFullYear();
      if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) idade--;
      setValue("idade", idade >= 0 ? idade : "");
    }
  }, [watchDataNasc, setValue]);

  const onSubmit = async (data) => {
    const saveAction = async () => {
      const nomeNormalizado = paraBanco(data.nome);
      const dataNascLimpa = data.dataNascimento ? data.dataNascimento.replace(/-/g, '') : 'sem-data';
      const idGerado = data.pacienteId || `${nomeNormalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${dataNascLimpa}`;
      
      const payload = { 
        ...data, 
        nome: nomeNormalizado,
        nomeBusca: nomeNormalizado,
        matriculaInteligente: paraBanco(data.matriculaInteligente),
        cartaoSus: paraBanco(data.cartaoSus),
        contato1_nome: paraBanco(data.contato1_nome),
        contato1_parentesco: paraBanco(data.contato1_parentesco),
        contato1_telefone: data.contato1_telefone.replace(/\D/g, ""),
        contato2_nome: paraBanco(data.contato2_nome),
        contato2_parentesco: paraBanco(data.contato2_parentesco),
        contato2_telefone: data.contato2_telefone.replace(/\D/g, ""),
        responsavel: paraBanco(data.contato1_nome), 
        turma: paraBanco(data.turma),
        sexo: paraBanco(data.sexo),
        etnia: data.naoSabeEtnia ? "" : paraBanco(data.etnia),
        tipoNecessidade: data.isPCD === 'sim' ? paraBanco(data.tipoNecessidade) : "",
        numeroCid: data.isPCD === 'sim' ? paraBanco(data.numeroCid) : "",
        endereco_rua: data.naoSabeEndereco ? "pendente" : paraBanco(data.endereco_rua),
        endereco_bairro: data.naoSabeEndereco ? "pendente" : paraBanco(data.endereco_bairro),
        alunoPossuiAlergia: paraBanco(data.temAlergia),
        qualAlergia: data.temAlergia === "sim" ? paraBanco(data.historicoMedico) : "",
        pacienteId: idGerado,
        tipoPerfil: 'aluno',
        updatedAt: serverTimestamp()
      };
      
      const batch = writeBatch(db);
      batch.set(doc(db, "pastas_digitais", idGerado), payload, { merge: true });
      batch.set(doc(db, "alunos", idGerado), { ...payload, createdAt: dadosIniciais?.createdAt || serverTimestamp() }, { merge: true });
      await batch.commit();

      if (onSucesso) onSucesso();
      if (modoPastaDigital) (onClose ? onClose() : onVoltar());
      else reset(defaultValues);
    };

    toast.promise(saveAction(), { loading: 'salvando...', success: 'base atualizada!', error: 'erro ao salvar.' });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-2xl border border-slate-200 font-sans">
      <Toaster position="top-center" />
      
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => modoPastaDigital ? (onClose ? onClose() : onVoltar()) : navigate('/dashboard')} className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-all"><ArrowLeft size={24} /></button>
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><UserPlus size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
              {dadosIniciais ? 'Atualizar Pasta' : 'Cadastro de Aluno'}
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Escrita Livre • Salvamento em Minúsculo</p>
          </div>
        </div>
        <button type="button" onClick={() => modoPastaDigital ? (onClose ? onClose() : onVoltar()) : navigate('/dashboard')} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={28} /></button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-blue-50 rounded-[30px] border-2 border-blue-100 shadow-inner">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Hash size={14}/> Numero E. Cidade</label>
                <div className="flex gap-2 items-center">
                  <input {...register("matriculaInteligente")} disabled={naoSabeMatricula} placeholder={naoSabeMatricula ? "PENDENTE" : "00000000"} className="flex-1 px-5 py-4 rounded-2xl font-bold outline-none border-2 bg-white focus:border-blue-600 text-blue-900 transition-all" />
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register("naoSabeMatricula")} className="w-4 h-4 rounded border-blue-300 text-blue-600" />
                      <span className="text-[9px] font-black text-slate-500 uppercase">N/P</span>
                  </label>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2"><CreditCard size={14}/> Cartão SUS</label>
                <input {...register("cartaoSus")} placeholder="000 0000 0000 0000" className="w-full px-5 py-4 rounded-2xl font-bold outline-none border-2 border-transparent bg-white focus:border-blue-600 text-blue-900 transition-all" />
            </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className={`text-[10px] font-black uppercase tracking-widest ${errors.nome ? 'text-red-500' : 'text-slate-400'}`}>Nome Completo do Aluno</label>
          <div className="relative group">
            <input 
              {...register("nome", { required: "digite o nome completo" })} 
              list="lista-sugestoes"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarAluno())}
              autoComplete="off"
              className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all ${errors.nome ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-blue-600'}`} 
            />
            <datalist id="lista-sugestoes">
              {sugestoes.map((s, idx) => <option key={idx} value={s} />)}
            </datalist>
            <button type="button" onClick={buscarAluno} disabled={buscando} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all">
              {buscando ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
          <input type="date" {...register("dataNascimento")} className="w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none bg-slate-50 border-transparent focus:border-blue-600" required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 italic">Idade Atual</label>
          <input type="number" {...register("idade")} readOnly className="w-full px-5 py-4 bg-blue-50 rounded-2xl font-bold text-blue-700 outline-none" />
        </div>

        <div className="md:col-span-2 p-6 bg-purple-50 rounded-[30px] border-2 border-purple-100 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-purple-600 uppercase flex items-center gap-2 italic"><Stethoscope size={14}/> Condição PCD & Neurodiversidade</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select {...register("isPCD")} className="w-full px-5 py-4 bg-white border-2 border-purple-100 rounded-2xl font-bold outline-none">
              <option value="não">Não possui necessidades especiais</option>
              <option value="sim">Sim, possui necessidades especiais</option>
            </select>
            {watchIsPCD === 'sim' && (
              <input {...register("numeroCid")} placeholder="Número do CID" className="w-full px-5 py-4 bg-white border-2 border-purple-200 rounded-2xl font-bold text-purple-700 focus:border-purple-600 outline-none" />
            )}
          </div>
          {watchIsPCD === 'sim' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-purple-400 uppercase italic ml-1 flex items-center gap-2"><Brain size={12}/> Tipo de Necessidade Especial</label>
              <select {...register("tipoNecessidade")} className="w-full px-5 py-4 bg-white border-2 border-purple-100 rounded-2xl font-bold outline-none focus:border-purple-600">
                <option value="">Selecione uma categoria...</option>
                <optgroup label="Deficiências">
                  <option value="deficiência física">Deficiência Física</option>
                  <option value="deficiência visual">Deficiência Visual</option>
                  <option value="deficiência auditiva">Deficiência Auditiva</option>
                  <option value="deficiência intelectual">Deficiência Intelectual</option>
                </optgroup>
                <optgroup label="Transtornos">
                  <option value="tea">TEA (Autismo)</option>
                  <option value="tdah">TDAH</option>
                  <option value="tod">TOD</option>
                </optgroup>
              </select>
            </div>
          )}
        </div>

        {/* CONTATOS ATUALIZADOS */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-200 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-2 italic"><Users size={14}/> Contatos de Emergência</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-5 bg-white rounded-[25px] border border-slate-100 shadow-inner">
              <input {...register("contato1_nome", { required: true })} placeholder="Nome do Responsável" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <select {...register("contato1_parentesco")} className="px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none">
                  <option value="mãe">Mãe</option>
                  <option value="pai">Pai</option>
                  <option value="avó">Avó</option>
                  <option value="avô">Avô</option>
                  <option value="tio">Tio</option>
                  <option value="tia">Tia</option>
                  <option value="irmão">Irmão</option>
                  <option value="irmã">Irmã</option>
                </select>
                <input {...register("contato1_telefone", { required: true })} onChange={(e) => setValue("contato1_telefone", aplicarMascaraTelefone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              </div>
            </div>
            <div className="space-y-3 p-5 bg-white rounded-[25px] border border-slate-100 shadow-inner">
              <input {...register("contato2_nome")} placeholder="Nome do Segundo Contato" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <select {...register("contato2_parentesco")} className="px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none">
                  <option value="pai">Pai</option>
                  <option value="mãe">Mãe</option>
                  <option value="avó">Avó</option>
                  <option value="avô">Avô</option>
                  <option value="tio">Tio</option>
                  <option value="tia">Tia</option>
                  <option value="irmão">Irmão</option>
                  <option value="irmã">Irmã</option>
                </select>
                <input {...register("contato2_telefone")} onChange={(e) => setValue("contato2_telefone", aplicarMascaraTelefone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ENDEREÇO COM BUSCA CEP */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4 shadow-inner">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> Localização</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input {...register("endereco_cep")} disabled={naoSabeEndereco} placeholder="CEP (00000-000)" className="px-5 py-4 bg-white rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
            <input {...register("endereco_rua")} disabled={naoSabeEndereco} placeholder="Rua / Avenida" className="md:col-span-2 px-5 py-4 bg-white rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
            <input {...register("endereco_bairro")} disabled={naoSabeEndereco} placeholder="Bairro / Cidade - UF" className="md:col-span-3 px-5 py-4 bg-white rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><School size={12}/> Turma</label>
          <input {...register("turma")} placeholder="Ex: 1º Ano A" className="w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none bg-slate-50 border-transparent focus:border-blue-600" required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
          <select {...register("sexo")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-600 outline-none" required>
            <option value="">Selecione...</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </select>
        </div>

        <div className="md:col-span-2 p-6 bg-red-50 rounded-[30px] border-2 border-red-100 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2 italic"><AlertCircle size={14}/> Alergias</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select {...register("temAlergia")} className="w-full px-5 py-4 bg-white border-2 border-red-100 rounded-2xl font-bold outline-none">
              <option value="não">Não possui alergias</option>
              <option value="sim">Sim, possui alergias</option>
            </select>
            {watchTemAlergia === 'sim' && (
              <input {...register("historicoMedico")} placeholder="Quais as alergias?" className="w-full px-5 py-4 bg-white border-2 border-red-200 rounded-2xl font-bold text-red-700 focus:border-red-600 outline-none" />
            )}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className={`md:col-span-2 mt-4 py-6 rounded-[30px] font-black uppercase italic shadow-2xl flex items-center justify-center gap-4 transition-all ${Object.keys(errors).length > 0 ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-50`}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar e Sincronizar Tudo</>}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroAluno;