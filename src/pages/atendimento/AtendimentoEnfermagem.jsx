import React, { useState, useEffect } from 'react';
import { 
  Save, ArrowLeft, ClipboardPlus, Loader2, Hospital, Home, 
  Activity, Clock, Calendar, AlertTriangle, Hash, School, 
  User, Users, Briefcase, GraduationCap, UserCheck, Shield 
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

const AtendimentoEnfermagem = ({ user, onVoltar }) => {
  const [loading, setLoading] = useState(false);
  const [tipoAtendimento, setTipoAtendimento] = useState('local');
  const [perfilPaciente, setPerfilPaciente] = useState('aluno');

  const [houveMedicacao, setHouveMedicacao] = useState('Não');
  const [precisaEncaminhamento, setPrecisaEncaminhamento] = useState('Não');

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
    idade: '',
    sexo: '',
    turma: '',
    cargo: '',
    temperatura: '',
    motivoAtendimento: '',
    detalheQueixa: '',
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

  useEffect(() => {
    if (!loading && formData.nomePaciente === '') {
      const timer = setInterval(() => {
        setFormData(prev => ({
          ...prev,
          horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }));
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [loading, formData.nomePaciente]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Registrando atendimento...");

    try {
      const nomeLimpo = formData.nomePaciente.trim();
      const payload = {
        ...formData,
        nomePaciente: nomeLimpo,
        nomePacienteBusca: nomeLimpo.toUpperCase(),
        perfilPaciente,
        relatoCurto: tipoAtendimento === 'local' ? formData.motivoAtendimento : formData.motivoEncaminhamento,
        dataAtendimento: formData.data,
        encaminhadoHospital: tipoAtendimento === 'hospital' ? 'sim' : 'não',
        statusAtendimento: tipoAtendimento === 'hospital' ? 'Encaminhado/Em Aberto' : 'Finalizado',
        escola: user?.escolaId || "E. M. Anísio Teixeira", 
        escolaId: user?.escolaId || 'E. M. Anísio Teixeira',
        profissionalNome: user?.nome || 'Profissional',
        profissionalRegistro: user?.registroProfissional || user?.coren || 'Não Informado',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "atendimentos_enfermagem"), {
        ...payload,
        createdAt: serverTimestamp()
      });

      try {
        await fetch(URL_PLANILHA, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      } catch (err) { console.error(err); }
      
      toast.success(`BAENF ${formData.baenf} salvo!`, { id: loadingToast });
      setFormData(getInitialState());
      setHouveMedicacao('Não');
      setPrecisaEncaminhamento('Não');
    } catch (error) {
      toast.error("Erro ao salvar.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-500">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-[#0A1629] p-8 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
            <ClipboardPlus size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Ficha de <span className="text-blue-500">Atendimento</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">SISTEMA DE ENFERMAGEM ESCOLAR</p>
          </div>
        </div>
        <button onClick={onVoltar} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black transition-all border border-white/10 flex items-center gap-2">
          <ArrowLeft size={14} /> VOLTAR
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
        
        {/* INFO BAR */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <div className="bg-slate-900 px-6 py-3 rounded-2xl border-2 border-blue-500/30 flex items-center gap-3">
            <Hash size={18} className="text-blue-400" />
            <span className="text-blue-400 font-black tracking-widest text-base uppercase italic">{formData.baenf}</span>
          </div>
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3">
            <School size={18} className="text-slate-600" />
            <span className="text-slate-700 font-black text-sm uppercase italic">{user?.escolaId || "E. M. Anísio Teixeira"}</span>
          </div>
        </div>

        {/* SELETORES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-100 p-2 rounded-[25px] flex shadow-inner">
            <button type="button" onClick={() => setPerfilPaciente('aluno')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all ${perfilPaciente === 'aluno' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>
              <GraduationCap size={18} /> ALUNO
            </button>
            <button type="button" onClick={() => setPerfilPaciente('funcionario')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all ${perfilPaciente === 'funcionario' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>
              <Briefcase size={18} /> FUNCIONÁRIO
            </button>
          </div>
          <div className="bg-slate-100 p-2 rounded-[25px] flex shadow-inner">
            <button type="button" onClick={() => setTipoAtendimento('local')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all ${tipoAtendimento === 'local' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>
              <Home size={18} /> LOCAL
            </button>
            <button type="button" onClick={() => setTipoAtendimento('hospital')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all ${tipoAtendimento === 'hospital' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>
              <Hospital size={18} /> REMOÇÃO
            </button>
          </div>
        </div>

        {/* IDENTIFICAÇÃO DO PACIENTE */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome Completo</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Maria Oliveira dos Santos"
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-300 placeholder:font-medium" 
                value={formData.nomePaciente} 
                onChange={(e) => setFormData({...formData, nomePaciente: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Idade</label>
              <input 
                type="number" 
                placeholder="Ex: 14"
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-300 placeholder:font-medium" 
                value={formData.idade} 
                onChange={(e) => setFormData({...formData, idade: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sexo</label>
              <select required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={formData.sexo} onChange={(e) => setFormData({...formData, sexo: e.target.value})}>
                <option value="">Selecione...</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Data</label>
              <input type="date" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Horário</label>
              <input type="time" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.horario} onChange={(e) => setFormData({...formData, horario: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase ml-2 italic">{perfilPaciente === 'aluno' ? 'Turma' : 'Cargo'}</label>
              <input 
                type="text" 
                placeholder={perfilPaciente === 'aluno' ? "Ex: 8º Ano B" : "Ex: Inspetor"}
                className="w-full bg-blue-50/50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-blue-200 placeholder:font-medium" 
                value={perfilPaciente === 'aluno' ? formData.turma : formData.cargo} 
                onChange={(e) => setFormData(perfilPaciente === 'aluno' ? {...formData, turma: e.target.value} : {...formData, cargo: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-500 uppercase ml-2">Temp.</label>
              <input 
                type="text" 
                placeholder="36.5°C"
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-300 placeholder:font-medium" 
                value={formData.temperatura} 
                onChange={(e) => setFormData({...formData, temperatura: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-orange-500 uppercase ml-2">Alergia?</label>
              <select className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer" value={formData.alunoPossuiAlergia} onChange={(e) => setFormData({...formData, alunoPossuiAlergia: e.target.value})}>
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </select>
            </div>
          </div>
          {formData.alunoPossuiAlergia === 'Sim' && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-orange-600 uppercase ml-2">Descreva a Alergia</label>
              <input 
                type="text" 
                placeholder="Ex: Dipirona, Corante Vermelho, Poeira..." 
                className="w-full bg-orange-50 border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none placeholder:text-orange-200" 
                value={formData.qualAlergia} 
                onChange={(e) => setFormData({...formData, qualAlergia: e.target.value})} 
              />
            </div>
          )}
        </div>

        {/* ÁREA CLÍNICA */}
        {tipoAtendimento === 'local' ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
              <Activity size={18} className="text-emerald-500" />
              <span className="font-black uppercase italic tracking-tighter">Atendimento na Unidade</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Motivo Principal</label>
                <select required className="w-full bg-blue-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={formData.motivoAtendimento} onChange={(e) => setFormData({...formData, motivoAtendimento: e.target.value})}>
                  <option value="">Selecione...</option>
                  {queixasComuns.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Procedimentos</label>
                <input 
                  type="text" 
                  placeholder="Ex: Higienização, Aferição de PA, Repouso..."
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-300 placeholder:font-medium" 
                  value={formData.procedimentos} 
                  onChange={(e) => setFormData({...formData, procedimentos: e.target.value})} 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-600 uppercase ml-2">Administrou Medicação?</label>
                <select className="w-full bg-emerald-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer" value={houveMedicacao} onChange={(e) => setHouveMedicacao(e.target.value)}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>
              {houveMedicacao === 'Sim' && (
                <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                  <label className="text-[10px] font-black text-emerald-600 uppercase ml-2">Qual Medicação e Dose?</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Paracetamol 500mg (1 comprimido)"
                    className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none placeholder:text-emerald-200" 
                    value={formData.medicacao} 
                    onChange={(e) => setFormData({...formData, medicacao: e.target.value})} 
                  />
                </div>
              )}
              
              {perfilPaciente === 'aluno' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-orange-600 uppercase ml-2 italic">Houve Encaminhamento?</label>
                  <select className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer" value={precisaEncaminhamento} onChange={(e) => setPrecisaEncaminhamento(e.target.value)}>
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
              )}
              {precisaEncaminhamento === 'Sim' && (
                <div className="space-y-2 animate-in zoom-in-95 duration-300">
                  <label className="text-[10px] font-black text-orange-600 uppercase ml-2 italic">Destino</label>
                  <select className="w-full bg-orange-50 border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none cursor-pointer" value={formData.destinoHospital} onChange={(e) => setFormData({...formData, destinoHospital: e.target.value})}>
                    <option value="">Selecione...</option>
                    {opcoesEncaminhamentoAluno.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Observações Adicionais</label>
                <textarea 
                  rows="2" 
                  placeholder="Relate aqui detalhes importantes sobre a evolução do paciente no atendimento..."
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-slate-300" 
                  value={formData.observacoes} 
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})} 
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-orange-600 border-b border-orange-100 pb-4">
              <AlertTriangle size={18} />
              <span className="font-black uppercase italic tracking-tighter">Remoção / Encaminhamento</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2">Unidade de Destino</label>
                <select required className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer" value={formData.destinoHospital} onChange={(e) => setFormData({...formData, destinoHospital: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="Hospital Conde Modesto Leal">Hospital Conde Modesto Leal</option>
                  <option value="UPA Inoã">UPA Inoã</option>
                  <option value="Samu">Samu / Resgate</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2">Motivo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Suspeita de fratura, desconforto respiratório grave..."
                  className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none placeholder:text-orange-200" 
                  value={formData.motivoEncaminhamento} 
                  onChange={(e) => setFormData({...formData, motivoEncaminhamento: e.target.value})} 
                />
              </div>
            </div>
          </div>
        )}

        {/* ✅ ASSINATURA E SALVAR */}
        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 bg-slate-900 px-8 py-5 rounded-[25px] border-2 border-blue-500/20 w-full md:w-auto shadow-xl">
            <div className="bg-blue-600 p-2.5 rounded-xl">
              <UserCheck size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mb-0.5">Assinatura Digital BAENF</span>
              <p className="text-white font-black text-base uppercase italic tracking-tight leading-none mb-1">
                {user?.nome || 'Profissional não Identificado'}
              </p>
              <div className="flex items-center gap-2">
                <Shield size={10} className="text-emerald-400" />
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest leading-none">
                  {user?.cargo || 'Enfermagem'} — REG: {user?.registroProfissional || user?.coren || 'MED-2026-X'}
                </span>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full md:w-auto px-16 py-6 rounded-[30px] font-black uppercase italic tracking-[0.2em] text-xs transition-all shadow-2xl flex items-center justify-center gap-4 ${tipoAtendimento === 'local' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'} text-white active:scale-95`}>
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                <Save size={18} /> Confirmar e Salvar Registro
              </>
            )}
          </button>
        </div>
      </form>
      
      <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">RODHON — GESTÃO INTELIGENTE 2026</p>
      </div>
    </div>
  );
};

export default AtendimentoEnfermagem;