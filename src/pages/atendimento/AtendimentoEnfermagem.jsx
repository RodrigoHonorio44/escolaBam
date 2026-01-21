import React, { useState, useEffect } from 'react';
import { 
  Save, ArrowLeft, ClipboardPlus, Loader2, Hospital, Home, 
  Activity, Clock, Calendar, AlertTriangle, Hash, School, 
  User, Users, Briefcase, GraduationCap, UserCheck, Shield, History
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig'; 
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

const AtendimentoEnfermagem = ({ user, onVoltar, onVerHistorico }) => {
  const [loading, setLoading] = useState(false);
  const [tipoAtendimento, setTipoAtendimento] = useState('local');
  const [perfilPaciente, setPerfilPaciente] = useState('aluno');
  const [naoSabeDataNasc, setNaoSabeDataNasc] = useState(false);
  const [houveMedicacao, setHouveMedicacao] = useState('Não');
  const [precisaEncaminhamento, setPrecisaEncaminhamento] = useState('Não');
  const [horaInicioReal, setHoraInicioReal] = useState(null);
  const [temCadastro, setTemCadastro] = useState(false); // Novo: controla se exibe o botão histórico

  const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbwSkF-qYcbfqwivCBROWl3BKZta_0uyhvvVZXmGU_9Sfcu_sxxxe_LAbMRU0ZW0bUkg/exec";

  const queixasComuns = [
    "Febre", "Dor de Cabeça", "Dor Abdominal", "Náusea/Vômito", 
    "Pequeno Curativo", "Trauma/Queda", "Crise de Ansiedade", 
    "Sintomas Gripais", "Hipertensão", "Hipoglicemia","Cólica menstrual","Enxaqueca", "Outros"
  ];

  const opcoesEncaminhamentoAluno = [
    "Volta para sala de aula", "Encaminhado para casa", "Orientação Educacional",
    "Educação Pedagógica", "Psicóloga", "Assistente Social",
    "Hospital Conde Modesto", "Hospital Che Guevara", "Upa Santa Rita", "Upa Inoã"
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
    } else {
      const sufixo = "nd"; // Padronizado para facilitar busca de parciais
      return `${nomeLimpo}-${sufixo}`;
    }
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
    motivoAtendimento: '',
    detheQueixa: '', 
    alunoPossuiAlergia: 'Não', 
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

  // Lógica de buscar dados automaticamente
  useEffect(() => {
    const buscarDadosAutomaticos = async () => {
      if (validarNomeCompleto(formData.nomePaciente) && (formData.dataNascimento || naoSabeDataNasc)) {
        const idPasta = criarIdPaciente(formData.nomePaciente, formData.dataNascimento);
        
        try {
          const docRef = doc(db, "pastas_digitais", idPasta);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const dados = docSnap.data();
            setTemCadastro(true);
            toast.success("Prontuário encontrado!", { icon: '📂' });

            setFormData(prev => ({
              ...prev,
              sexo: dados.sexo || prev.sexo,
              turma: dados.turma || prev.turma,
              cargo: dados.cargo || prev.cargo,
              alunoPossuiAlergia: dados.alunoPossuiAlergia || 'Não',
              qualAlergia: dados.qualAlergia || '',
            }));
          } else {
            setTemCadastro(false);
          }
        } catch (error) {
          console.error("Erro busca:", error);
        }
      }
    };

    const delayDebounce = setTimeout(buscarDadosAutomaticos, 1200);
    return () => clearTimeout(delayDebounce);
  }, [formData.nomePaciente, formData.dataNascimento, naoSabeDataNasc]);

  useEffect(() => {
    if (formData.nomePaciente.length > 2 && !horaInicioReal) {
      setHoraInicioReal(new Date());
    }
  }, [formData.nomePaciente]);

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
      toast.error("ERRO: Digite o nome e o sobrenome!");
      return;
    }

    const horaFinalizacao = new Date();
    const tempoTotalMinutos = horaInicioReal 
      ? Math.round((horaFinalizacao - horaInicioReal) / 60000) 
      : 0;

    setLoading(true);
    const loadingToast = toast.loading("Registrando atendimento...");
    
    try {
      const idPasta = criarIdPaciente(formData.nomePaciente, formData.dataNascimento);
      
      const payload = {
        ...formData,
        horaInicio: horaInicioReal ? horaInicioReal.toLocaleTimeString('pt-BR') : formData.horario,
        horaFinalizacao: horaFinalizacao.toLocaleTimeString('pt-BR'),
        tempoDuracao: `${tempoTotalMinutos} min`,
        pacienteId: idPasta,
        nomePacienteBusca: formData.nomePaciente.trim().toUpperCase(),
        perfilPaciente,
        relatoCurto: tipoAtendimento === 'local' ? formData.motivoAtendimento : formData.motivoEncaminhamento,
        dataAtendimento: formData.data,
        escola: user?.escolaId || "E. M. Anísio Teixeira", 
        profissionalNome: user?.nome || 'Profissional',
        profissionalRegistro: user?.registroProfissional || user?.coren || 'Não Informado',
        statusAtendimento: tipoAtendimento === 'local' ? "Finalizado" : "Aberto",
        encaminhadoHospital: tipoAtendimento === 'hospital' ? 'sim' : 'não',
      };

      // 1. Salva na coleção de atendimentos (Histórico Geral)
      await addDoc(collection(db, "atendimentos_enfermagem"), { 
        ...payload, 
        createdAt: serverTimestamp() 
      });

      // 2. Atualiza a "Capa" da Pasta Digital (Dados que podem ter mudado)
      const pastaRef = doc(db, "pastas_digitais", idPasta);
      await setDoc(pastaRef, {
        nome: formData.nomePaciente,
        nomeBusca: formData.nomePaciente.toUpperCase(),
        dataNascimento: formData.dataNascimento || "Não informada",
        idade: formData.idade,
        sexo: formData.sexo,
        turma: formData.turma,
        cargo: formData.cargo,
        alunoPossuiAlergia: formData.alunoPossuiAlergia,
        qualAlergia: formData.qualAlergia,
        ultimaAtualizacao: serverTimestamp()
      }, { merge: true });

      try {
        await fetch(URL_PLANILHA, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      } catch (err) { console.error("Erro Planilha:", err); }
      
      toast.success(`BAENF ${formData.baenf} salvo!`, { id: loadingToast });
      
      setFormData(getInitialState());
      setNaoSabeDataNasc(false);
      setHoraInicioReal(null);
      setHouveMedicacao('Não');
      setPrecisaEncaminhamento('Não');
      setTemCadastro(false);
      
    } catch (error) { 
      toast.error("Erro ao salvar.", { id: loadingToast }); 
      console.error(error);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden font-sans antialiased">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-[#0A1629] p-8 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
            <ClipboardPlus size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Ficha de <span className="text-blue-500">Atendimento</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">SISTEMA DE ENFERMAGEM ESCOLAR</p>
          </div>
        </div>
        <div className="flex gap-3">
            {temCadastro && (
                <button 
                    type="button"
                    onClick={() => onVerHistorico(criarIdPaciente(formData.nomePaciente, formData.dataNascimento))}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2 tracking-widest text-white"
                >
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
              Início: {horaInicioReal ? horaInicioReal.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
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

        {/* IDENTIFICAÇÃO DO PACIENTE */}
        <div className="space-y-6 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nome Completo *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Maria Silva" 
                className={`w-full border-2 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 outline-none transition-all ${
                  formData.nomePaciente.trim() !== '' && !validarNomeCompleto(formData.nomePaciente)
                    ? 'bg-red-50 border-red-500 text-red-900' 
                    : 'bg-slate-50 border-transparent focus:ring-blue-500 text-slate-900'
                }`} 
                value={formData.nomePaciente} 
                onChange={(e) => setFormData({...formData, nomePaciente: e.target.value})} 
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">Nascimento</label>
                <button type="button" onClick={() => { setNaoSabeDataNasc(!naoSabeDataNasc); setFormData({...formData, dataNascimento: '', idade: ''}); }} className={`text-[9px] font-black px-2 py-1 rounded-lg transition-all ${naoSabeDataNasc ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {naoSabeDataNasc ? 'SOUBE A DATA' : 'NÃO SEI A DATA'}
                </button>
              </div>
              <input type="date" disabled={naoSabeDataNasc} className={`w-full rounded-2xl px-5 py-4 text-sm font-bold outline-none border-none tabular-nums ${naoSabeDataNasc ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500'}`} value={formData.dataNascimento} onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Idade *</label>
              <input type="number" required readOnly={!naoSabeDataNasc} placeholder={naoSabeDataNasc ? "Manual" : "Auto"} className={`w-full border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none tabular-nums ${!naoSabeDataNasc ? 'bg-slate-100 text-blue-600' : 'bg-orange-50 text-orange-700 ring-2 ring-orange-200'}`} value={formData.idade} onChange={(e) => setFormData({...formData, idade: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Sexo</label>
              <select required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.sexo} onChange={(e) => setFormData({...formData, sexo: e.target.value})}>
                <option value="">...</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Data Atend.</label>
              <input type="date" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Horário</label>
              <input type="time" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums" value={formData.horario} onChange={(e) => setFormData({...formData, horario: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase ml-2 italic tracking-widest">{perfilPaciente === 'aluno' ? 'Turma *' : 'Cargo *'}</label>
              <input 
                type="text" 
                required 
                placeholder={perfilPaciente === 'aluno' ? "Ex: 1001" : "Ex: Professor"}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums"
                value={perfilPaciente === 'aluno' ? formData.turma : formData.cargo} 
                onChange={(e) => setFormData(perfilPaciente === 'aluno' ? {...formData, turma: e.target.value} : {...formData, cargo: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-500 uppercase ml-2 italic tracking-widest">Temperatura *</label>
              <input 
                type="text" 
                required 
                placeholder="00.0"
                className="w-full bg-red-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums"
                value={formData.temperatura} 
                onChange={handleTempChange} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-orange-500 uppercase ml-2 tracking-widest">Alergia?</label>
              <select className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={formData.alunoPossuiAlergia} onChange={(e) => setFormData({...formData, alunoPossuiAlergia: e.target.value, qualAlergia: e.target.value === 'Não' ? '' : formData.qualAlergia})}>
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </select>
            </div>
          </div>
          
          {formData.alunoPossuiAlergia === 'Sim' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-[10px] font-black text-red-600 uppercase ml-2 italic tracking-widest">Qual Alergia? *</label>
                <input type="text" required className="w-full bg-red-50 border-2 border-red-200 rounded-2xl px-5 py-4 text-sm font-bold" value={formData.qualAlergia} onChange={(e) => setFormData({...formData, qualAlergia: e.target.value})} />
              </div>
          )}
        </div>

        {/* ÁREA CLÍNICA */}
        {tipoAtendimento === 'local' ? (
          <div className="space-y-6 font-sans">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
              <Activity size={18} className="text-emerald-500" />
              <span className="font-black uppercase italic tracking-tighter text-lg">Atendimento na Unidade</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Motivo Principal *</label>
                <select required className="w-full bg-blue-50 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={formData.motivoAtendimento} onChange={(e) => setFormData({...formData, motivoAtendimento: e.target.value})}>
                  <option value="">Selecione...</option>
                  {queixasComuns.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Procedimentos *</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-blue-50/50 border-none rounded-2xl px-5 py-4 text-sm font-medium" 
                  value={formData.procedimentos} 
                  onChange={(e) => setFormData({...formData, procedimentos: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-600 uppercase ml-2 tracking-widest">Administrou Medicação?</label>
                <select className="w-full bg-emerald-50 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={houveMedicacao} onChange={(e) => setHouveMedicacao(e.target.value)}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>
              {houveMedicacao === 'Sim' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase ml-2 italic tracking-widest">Qual Medicação e Dose?</label>
                  <input type="text" className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-5 py-4 text-sm font-bold" value={formData.medicacao} onChange={(e) => setFormData({...formData, medicacao: e.target.value})} />
                </div>
              )}
              {perfilPaciente === 'aluno' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-orange-600 uppercase ml-2 italic tracking-widest">Houve Encaminhamento?</label>
                  <select className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={precisaEncaminhamento} onChange={(e) => setPrecisaEncaminhamento(e.target.value)}>
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
              )}
              {precisaEncaminhamento === 'Sim' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-orange-600 uppercase ml-2 italic tracking-widest">Destino</label>
                  <select className="w-full bg-orange-50 border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-bold" value={formData.destinoHospital} onChange={(e) => setFormData({...formData, destinoHospital: e.target.value})}>
                    <option value="">Selecione...</option>
                    {opcoesEncaminhamentoAluno.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Observações Adicionais</label>
                <textarea rows="2" className="w-full bg-blue-50/50 border-none rounded-2xl px-5 py-4 text-sm font-medium resize-none outline-none" placeholder="Detalhes..." value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 font-sans">
            <div className="flex items-center gap-2 text-orange-600 border-b border-orange-100 pb-4">
              <AlertTriangle size={18} />
              <span className="font-black uppercase italic tracking-tighter text-lg">Remoção / Encaminhamento</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2 tracking-widest">Unidade de Destino</label>
                <select required className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={formData.destinoHospital} onChange={(e) => setFormData({...formData, destinoHospital: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="Hospital Conde Modesto Leal">Hospital Conde Modesto Leal</option>
                  <option value="UPA Inoã">UPA Inoã</option>
                  <option value="Samu">Samu / Resgate</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2 tracking-widest">Motivo da Remoção</label>
                <input type="text" className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={formData.motivoEncaminhamento} onChange={(e) => setFormData({...formData, motivoEncaminhamento: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {/* ASSINATURA E BOTÃO SALVAR */}
        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 font-sans">
          <div className="flex items-center gap-4 bg-slate-900 px-8 py-5 rounded-[25px] border-2 border-blue-500/20 w-full md:w-auto shadow-xl">
            <div className="bg-blue-600 p-2.5 rounded-xl"><UserCheck size={22} className="text-white" /></div>
            <div className="flex flex-col">
              <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mb-0.5">Assinatura Digital BAENF</span>
              <p className="text-white font-black text-lg uppercase italic leading-none tracking-tight">{user?.nome || 'Profissional'}</p>
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.1em] mt-1">
                {user?.cargo || 'Enfermagem'} — REG: <span className="tabular-nums">{user?.registroProfissional || 'MED-2026'}</span>
              </span>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full md:w-auto px-16 py-6 rounded-[30px] font-black uppercase italic tracking-[0.15em] text-xs transition-all shadow-2xl flex items-center justify-center gap-4 ${tipoAtendimento === 'local' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'} text-white active:scale-95`}>
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Confirmar e Salvar Registro</>}
          </button>
        </div>
      </form>
      <div className="bg-slate-50 p-4 text-center border-t border-slate-100 font-sans">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">RODHON — GESTÃO INTELIGENTE 2026</p>
      </div>
    </div>
  );
};

export default AtendimentoEnfermagem;