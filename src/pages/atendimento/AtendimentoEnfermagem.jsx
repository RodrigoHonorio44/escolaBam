import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, ArrowLeft, ClipboardPlus, Loader2, Hospital, Home, 
  Activity, Clock, Calendar, AlertTriangle, Hash, School, 
  User, Users, Briefcase, GraduationCap, UserCheck, Shield, History, Search 
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig'; 
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, query, where, getDocs, limit } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

const AtendimentoEnfermagem = ({ user, onVoltar, onVerHistorico }) => {
  const [loading, setLoading] = useState(false);
  const [tipoAtendimento, setTipoAtendimento] = useState('local');
  const [perfilPaciente, setPerfilPaciente] = useState('aluno');
  const [naoSabeDataNasc, setNaoSabeDataNasc] = useState(false);
  
  // Novos estados para Peso e Altura
  const [naoSabePeso, setNaoSabePeso] = useState(false);
  const [naoSabeAltura, setNaoSabeAltura] = useState(false);

  const [houveMedicacao, setHouveMedicacao] = useState('NÃO');
  const [precisaEncaminhamento, setPrecisaEncaminhamento] = useState('NÃO');
  const [horaInicioReal, setHoraInicioReal] = useState(null);
  const [temCadastro, setTemCadastro] = useState(false);

  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const wrapperRef = useRef(null);

  const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbzatnvLRrgck2e0qnahUKs4qmu8_aZNjg1mIWZV-ivNnf2Q6kLwN4pagy85I5LiwUNt/exec";

  const queixasComuns = [
    "FEBRE", "DOR DE CABEÇA", "DOR ABDOMINAL", "NÁUSEA/VÔMITO", 
    "PEQUENO CURATIVO", "TRAUMA/QUEDA", "CRISE DE ANSIEDADE", 
    "SINTOMAS GRIPAIS", "HIPERTENSÃO", "HIPOGLICEMIA","CÓLICA MENSTRUAL","ENXAQUECA", "OUTROS"
  ];

  const opcoesEncaminhamentoAluno = [
    "VOLTA PARA SALA DE AULA", "ENCAMINHADO PARA CASA", "ORIENTAÇÃO EDUCACIONAL",
    "EDUCAÇÃO PEDAGÓGICA", "PSICÓLOGA", "ASSISTENTE SOCIAL",
    "HOSPITAL CONDE MODESTO", "HOSPITAL CHE GUEVARA", "UPA SANTA RITA", "UPA INOÃ"
  ];

  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return '';
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade >= 0 ? idade.toString() : '';
  };

  const criarIdPaciente = (nome, dataNasc) => {
    const nomeLimpo = nome.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-');
    
    if (dataNasc) {
      const dataLimpa = dataNasc.replace(/-/g, '');
      return `${nomeLimpo}-${dataLimpa}`;
    }
    return `${nomeLimpo}-nd`;
  };

  const validarNomeCompleto = (nome) => {
    const nomeLimpo = nome.trim();
    const partes = nomeLimpo.split(/\s+/);
    return partes.length >= 2 && partes[1].length >= 2;
  };

  const gerarBAENF = () => {
    const ano = 2026; 
    const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = Date.now().toString().slice(-3);
    return `BAENF-${ano}-${aleatorio}${timestamp}`;
  };

  const getInitialState = () => ({
    baenf: gerarBAENF(),
    data: new Date().toISOString().split('T')[0],
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    nomePaciente: '',
    dataNascimento: '',
    idade: '',
    sexo: '',
    turma: '',
    cargo: '',
    temperatura: '',
    etnia: '',        
    peso: '',         
    altura: '',       
    motivoAtendimento: '',
    detheQueixa: '', 
    alunoPossuiAlergia: 'NÃO', 
    qualAlergia: '', 
    procedimentos: '',
    medicacao: '',   
    observacoes: '',
    destinoHospital: '',
    motivoEncaminhamento: '',
    responsavelTransporte: '',
    obsEncaminhamento: '',
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    const buscarSugestoes = async () => {
      const termo = formData.nomePaciente.trim().toUpperCase();
      if (termo.length < 3) {
        setSugestoes([]);
        return;
      }
      try {
        const q = query(
          collection(db, "pastas_digitais"),
          where("nomeBusca", ">=", termo),
          where("nomeBusca", "<=", termo + "\uf8ff"),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const resultados = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSugestoes(resultados);
        setMostrarSugestoes(resultados.length > 0);
      } catch (error) {
        console.error("ERRO NO AUTOCOMPLETE:", error);
      }
    };
    const delay = setTimeout(buscarSugestoes, 400);
    return () => clearTimeout(delay);
  }, [formData.nomePaciente]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setMostrarSugestoes(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selecionarPaciente = (p) => {
    setFormData(prev => ({
      ...prev,
      nomePaciente: (p.nome || p.nomeBusca).toUpperCase(),
      dataNascimento: p.dataNascimento !== "Não informada" ? p.dataNascimento : '',
      sexo: (p.sexo || '').toUpperCase(),
      turma: (p.turma || '').toUpperCase(),
      cargo: (p.cargo || '').toUpperCase(),
      etnia: (p.etnia || '').toUpperCase(),
      peso: p.peso === "NÃO INFORMADO" ? '' : (p.peso || '').toUpperCase(),
      altura: p.altura === "NÃO INFORMADO" ? '' : (p.altura || '').toUpperCase(),
      alunoPossuiAlergia: (p.alunoPossuiAlergia || 'NÃO').toUpperCase(),
      qualAlergia: (p.qualAlergia || '').toUpperCase(),
    }));
    setNaoSabeDataNasc(p.dataNascimento === "Não informada" || p.dataNascimento === "NÃO INFORMADA");
    setNaoSabePeso(p.peso === "NÃO INFORMADO");
    setNaoSabeAltura(p.altura === "NÃO INFORMADO");
    setTemCadastro(true);
    setMostrarSugestoes(false);
    toast.success("DADOS CARREGADOS!");
  };

  useEffect(() => {
    if (formData.nomePaciente.length > 2 && !horaInicioReal) {
      setHoraInicioReal(new Date());
    }
  }, [formData.nomePaciente, horaInicioReal]);

  useEffect(() => {
    if (formData.dataNascimento && !naoSabeDataNasc) {
      const idadeCalculada = calcularIdade(formData.dataNascimento);
      setFormData(prev => ({ ...prev, idade: idadeCalculada }));
    }
  }, [formData.dataNascimento, naoSabeDataNasc]);

  const handleTempChange = (e) => {
    let value = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
    setFormData({...formData, temperatura: value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarNomeCompleto(formData.nomePaciente)) {
      toast.error("ERRO: DIGITE O NOME E O SOBRENOME!");
      return;
    }
    const horaFinalizacao = new Date();
    const tempoTotalMinutos = horaInicioReal ? Math.round((horaFinalizacao - horaInicioReal) / 60000) : 0;
    setLoading(true);
    const loadingToast = toast.loading("REGISTRANDO ATENDIMENTO...");
    try {
      const idPasta = criarIdPaciente(formData.nomePaciente, formData.dataNascimento);
      const payload = {
        baenf: formData.baenf, 
        dataAtendimento: formData.data,
        horarioReferencia: formData.horario,
        horaInicio: horaInicioReal ? horaInicioReal.toLocaleTimeString('pt-BR') : formData.horario,
        horaFinalizacao: horaFinalizacao.toLocaleTimeString('pt-BR'),
        tempoDuracao: `${tempoTotalMinutos} MIN`,
        pacienteId: idPasta,
        nomePaciente: formData.nomePaciente.trim().toUpperCase(),
        dataNascimento: naoSabeDataNasc ? "NÃO INFORMADA" : (formData.dataNascimento || "NÃO INFORMADA"),
        idade: formData.idade,
        sexo: formData.sexo.toUpperCase(),
        etnia: formData.etnia.toUpperCase(),
        peso: naoSabePeso ? "NÃO INFORMADO" : formData.peso, 
        altura: naoSabeAltura ? "NÃO INFORMADO" : formData.altura, 
        perfilPaciente: perfilPaciente.toUpperCase(),
        turma: formData.turma.toUpperCase(),
        cargo: formData.cargo.toUpperCase(),
        temperatura: formData.temperatura,
        alergias: formData.alunoPossuiAlergia === 'SIM' ? formData.qualAlergia.toUpperCase() : 'NÃO POSSUI',
        queixaPrincipal: tipoAtendimento === 'local' ? formData.motivoAtendimento.toUpperCase() : formData.motivoEncaminhamento.toUpperCase(),
        procedimentos: formData.procedimentos.toUpperCase(),
        medicacaoDose: houveMedicacao === 'SIM' ? formData.medicacao.toUpperCase() : 'NENHUMA',
        encaminhamento: precisaEncaminhamento === 'SIM' ? formData.destinoHospital.toUpperCase() : 'NÃO',
        observacoes: formData.observacoes.toUpperCase(),
        escola: (user?.escolaId || "E. M. ANÍSIO TEIXEIRA").toUpperCase(), 
        profissionalNome: (user?.nome || 'PROFISSIONAL').toUpperCase(),
        profissionalRegistro: (user?.registroProfissional || user?.coren || 'NÃO INFORMADO').toUpperCase(),
        statusAtendimento: tipoAtendimento === 'local' ? "FINALIZADO" : "REMOÇÃO/ABERTO",
        tipoRegistro: tipoAtendimento.toUpperCase()
      };

      await addDoc(collection(db, "atendimentos_enfermagem"), { ...payload, createdAt: serverTimestamp() });
      const pastaRef = doc(db, "pastas_digitais", idPasta);
      await setDoc(pastaRef, {
        nome: formData.nomePaciente.toUpperCase(),
        nomeBusca: formData.nomePaciente.toUpperCase(),
        dataNascimento: naoSabeDataNasc ? "NÃO INFORMADA" : (formData.dataNascimento || "NÃO INFORMADA"),
        idade: formData.idade,
        sexo: formData.sexo.toUpperCase(),
        etnia: formData.etnia.toUpperCase(),
        peso: naoSabePeso ? "NÃO INFORMADO" : formData.peso,
        altura: naoSabeAltura ? "NÃO INFORMADO" : formData.altura,
        turma: formData.turma.toUpperCase(),
        cargo: formData.cargo.toUpperCase(),
        alunoPossuiAlergia: formData.alunoPossuiAlergia.toUpperCase(),
        qualAlergia: formData.qualAlergia.toUpperCase(),
        ultimaAtualizacao: serverTimestamp()
      }, { merge: true });

      try {
        await fetch(URL_PLANILHA, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } catch (err) { console.error("ERRO PLANILHA:", err); }

      toast.success(`BAENF ${formData.baenf} SALVO!`, { id: loadingToast });
      setFormData(getInitialState());
      setNaoSabeDataNasc(false); setNaoSabePeso(false); setNaoSabeAltura(false);
      setHoraInicioReal(null); setHouveMedicacao('NÃO'); setPrecisaEncaminhamento('NÃO'); setTemCadastro(false);
    } catch (error) { toast.error("ERRO AO SALVAR.", { id: loadingToast }); console.error(error); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden font-sans antialiased">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="bg-[#0A1629] p-8 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg"><ClipboardPlus size={24} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">FICHA DE <span className="text-blue-500">ATENDIMENTO</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">SISTEMA DE ENFERMAGEM ESCOLAR</p>
          </div>
        </div>
        <div className="flex gap-3">
          {temCadastro && (
            <button type="button" onClick={() => onVerHistorico(criarIdPaciente(formData.nomePaciente, formData.dataNascimento))} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2 tracking-widest text-white">
              <History size={14} /> VER HISTÓRICO
            </button>
          )}
          <button onClick={onVoltar} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black transition-all border border-white/10 flex items-center gap-2 tracking-widest">
            <ArrowLeft size={14} /> VOLTAR
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
        {/* Info Bar */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 font-sans">
          <div className="bg-slate-900 px-6 py-3 rounded-2xl border-2 border-blue-500/30 flex items-center gap-3">
            <Hash size={18} className="text-blue-400" />
            <span className="text-blue-400 font-black tracking-widest text-base uppercase italic tabular-nums">{formData.baenf}</span>
          </div>
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Clock size={18} className="text-slate-600" />
            <span className="text-slate-700 font-bold text-sm uppercase italic tabular-nums">
              INÍCIO: {horaInicioReal ? horaInicioReal.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
            </span>
          </div>
        </div>

        {/* Seletores Perfil/Atendimento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto font-sans">
          <div className="bg-slate-100 p-2 rounded-[25px] flex shadow-inner">
            <button type="button" onClick={() => setPerfilPaciente('aluno')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${perfilPaciente === 'aluno' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>
              <GraduationCap size={18} /> ALUNO
            </button>
            <button type="button" onClick={() => setPerfilPaciente('funcionario')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${perfilPaciente === 'funcionario' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>
              <Briefcase size={18} /> FUNCIONÁRIO
            </button>
          </div>
          <div className="bg-slate-100 p-2 rounded-[25px] flex shadow-inner">
            <button type="button" onClick={() => setTipoAtendimento('local')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${tipoAtendimento === 'local' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>
              <Home size={18} /> LOCAL
            </button>
            <button type="button" onClick={() => setTipoAtendimento('hospital')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${tipoAtendimento === 'hospital' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>
              <Hospital size={18} /> REMOÇÃO
            </button>
          </div>
        </div>

        <div className="space-y-6 font-sans">
          {/* PRIMEIRA LINHA: NOME, NASCIMENTO, IDADE, SEXO */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-2 space-y-2 relative" ref={wrapperRef}>
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2"><Search size={12} className="text-blue-500"/> NOME COMPLETO *</label>
              <input type="text" required placeholder="DIGITE PARA BUSCAR..." className={`w-full border-2 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 outline-none transition-all uppercase ${formData.nomePaciente.trim() !== '' && !validarNomeCompleto(formData.nomePaciente) ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:ring-blue-500 text-slate-900 shadow-sm'}`} value={formData.nomePaciente} onChange={(e) => setFormData({...formData, nomePaciente: e.target.value.toUpperCase()})} onFocus={() => formData.nomePaciente.length >= 3 && setMostrarSugestoes(true)} />
              {mostrarSugestoes && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {sugestoes.map((p) => (
                    <div key={p.id} onClick={() => selecionarPaciente(p)} className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-1 transition-colors">
                      <p className="text-xs font-black text-slate-800 uppercase">{p.nome}</p>
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase italic">
                        <span>{p.turma || p.cargo}</span> <span className="bg-slate-100 px-2 py-0.5 rounded text-blue-600">{p.dataNascimento}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">NASCIMENTO</label>
                <button type="button" onClick={() => { setNaoSabeDataNasc(!naoSabeDataNasc); setFormData({...formData, dataNascimento: '', idade: ''}); }} className={`text-[9px] font-black px-2 py-1 rounded-lg transition-all ${naoSabeDataNasc ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {naoSabeDataNasc ? 'SOUBE A DATA' : 'NÃO SEI A DATA'}
                </button>
              </div>
              <input type="date" disabled={naoSabeDataNasc} className={`w-full rounded-2xl px-5 py-4 text-sm font-bold outline-none border-none tabular-nums ${naoSabeDataNasc ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500'}`} value={formData.dataNascimento} onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">IDADE *</label>
              <input type="number" required readOnly={!naoSabeDataNasc} placeholder={naoSabeDataNasc ? "MANUAL" : "AUTO"} className={`w-full border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none tabular-nums ${!naoSabeDataNasc ? 'bg-slate-100 text-blue-600' : 'bg-orange-50 text-orange-700 ring-2 ring-orange-200'}`} value={formData.idade} onChange={(e) => setFormData({...formData, idade: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">SEXO</label>
              <select required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none uppercase" value={formData.sexo} onChange={(e) => setFormData({...formData, sexo: e.target.value.toUpperCase()})}>
                <option value="">...</option>
                <option value="MASCULINO">MASCULINO</option>
                <option value="FEMININO">FEMININO</option>
              </select>
            </div>
          </div>

          {/* SEGUNDA LINHA: ETNIA, PESO, ALTURA, DATA, HORA, TURMA/CARGO */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">ETNIA *</label>
              <select required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none uppercase" value={formData.etnia} onChange={(e) => setFormData({...formData, etnia: e.target.value.toUpperCase()})}>
                <option value="">...</option>
                <option value="BRANCA">BRANCA</option>
                <option value="PRETA">PRETA</option>
                <option value="PARDA">PARDA</option>
                <option value="AMARELA">AMARELA</option>
                <option value="INDÍGENA">INDÍGENA</option>
              </select>
            </div>
            
            {/* CAMPO PESO COM "NÃO SEI" */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">PESO (KG)</label>
                <button type="button" onClick={() => { setNaoSabePeso(!naoSabePeso); setFormData({...formData, peso: ''}); }} className={`text-[8px] font-black px-1.5 py-0.5 rounded-md transition-all ${naoSabePeso ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {naoSabePeso ? 'SOUBE' : 'NÃO SEI'}
                </button>
              </div>
              <input type="text" disabled={naoSabePeso} placeholder={naoSabePeso ? "N/I" : "00.0"} className={`w-full border-none rounded-2xl px-5 py-4 text-sm font-bold uppercase ${naoSabePeso ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`} value={naoSabePeso ? '' : formData.peso} onChange={(e) => setFormData({...formData, peso: e.target.value.replace(',', '.')})} />
            </div>

            {/* CAMPO ALTURA COM "NÃO SEI" */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">ALTURA (M)</label>
                <button type="button" onClick={() => { setNaoSabeAltura(!naoSabeAltura); setFormData({...formData, altura: ''}); }} className={`text-[8px] font-black px-1.5 py-0.5 rounded-md transition-all ${naoSabeAltura ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {naoSabeAltura ? 'SOUBE' : 'NÃO SEI'}
                </button>
              </div>
              <input type="text" disabled={naoSabeAltura} placeholder={naoSabeAltura ? "N/I" : "0.00"} className={`w-full border-none rounded-2xl px-5 py-4 text-sm font-bold uppercase ${naoSabeAltura ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`} value={naoSabeAltura ? '' : formData.altura} onChange={(e) => setFormData({...formData, altura: e.target.value.replace(',', '.')})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">DATA ATEND.</label>
              <input type="date" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">HORÁRIO</label>
              <input type="time" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums" value={formData.horario} onChange={(e) => setFormData({...formData, horario: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase ml-2 italic tracking-widest">{perfilPaciente === 'aluno' ? 'TURMA *' : 'CARGO *'}</label>
              <input type="text" required placeholder={perfilPaciente === 'aluno' ? "EX: 1001" : "EX: PROFESSOR"} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={perfilPaciente === 'aluno' ? formData.turma : formData.cargo} onChange={(e) => setFormData(perfilPaciente === 'aluno' ? {...formData, turma: e.target.value.toUpperCase()} : {...formData, cargo: e.target.value.toUpperCase()})} />
            </div>
          </div>

          {/* TERCEIRA LINHA: TEMPERATURA E ALERGIA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-500 uppercase ml-2 italic tracking-widest">TEMPERATURA *</label>
              <input type="text" required placeholder="00.0" className="w-full bg-red-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums" value={formData.temperatura} onChange={handleTempChange} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-orange-500 uppercase ml-2 tracking-widest">ALERGIA?</label>
              <select className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={formData.alunoPossuiAlergia} onChange={(e) => setFormData({...formData, alunoPossuiAlergia: e.target.value.toUpperCase(), qualAlergia: e.target.value === 'NÃO' ? '' : formData.qualAlergia.toUpperCase()})}>
                <option value="NÃO">NÃO</option>
                <option value="SIM">SIM</option>
              </select>
            </div>
          </div>
          {formData.alunoPossuiAlergia === 'SIM' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <label className="text-[10px] font-black text-red-600 uppercase ml-2 italic tracking-widest">QUAL ALERGIA? *</label>
              <input type="text" required className="w-full bg-red-50 border-2 border-red-200 rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={formData.qualAlergia} onChange={(e) => setFormData({...formData, qualAlergia: e.target.value.toUpperCase()})} />
            </div>
          )}
        </div>

        {/* ÁREA CLÍNICA */}
        {tipoAtendimento === 'local' ? (
          <div className="space-y-6 font-sans">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
              <Activity size={18} className="text-emerald-500" />
              <span className="font-black uppercase italic tracking-tighter text-lg">ATENDIMENTO NA UNIDADE</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">MOTIVO PRINCIPAL *</label>
                <select required className="w-full bg-blue-50 border-none rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={formData.motivoAtendimento} onChange={(e) => setFormData({...formData, motivoAtendimento: e.target.value.toUpperCase()})}>
                  <option value="">SELECIONE...</option>
                  {queixasComuns.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">PROCEDIMENTOS *</label>
                <input type="text" required className="w-full bg-blue-50/50 border-none rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={formData.procedimentos} onChange={(e) => setFormData({...formData, procedimentos: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-600 uppercase ml-2 tracking-widest">ADMINISTROU MEDICAÇÃO?</label>
                <select className="w-full bg-emerald-50 border-none rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={houveMedicacao} onChange={(e) => setHouveMedicacao(e.target.value.toUpperCase())}>
                  <option value="NÃO">NÃO</option>
                  <option value="SIM">SIM</option>
                </select>
              </div>
              {houveMedicacao === 'SIM' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase ml-2 italic tracking-widest">QUAL MEDICAÇÃO E DOSE?</label>
                  <input type="text" className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={formData.medicacao} onChange={(e) => setFormData({...formData, medicacao: e.target.value.toUpperCase()})} />
                </div>
              )}
              {perfilPaciente === 'aluno' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-orange-600 uppercase ml-2 italic tracking-widest">HOUVE ENCAMINHAMENTO?</label>
                  <select className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={precisaEncaminhamento} onChange={(e) => setPrecisaEncaminhamento(e.target.value.toUpperCase())}>
                    <option value="NÃO">NÃO</option>
                    <option value="SIM">SIM</option>
                  </select>
                </div>
              )}
              {precisaEncaminhamento === 'SIM' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-orange-600 uppercase ml-2 italic tracking-widest">DESTINO</label>
                  <select className="w-full bg-orange-50 border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={formData.destinoHospital} onChange={(e) => setFormData({...formData, destinoHospital: e.target.value.toUpperCase()})}>
                    <option value="">SELECIONE...</option>
                    {opcoesEncaminhamentoAluno.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">OBSERVAÇÕES ADICIONAIS</label>
                <textarea rows="2" className="w-full bg-blue-50/50 border-none rounded-2xl px-5 py-4 text-sm font-bold resize-none outline-none uppercase" placeholder="DETALHES..." value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value.toUpperCase()})} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 font-sans">
            <div className="flex items-center gap-2 text-orange-600 border-b border-orange-100 pb-4">
              <AlertTriangle size={18} />
              <span className="font-black uppercase italic tracking-tighter text-lg">REMOÇÃO / ENCAMINHAMENTO</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2 tracking-widest">UNIDADE DE DESTINO</label>
                <select required className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={formData.destinoHospital} onChange={(e) => setFormData({...formData, destinoHospital: e.target.value.toUpperCase()})}>
                  <option value="">SELECIONE...</option>
                  <option value="HOSPITAL CONDE MODESTO LEAL">HOSPITAL CONDE MODESTO LEAL</option>
                  <option value="UPA INOÃ">UPA INOÃ</option>
                  <option value="SAMU">SAMU / RESGATE</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2 tracking-widest">MOTIVO DA REMOÇÃO</label>
                <input type="text" className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold uppercase" value={formData.motivoEncaminhamento} onChange={(e) => setFormData({...formData, motivoEncaminhamento: e.target.value.toUpperCase()})} />
              </div>
            </div>
          </div>
        )}

        {/* ASSINATURA E SALVAMENTO */}
        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 font-sans">
          <div className="flex items-center gap-4 bg-slate-900 px-8 py-5 rounded-[25px] border-2 border-blue-500/20 w-full md:w-auto shadow-xl">
            <div className="bg-blue-600 p-2.5 rounded-xl"><UserCheck size={22} className="text-white" /></div>
            <div className="flex flex-col">
              <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mb-0.5">ASSINATURA DIGITAL BAENF</span>
              <p className="text-white font-black text-lg uppercase italic leading-none tracking-tight">{(user?.nome || 'PROFISSIONAL').toUpperCase()}</p>
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.1em] mt-1">
                {(user?.cargo || 'ENFERMAGEM').toUpperCase()} — REG: <span className="tabular-nums">{(user?.registroProfissional || 'MED-2026').toUpperCase()}</span>
              </span>
            </div>
          </div>
          <button type="submit" disabled={loading} className={`w-full md:w-auto px-16 py-6 rounded-[30px] font-black uppercase italic tracking-[0.15em] text-xs transition-all shadow-2xl flex items-center justify-center gap-4 ${tipoAtendimento === 'local' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'} text-white`}>
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? 'SALVANDO...' : 'FINALIZAR ATENDIMENTO'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AtendimentoEnfermagem;