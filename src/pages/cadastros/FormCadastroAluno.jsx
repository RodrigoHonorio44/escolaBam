import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, serverTimestamp, doc, getDoc, getDocs, query, where, writeBatch, orderBy, limit 
} from 'firebase/firestore';
import { 
  UserPlus, Save, Loader2, AlertCircle, School, X, ArrowLeft,
  Hash, CreditCard, Users, Stethoscope, Brain, Search, MapPin, Eraser, Pill, MessageSquare, Accessibility, Zap, PlusCircle, Accessibility as Wheelchair
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
  
  // Normalização para minúsculas conforme solicitado
  const paraBanco = (txt) => txt ? String(txt).toLowerCase().trim() : "";

  const defaultValues = {
    nome: '',
    matriculaInteligente: '',
    cartaoSus: '',
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
    tipoDeficiencia: '',
    categoriasPCD: [], 
    detalheTEA: '',
    detalheTDAH: '',
    detalheIntelectual: '',
    detalheFisico: 'andante sem auxílio', 
    outrosDiagnosticos: '', 
    numeroCid: '',
    tomaMedicao: 'não',
    detalhesMedicao: '',
    contato1_nome: '',
    contato1_parentesco: 'mãe',
    contato1_telefone: '',
    contato2_nome: '',
    contato2_parentesco: 'pai',
    contato2_telefone: '',
    temAlergia: 'não',
    historicoMedico: '',
    observacoesAlergia: '',
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
  const watchCategoriasPCD = watch("categoriasPCD") || [];
  const watchTomaMedicao = watch("tomaMedicao");
  const watchCep = watch("endereco_cep");
  const watchDetalheFisico = watch("detalheFisico");
  const watchTipoDeficiencia = watch("tipoDeficiencia");

  const limparFormulario = () => {
    reset(defaultValues);
    toast.success("formulário limpo!");
  };

  // Busca de CEP
  useEffect(() => {
    const cepLimpo = watchCep?.replace(/\D/g, "");
    if (cepLimpo?.length === 8) {
      const buscarCep = async () => {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
          const data = await res.json();
          if (!data.erro) {
            setValue("endereco_rua", paraBanco(data.logradouro));
            setValue("endereco_bairro", paraBanco(`${data.bairro} - ${data.localidade}/${data.uf}`));
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

  // Carrega sugestões de nomes
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

  // Preenche dados para edição
  useEffect(() => {
    if (dadosIniciais) {
      reset({
        ...dadosIniciais,
        contato1_telefone: aplicarMascaraTelefone(dadosIniciais.contato1_telefone || ""),
        contato2_telefone: aplicarMascaraTelefone(dadosIniciais.contato2_telefone || ""),
        categoriasPCD: Array.isArray(dadosIniciais.categoriasPCD) ? dadosIniciais.categoriasPCD : [],
      });
      setValue("naoSabeEtnia", !dadosIniciais.etnia);
      setValue("naoSabePeso", !dadosIniciais.peso);
      setValue("naoSabeAltura", !dadosIniciais.altura);
      setValue("naoSabeEndereco", !!dadosIniciais.naoSabeEndereco);
      setValue("naoSabeMatricula", !dadosIniciais.matriculaInteligente);
    }
  }, [dadosIniciais, reset, setValue]);

  // Lógica de Cruzamento de Dados (Busca Inteligente)
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
        tipoDeficiencia: dPasta.tipoDeficiencia || "",
        categoriasPCD: dPasta.categoriasPCD || [],
        detalheTEA: dPasta.detalheTEA || "",
        detalheTDAH: dPasta.detalheTDAH || dPasta.tipoNecessidade || "",
        detalheIntelectual: dPasta.detalheIntelectual || "",
        detalheFisico: dPasta.detalheFisico || "andante sem auxílio",
        outrosDiagnosticos: dPasta.outrosDiagnosticos || "",
        numeroCid: dPasta.numeroCid || dQuest.numeroCid || "",
        tomaMedicao: dPasta.tomaMedicao || dQuest.tomaMedicao || 'não',
        detalhesMedicao: dPasta.detalhesMedicao || dQuest.detalhesMedicao || "",
        cartaoSus: dPasta.cartaoSus || dAtend.cartaoSus || "",
        matriculaInteligente: dPasta.matriculaInteligente || dAlu.matriculaInteligente || "",
        temAlergia: dQuest.alergias?.possui || dAtend.alunoPossuiAlergia || dPasta.alunoPossuiAlergia || "não",
        historicoMedico: dQuest.alergias?.detalhes || dAtend.qualAlergia || dPasta.qualAlergia || "",
        observacoesAlergia: dPasta.observacoesAlergia || "",
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

  // Cálculo de idade
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
        
        tipoDeficiencia: data.isPCD === 'sim' ? paraBanco(data.tipoDeficiencia) : "",
        detalheTEA: data.isPCD === 'sim' ? paraBanco(data.detalheTEA) : "",
        detalheTDAH: data.isPCD === 'sim' ? paraBanco(data.detalheTDAH) : "",
        detalheIntelectual: data.isPCD === 'sim' ? paraBanco(data.detalheIntelectual) : "",
        detalheFisico: paraBanco(data.detalheFisico), 
        outrosDiagnosticos: data.isPCD === 'sim' ? paraBanco(data.outrosDiagnosticos) : "",
        numeroCid: data.isPCD === 'sim' ? paraBanco(data.numeroCid) : "",
        
        tomaMedicao: paraBanco(data.tomaMedicao),
        detalhesMedicao: data.tomaMedicao === 'sim' ? paraBanco(data.detalhesMedicao) : "",
        endereco_rua: data.naoSabeEndereco ? "pendente" : paraBanco(data.endereco_rua),
        endereco_bairro: data.naoSabeEndereco ? "pendente" : paraBanco(data.endereco_bairro),
        alunoPossuiAlergia: paraBanco(data.temAlergia),
        qualAlergia: data.temAlergia === "sim" ? paraBanco(data.historicoMedico) : "",
        observacoesAlergia: data.temAlergia === "sim" ? paraBanco(data.observacoesAlergia) : "",
        pacienteId: idGerado,
        tipoPerfil: 'aluno',
        updatedAt: serverTimestamp()
      };
      
      const batch = writeBatch(db);
      batch.set(doc(db, "pastas_digitais", idGerado), payload, { merge: true });
      batch.set(doc(db, "alunos", idGerado), { ...payload, createdAt: dadosIniciais?.createdAt || serverTimestamp() }, { merge: true });
      await batch.commit();

      if (onSucesso) onSucesso();
      if (modoPastaDigital) {
        (onClose ? onClose() : onVoltar());
      } else {
        reset(defaultValues);
      }
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
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Salvamento em Minúsculas • Acessibilidade e Saúde</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={limparFormulario} title="Limpar todos os campos" className="p-2 hover:bg-amber-50 text-amber-500 rounded-full transition-all">
            <Eraser size={26} />
          </button>
          <button type="button" onClick={() => modoPastaDigital ? (onClose ? onClose() : onVoltar()) : navigate('/dashboard')} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={28} /></button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IDENTIFICAÇÃO ESCOLAR */}
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

        {/* NOME E DATA */}
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

        {/* SEÇÃO PCD */}
        <div className="md:col-span-2 p-6 bg-purple-50 rounded-[35px] border-2 border-purple-100 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-purple-600 uppercase flex items-center gap-2 italic"><Stethoscope size={14}/> Condição PCD & Acessibilidade</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select {...register("isPCD")} className="w-full px-5 py-4 bg-white border-2 border-purple-100 rounded-2xl font-bold outline-none">
              <option value="não">não possui necessidades especiais</option>
              <option value="sim">sim, possui necessidades especiais</option>
            </select>
            {watchIsPCD === 'sim' && (
              <div className="relative animate-in zoom-in-95">
                <input {...register("numeroCid")} placeholder="CIDs (Ex: F84, G80)" className="w-full px-5 py-4 bg-white border-2 border-purple-300 rounded-2xl font-black text-purple-700 outline-none focus:border-purple-600" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-purple-400 italic">OBRIGATÓRIO</span>
              </div>
            )}
          </div>
          
          {watchIsPCD === 'sim' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
              
              {/* Categorias - Múltipla Escolha */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-purple-400 uppercase italic ml-1 flex items-center gap-2"><Brain size={12}/> Categorias do Laudo (Múltipla Escolha)</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { id: 'tea', label: 'tea (autismo)', icon: <Brain size={16}/> },
                    { id: 'tdah', label: 'tdah / tod', icon: <Zap size={16}/> },
                    { id: 'intelectual', label: 'intelectual', icon: <Users size={16}/> },
                    { id: 'fisica', label: 'física/motora', icon: <Accessibility size={16}/> },
                    { id: 'pcd', label: 'pcd', icon: <Wheelchair size={16}/> }, 
                  ].map((cat) => {
                    const isSel = watchCategoriasPCD.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const novos = isSel ? watchCategoriasPCD.filter(i => i !== cat.id) : [...watchCategoriasPCD, cat.id];
                          setValue("categoriasPCD", novos);
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-[20px] border-2 transition-all gap-2 h-[85px] ${
                          isSel 
                            ? "border-purple-600 bg-white text-purple-600 shadow-md scale-105" 
                            : "border-transparent bg-purple-100/50 text-purple-300 hover:bg-purple-100"
                        }`}
                      >
                        {cat.icon}
                        <span className="font-black text-[8px] uppercase">{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Lista específica do CARD PCD */}
              {watchCategoriasPCD.includes('pcd') && (
                <div className="space-y-2 animate-in zoom-in-95">
                  <label className="text-[10px] font-black text-purple-400 uppercase italic ml-1">Tipo de Deficiência (PCD)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {["deficiência física", "deficiência auditiva", "deficiência visual", "deficiência intelectual", "deficiência múltipla"].map((tipo) => (
                       <button
                       key={tipo}
                       type="button"
                       onClick={() => setValue("tipoDeficiencia", tipo)}
                       className={`py-3 px-2 rounded-xl border-2 font-bold text-[8px] uppercase transition-all ${
                         watchTipoDeficiencia === tipo ? "border-purple-600 bg-white text-purple-600 shadow-sm" : "border-purple-50 bg-white/40 text-slate-400"
                       }`}
                     >
                       {tipo}
                     </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalhes Dinâmicos */}
              {(watchCategoriasPCD.some(c => ['tea', 'tdah', 'intelectual'].includes(c))) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white/50 p-4 rounded-2xl border border-purple-100">
                  {watchCategoriasPCD.includes('tea') && (
                    <select {...register("detalheTEA")} className="w-full px-4 py-3 rounded-xl border-2 border-purple-50 bg-white font-bold text-xs outline-none">
                      <option value="">nível de suporte tea...</option>
                      <option value="nível 1">nível 1 (leve)</option>
                      <option value="nível 2">nível 2 (moderado)</option>
                      <option value="nível 3">nível 3 (severo)</option>
                    </select>
                  )}
                  {watchCategoriasPCD.includes('tdah') && (
                    <select {...register("detalheTDAH")} className="w-full px-4 py-3 rounded-xl border-2 border-purple-50 bg-white font-bold text-xs outline-none">
                      <option value="">tipo de tdah/tod...</option>
                      <option value="tdah - desatento">tdah - desatento</option>
                      <option value="tdah - hiperativo">tdah - hiperativo</option>
                      <option value="tdah - misto">tdah - misto</option>
                      <option value="tod">tod (oposição desafiante)</option>
                    </select>
                  )}
                  {watchCategoriasPCD.includes('intelectual') && (
                    <select {...register("detalheIntelectual")} className="w-full px-4 py-3 rounded-xl border-2 border-purple-50 bg-white font-bold text-xs outline-none">
                      <option value="">grau de deficiência...</option>
                      <option value="leve">deficiência intelectual leve</option>
                      <option value="moderada">deficiência intelectual moderada</option>
                      <option value="severa">deficiência intelectual severa</option>
                    </select>
                  )}
                </div>
              )}

              {/* Locomoção */}
              {watchCategoriasPCD.length > 0 && (
                <div className="p-5 bg-white rounded-[25px] border-2 border-purple-100 space-y-3 shadow-inner animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-purple-600 uppercase flex items-center gap-2 italic"><Accessibility size={16}/> Auxílio de Locomoção / Mobilidade</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {["andante sem auxílio", "cadeirante", "uso de muletas", "uso de andador", "prótese física", "paralisia cerebral"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setValue("detalheFisico", item)}
                        className={`py-3 px-2 rounded-xl border-2 font-bold text-[8px] uppercase transition-all ${
                          watchDetalheFisico === item ? "border-purple-600 bg-purple-600 text-white shadow-md" : "border-purple-50 bg-slate-50 text-slate-400 hover:border-purple-200"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MEDICAÇÃO */}
              <div className="pt-4 border-t border-purple-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-purple-500 uppercase italic ml-1 flex items-center gap-2"><Pill size={12}/> Medicação Contínua?</label>
                  <select {...register("tomaMedicao")} className="w-full px-5 py-4 bg-white border-2 border-purple-100 rounded-2xl font-bold outline-none">
                    <option value="não">não utiliza medicação</option>
                    <option value="sim">sim, utiliza medicação</option>
                  </select>
                </div>
                {watchTomaMedicao === 'sim' && (
                  <input {...register("detalhesMedicao")} placeholder="Remédio e Dose" className="w-full px-5 py-4 bg-white border-2 border-purple-200 rounded-2xl font-bold text-purple-700 outline-none mt-auto" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* CONTATOS DE EMERGÊNCIA - Parentescos adicionados */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-200 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-2 italic"><Users size={14}/> Contatos de Emergência</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-5 bg-white rounded-[25px] border border-slate-100 shadow-inner">
              <input {...register("contato1_nome", { required: true })} placeholder="Nome do Responsável" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <select {...register("contato1_parentesco")} className="px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none">
                  <option value="mãe">mãe</option><option value="pai">pai</option><option value="avó">avó</option>
                  <option value="avô">avô</option><option value="tio">tio</option><option value="tia">tia</option>
                  <option value="padrasto">padrasto</option><option value="madrasta">madrasta</option>
                  <option value="irmão">irmão</option><option value="irmã">irmã</option>
                </select>
                <input {...register("contato1_telefone", { required: true })} onChange={(e) => setValue("contato1_telefone", aplicarMascaraTelefone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              </div>
            </div>
            <div className="space-y-3 p-5 bg-white rounded-[25px] border border-slate-100 shadow-inner">
              <input {...register("contato2_nome")} placeholder="Nome do Segundo Contato" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <select {...register("contato2_parentesco")} className="px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none">
                  <option value="pai">pai</option><option value="mãe">mãe</option><option value="avô">avô</option>
                  <option value="avó">avó</option><option value="tio">tio</option><option value="tia">tia</option>
                  <option value="padrasto">padrasto</option><option value="madrasta">madrasta</option>
                  <option value="irmão">irmão</option><option value="irmã">irmã</option>
                </select>
                <input {...register("contato2_telefone")} onChange={(e) => setValue("contato2_telefone", aplicarMascaraTelefone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* LOCALIZAÇÃO */}
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
            <option value="">selecione...</option>
            <option value="masculino">masculino</option>
            <option value="feminino">feminino</option>
          </select>
        </div>

       {/* ALERGIAS */}
<div className="md:col-span-2 p-6 bg-red-50 rounded-[30px] border-2 border-red-100 space-y-4 shadow-sm">
  <label className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2 italic">
    <AlertCircle size={14}/> Alergias & Observações
  </label>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <select {...register("temAlergia")} className="w-full px-5 py-4 bg-white border-2 border-red-100 rounded-2xl font-bold outline-none">
      <option value="não">não possui alergias</option>
      <option value="sim">sim, possui alergias</option>
    </select>

    {/* Os campos abaixo só aparecem se 'temAlergia' for 'sim' */}
    {watchTemAlergia === 'sim' && (
      <>
        <div className="animate-in zoom-in-95">
          <input 
            {...register("historicoMedico")} 
            placeholder="Qual alergia? (Ex: amendoim, dipirona)" 
            className="w-full px-5 py-4 bg-white border-2 border-red-200 rounded-2xl font-bold text-red-700 outline-none focus:border-red-500 transition-all" 
          />
        </div>
        <div className="md:col-span-2 animate-in slide-in-from-top-2">
          <textarea 
            {...register("observacoesAlergia")} 
            placeholder="Descreva aqui os sintomas ou cuidados necessários em caso de reação..." 
            className="w-full px-5 py-4 bg-white rounded-2xl font-bold text-slate-600 outline-none h-24 resize-none border-2 border-red-100 focus:border-red-400 transition-all" 
          />
        </div>
      </>
    )}
  </div>
</div>

        <button type="submit" disabled={isSubmitting} className="md:col-span-2 w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[25px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
          {dadosIniciais ? 'Atualizar Registro' : 'Finalizar Cadastro'}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroAluno;