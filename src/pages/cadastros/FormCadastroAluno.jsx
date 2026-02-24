import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, serverTimestamp, doc, getDoc, getDocs, query, where, writeBatch, orderBy, limit 
} from 'firebase/firestore';
import { 
  UserPlus, Save, Loader2, AlertCircle, School, X, ArrowLeft, Baby,
  Hash, CreditCard, Users, Stethoscope, Brain, Search, MapPin, Eraser, Pill, Accessibility, Zap, Accessibility as Wheelchair
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const aplicarMascaraTelefone = (valor) => {
  if (!valor) return "";
  const n = valor.replace(/\D/g, "");
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const FormCadastroAluno = ({ 
  onVoltar, 
  dadosEdicao, 
  alunoParaEditar, 
  modoPastaDigital = !!(dadosEdicao || alunoParaEditar), 
  onClose, 
  onSucesso,
  usuarioLogado // Prop vital para filtrar por colégio
}) => {
  const navigate = useNavigate();
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);

  const dadosIniciais = alunoParaEditar || dadosEdicao;
  
  // LÓGICA R S: Normalização para minúsculas
  const paraBanco = (txt) => txt ? String(txt).toLowerCase().trim() : "";

  const defaultValues = {
    nome: '', nomeMae: '', nomePai: '', semPaiDeclarado: false,
    matriculaInteligente: '', cartaoSus: '', naoSabeEtnia: false,
    naoSabePeso: false, naoSabeAltura: false, naoSabeEndereco: false,
    sexo: '', estaGestante: 'não', semanasGestacao: '',
    dataNascimento: '', idade: '', turma: '', etnia: '',
    peso: '', altura: '', isPCD: 'não', tipoDeficiencia: '',
    categoriasPCD: [], detalheTEA: '', detalheTDAH: '',
    detalheIntelectual: '', detalheFisico: 'andante sem auxílio', 
    outrosDiagnosticos: '', numeroCid: '', tomaMedicao: 'não',
    detalhesMedicao: '', contato1_nome: '', contato1_parentesco: 'mãe',
    contato1_telefone: '', contato2_nome: '', contato2_parentesco: 'pai',
    contato2_telefone: '', temAlergia: 'não', historicoMedico: '',
    observacoesAlergia: '', endereco_rua: '', endereco_cep: '', endereco_bairro: ''
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm({
    mode: "onChange", 
    defaultValues
  });

  // Observadores
  const watchDataNasc = watch("dataNascimento");
  const naoSabeMatricula = watch("naoSabeMatricula");
  const watchTemAlergia = watch("temAlergia");
  const watchIsPCD = watch("isPCD");
  const watchCategoriasPCD = watch("categoriasPCD") || [];
  const watchTomaMedicao = watch("tomaMedicao");
  const watchCep = watch("endereco_cep");
  const watchDetalheFisico = watch("detalheFisico");
  const watchSexo = watch("sexo");
  const watchEstaGestante = watch("estaGestante");
  const watchNaoSabePeso = watch("naoSabePeso");
  const watchNaoSabeAltura = watch("naoSabeAltura");

  // 1. Cálculo de Idade
  useEffect(() => {
    if (watchDataNasc) {
      const hoje = new Date();
      const nasc = new Date(watchDataNasc);
      let idadeCalculada = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idadeCalculada--;
      setValue("idade", idadeCalculada >= 0 ? idadeCalculada : "");
    }
  }, [watchDataNasc, setValue]);

  // 2. Busca de CEP
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
          }
        } catch (e) { console.error("Erro CEP"); }
      };
      buscarCep();
    }
  }, [watchCep, setValue]);

  // 3. Carregar Sugestões (FILTRADO POR UNIDADE)
  useEffect(() => {
    const carregarNomes = async () => {
      if (!usuarioLogado?.unidadeid) return;
      try {
        const q = query(
          collection(db, "alunos"), 
          where("unidadeid", "==", paraBanco(usuarioLogado.unidadeid))
        );
        const snap = await getDocs(q);
        const nomes = snap.docs.map(doc => doc.data().nome).filter(Boolean);
        setSugestoes([...new Set(nomes)]);
      } catch (e) { console.error(e); }
    };
    carregarNomes();
  }, [usuarioLogado]);

  // 4. Efeito de Edição
  useEffect(() => {
    if (dadosIniciais) {
      reset({
        ...dadosIniciais,
        contato1_telefone: aplicarMascaraTelefone(dadosIniciais.contato1_telefone || ""),
        contato2_telefone: aplicarMascaraTelefone(dadosIniciais.contato2_telefone || ""),
        categoriasPCD: Array.isArray(dadosIniciais.categoriasPCD) ? dadosIniciais.categoriasPCD : [],
      });
    }
  }, [dadosIniciais, reset]);

  const limparFormulario = () => {
    reset(defaultValues);
    toast.success("formulário resetado!", { icon: '🧹' });
  };

  // 5. Busca Cruzada (FILTRADO POR UNIDADE)
  const buscarAluno = async () => {
    const nomeAtual = watch("nome");
    const nomeBusca = paraBanco(nomeAtual);
    if (nomeBusca.length < 3) return toast.error("digite ao menos 3 letras");
    if (!usuarioLogado?.unidadeid) return toast.error("unidade não identificada");

    setBuscando(true);
    const toastId = toast.loading("sincronizando dados...");
    try {
      let pacienteId = null;
      // Busca apenas na unidade do usuário
      const qPasta = query(
        collection(db, "pastas_digitais"), 
        where("nomeBusca", "==", nomeBusca), 
        where("unidadeid", "==", paraBanco(usuarioLogado.unidadeid)),
        limit(1)
      );
      const snapId = await getDocs(qPasta);
      
      if (!snapId.empty) {
        pacienteId = snapId.docs[0].id;
      } else {
        toast.error("aluno não localizado nesta unidade.", { id: toastId });
        setBuscando(false);
        return;
      }

      const [snapQuest, snapPasta, snapAlu] = await Promise.all([
        getDoc(doc(db, "questionarios_saude", pacienteId)),
        getDoc(doc(db, "pastas_digitais", pacienteId)),
        getDoc(doc(db, "alunos", pacienteId))
      ]);

      const dQuest = snapQuest.exists() ? snapQuest.data() : {};
      const dPasta = snapPasta.exists() ? snapPasta.data() : {};
      const dAlu = snapAlu.exists() ? snapAlu.data() : {};

      reset({
        ...defaultValues, ...dAlu, ...dQuest, ...dPasta,
        pacienteId: pacienteId,
        contato1_telefone: aplicarMascaraTelefone(dPasta.contato1_telefone || ""),
        contato2_telefone: aplicarMascaraTelefone(dPasta.contato2_telefone || ""),
      });
      toast.success("perfil sincronizado!", { id: toastId });
    } catch (error) { toast.error("erro ao sincronizar."); } 
    finally { setBuscando(false); }
  };

  // 6. Envio do Formulário (SALVAMENTO COM VÍNCULO DE UNIDADE)
  const onSubmit = async (data) => {
    if (!usuarioLogado?.unidadeid) return toast.error("erro: unidade não identificada!");

    const saveAction = async () => {
      const nomeNormalizado = paraBanco(data.nome);
      const dataNascLimpa = data.dataNascimento ? data.dataNascimento.replace(/-/g, '') : 'sem-data';
      const idGerado = data.pacienteId || `${nomeNormalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${dataNascLimpa}`;
      
      const payload = { 
        ...data, 
        nome: nomeNormalizado, 
        nomeBusca: nomeNormalizado,
        // Trava de unidade do usuário logado
        unidadeid: paraBanco(usuarioLogado.unidadeid),
        unidade: paraBanco(usuarioLogado.unidade),
        escolaid: paraBanco(usuarioLogado.escolaid),
        escola: paraBanco(usuarioLogado.escola),
        
        nomeMae: paraBanco(data.nomeMae),
        nomePai: paraBanco(data.nomePai),
        matriculaInteligente: paraBanco(data.matriculaInteligente),
        cartaoSus: paraBanco(data.cartaoSus),
        contato1_nome: paraBanco(data.contato1_nome),
        contato1_telefone: (data.contato1_telefone || "").replace(/\D/g, ""),
        contato2_nome: paraBanco(data.contato2_nome),
        contato2_telefone: (data.contato2_telefone || "").replace(/\D/g, ""),
        endereco_rua: paraBanco(data.endereco_rua),
        endereco_bairro: paraBanco(data.endereco_bairro),
        updatedAt: serverTimestamp()
      };
      
      const batch = writeBatch(db);
      batch.set(doc(db, "pastas_digitais", idGerado), payload, { merge: true });
      batch.set(doc(db, "alunos", idGerado), { ...payload, createdAt: serverTimestamp() }, { merge: true });
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
          <button type="button" onClick={() => (onClose ? onClose() : onVoltar())} className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-all"><ArrowLeft size={24} /></button>
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><UserPlus size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
              {dadosIniciais ? 'Atualizar Pasta' : 'Cadastro de Aluno'}
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">R S • UNIDADE: {usuarioLogado?.unidade || 'NÃO IDENTIFICADA'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={limparFormulario} title="Limpar" className="p-2 hover:bg-amber-50 text-amber-500 rounded-full transition-all">
            <Eraser size={26} />
          </button>
          <button type="button" onClick={() => (onClose ? onClose() : onVoltar())} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={28} /></button>
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

        {/* NOME DO ALUNO */}
        <div className="md:col-span-2 space-y-2">
          <label className={`text-[10px] font-black uppercase tracking-widest ${errors.nome ? 'text-red-500' : 'text-slate-400'}`}>Nome Completo do Aluno</label>
          <div className="relative group">
            <input {...register("nome", { required: "digite o nome completo" })} list="lista-sugestoes" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarAluno())} autoComplete="off" className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all ${errors.nome ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-blue-600'}`} />
            <datalist id="lista-sugestoes">
              {sugestoes.map((s, idx) => <option key={idx} value={s} />)}
            </datalist>
            <button type="button" onClick={buscarAluno} disabled={buscando} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all">
              {buscando ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </div>
        </div>

        {/* DATA E IDADE */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-2 ml-1 italic"><Baby size={14}/> Data de Nascimento</label>
          <input type="date" {...register("dataNascimento", { required: true })} className="w-full px-5 py-4 bg-emerald-50 border-2 border-transparent rounded-2xl font-bold focus:border-emerald-500 outline-none text-emerald-900 shadow-inner" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-2 ml-1 italic"><Hash size={14}/> Idade Atual</label>
          <input {...register("idade")} readOnly placeholder="calculando..." className="w-full px-5 py-4 bg-emerald-100/50 border-2 border-transparent rounded-2xl font-black text-emerald-700 outline-none cursor-not-allowed" />
        </div>

        {/* FILIAÇÃO */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-50 rounded-[30px] border-2 border-slate-100 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Mãe</label>
            <input {...register("nomeMae", { required: true })} placeholder="nome da mãe" className="w-full px-5 py-4 bg-white rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-600 text-slate-700" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Pai</label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" {...register("semPaiDeclarado")} onChange={(e) => setValue("nomePai", e.target.checked ? "não declarado" : "")} className="w-3 h-3 rounded text-blue-600" />
                <span className="text-[9px] font-black text-slate-500 uppercase">Não declarado</span>
              </label>
            </div>
            <input {...register("nomePai")} disabled={watch("semPaiDeclarado")} className={`w-full px-5 py-4 rounded-2xl font-bold outline-none border-2 ${watch("semPaiDeclarado") ? "bg-slate-100 text-slate-400 italic" : "bg-white border-transparent focus:border-blue-600"}`} />
          </div>
        </div>

        {/* DADOS FÍSICOS */}
        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
            <select {...register("sexo")} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-600">
              <option value="">...</option><option value="masculino">masculino</option><option value="feminino">feminino</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Etnia</label>
            <select {...register("etnia")} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-600">
              <option value="">...</option><option value="branca">branca</option><option value="preta">preta</option><option value="parda">parda</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso (kg)</label>
              <input type="checkbox" {...register("naoSabePeso")} className="w-3 h-3 rounded text-blue-600" />
            </div>
            <input {...register("peso")} disabled={watchNaoSabePeso} placeholder={watchNaoSabePeso ? "N/P" : "0.0"} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Altura (m)</label>
              <input type="checkbox" {...register("naoSabeAltura")} className="w-3 h-3 rounded text-blue-600" />
            </div>
            <input {...register("altura")} disabled={watchNaoSabeAltura} placeholder={watchNaoSabeAltura ? "N/S" : "0.00"} className="w-full px-5 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl font-bold outline-none focus:border-blue-600 text-blue-900" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turma</label>
            <input {...register("turma")} placeholder="Ex: 5º A" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-600" />
          </div>
        </div>

        {/* GESTANTE */}
        {watchSexo === 'feminino' && (
          <div className="md:col-span-2 p-6 bg-pink-50 rounded-[30px] border-2 border-pink-100 space-y-4 shadow-sm animate-in zoom-in-95">
            <label className="text-[10px] font-black text-pink-600 uppercase flex items-center gap-2 italic"><Baby size={16}/> Informações de Gestação</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select {...register("estaGestante")} className="w-full px-5 py-4 bg-white border-2 border-pink-100 rounded-2xl font-bold outline-none focus:border-pink-400">
                <option value="não">não está gestante</option>
                <option value="sim">sim, está gestante</option>
              </select>
              {watchEstaGestante === 'sim' && (
                <div className="relative animate-in slide-in-from-right-2">
                  <input {...register("semanasGestacao")} type="number" placeholder="Nº de semanas" className="w-full px-5 py-4 bg-white border-2 border-pink-300 rounded-2xl font-black text-pink-700 outline-none focus:border-pink-600" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* PCD */}
        <div className="md:col-span-2 p-6 bg-purple-50 rounded-[35px] border-2 border-purple-100 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-purple-600 uppercase flex items-center gap-2 italic"><Stethoscope size={14}/> Condição PCD & Acessibilidade</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select {...register("isPCD")} className="w-full px-5 py-4 bg-white border-2 border-purple-100 rounded-2xl font-bold outline-none">
              <option value="não">não possui necessidades especiais</option>
              <option value="sim">sim, possui necessidades especiais</option>
            </select>
            {watchIsPCD === 'sim' && (
              <input {...register("numeroCid")} placeholder="CIDs (Ex: F84, G80)" className="w-full px-5 py-4 bg-white border-2 border-purple-300 rounded-2xl font-black text-purple-700 outline-none focus:border-purple-600" />
            )}
          </div>
          
          {watchIsPCD === 'sim' && (
            <div className="space-y-4">
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
                    <button key={cat.id} type="button" onClick={() => {
                        const novos = isSel ? watchCategoriasPCD.filter(i => i !== cat.id) : [...watchCategoriasPCD, cat.id];
                        setValue("categoriasPCD", novos);
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-[20px] border-2 transition-all gap-2 h-[85px] ${isSel ? "border-purple-600 bg-white text-purple-600 shadow-md scale-105" : "border-transparent bg-purple-100/50 text-purple-300 hover:bg-purple-100"}`}>
                      {cat.icon}
                      <span className="font-black text-[8px] uppercase text-center">{cat.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="p-5 bg-white rounded-[25px] border-2 border-purple-100 space-y-3">
                <label className="text-[10px] font-black text-purple-600 uppercase flex items-center gap-2 italic"><Accessibility size={16}/> Locomoção</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["andante sem auxílio", "cadeirante", "uso de muletas", "uso de andador", "prótese física", "paralisia cerebral"].map((item) => (
                    <button key={item} type="button" onClick={() => setValue("detalheFisico", item)}
                      className={`py-3 px-2 rounded-xl border-2 font-bold text-[8px] uppercase transition-all ${watchDetalheFisico === item ? "border-purple-600 bg-purple-600 text-white shadow-md" : "border-purple-50 bg-slate-50 text-slate-400"}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-purple-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <select {...register("tomaMedicao")} className="w-full px-5 py-4 bg-white border-2 border-purple-100 rounded-2xl font-bold outline-none">
                  <option value="não">não utiliza medicação</option>
                  <option value="sim">sim, utiliza medicação</option>
                </select>
                {watchTomaMedicao === 'sim' && (
                  <input {...register("detalhesMedicao")} placeholder="Remédio e Dose" className="w-full px-5 py-4 bg-white border-2 border-purple-200 rounded-2xl font-bold text-purple-700 outline-none" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* CONTATOS */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-200 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-2 italic"><Users size={14}/> Contatos de Emergência</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-5 bg-white rounded-[25px] border border-slate-100">
              <input {...register("contato1_nome", { required: true })} placeholder="Nome do Responsável" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <select {...register("contato1_parentesco")} className="px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none">
                  <option value="mãe">mãe</option><option value="pai">pai</option><option value="avó">avó</option>
                </select>
                <input {...register("contato1_telefone", { required: true })} onChange={(e) => setValue("contato1_telefone", aplicarMascaraTelefone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              </div>
            </div>
            <div className="space-y-3 p-5 bg-white rounded-[25px] border border-slate-100">
              <input {...register("contato2_nome")} placeholder="Nome do Segundo Contato" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <select {...register("contato2_parentesco")} className="px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none">
                  <option value="pai">pai</option><option value="mãe">mãe</option>
                </select>
                <input {...register("contato2_telefone")} onChange={(e) => setValue("contato2_telefone", aplicarMascaraTelefone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ENDEREÇO */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4 shadow-inner">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> Localização</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input {...register("endereco_cep")} placeholder="CEP" className="px-5 py-4 bg-white rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
            <input {...register("endereco_rua")} placeholder="Rua / Avenida" className="md:col-span-2 px-5 py-4 bg-white rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
            <input {...register("endereco_bairro")} placeholder="Bairro / Cidade - UF" className="md:col-span-3 px-5 py-4 bg-white rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
          </div>
        </div>

        {/* ALERGIAS */}
        <div className="md:col-span-2 p-6 bg-red-50 rounded-[30px] border-2 border-red-100 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2 italic"><AlertCircle size={14}/> Alergias & Observações</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select {...register("temAlergia")} className="w-full px-5 py-4 bg-white border-2 border-red-100 rounded-2xl font-bold outline-none">
              <option value="não">não possui alergias</option>
              <option value="sim">sim, possui alergias</option>
            </select>
            {watchTemAlergia === 'sim' && (
              <>
                <input {...register("historicoMedico")} placeholder="Qual alergia?" className="w-full px-5 py-4 bg-white border-2 border-red-200 rounded-2xl font-bold text-red-700 outline-none" />
                <textarea {...register("observacoesAlergia")} placeholder="Sintomas ou cuidados..." className="md:col-span-2 w-full px-5 py-4 bg-white rounded-2xl font-bold text-slate-600 outline-none h-24 resize-none border-2 border-red-100 focus:border-red-400 transition-all" />
              </>
            )}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="md:col-span-2 w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[25px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
          {dadosIniciais ? 'Atualizar Registro' : 'Finalizar Cadastro'}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroAluno;