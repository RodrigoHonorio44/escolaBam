import React, { useState, useEffect } from 'react';
import { 
  Save, ArrowLeft, ClipboardPlus, Loader2, Hospital, Home, 
  Activity, Clock, Calendar, AlertTriangle, Hash, School, 
  User, Users, Briefcase, GraduationCap, UserCheck 
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

const AtendimentoEnfermagem = ({ user, onVoltar }) => {
  const [loading, setLoading] = useState(false);
  const [tipoAtendimento, setTipoAtendimento] = useState('local');
  const [perfilPaciente, setPerfilPaciente] = useState('aluno'); // 'aluno' ou 'funcionario'

  // Função para gerar número do BAM aleatório
  const gerarBAM = () => {
    const ano = new Date().getFullYear();
    const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = Date.now().toString().slice(-3);
    return `BAM-${ano}-${aleatorio}${timestamp}`;
  };

  const getInitialState = () => ({
    bam: gerarBAM(),
    data: new Date().toISOString().split('T')[0],
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    nomePaciente: '',
    idade: '',
    sexo: '',
    turma: '',
    cargo: '',
    temperatura: '',
    motivoAtendimento: '',
    procedimentos: '',
    medicacao: '',
    observacoes: '',
    destinoHospital: '',
    motivoEncaminhamento: '',
    responsavelTransporte: '',
    obsEncaminhamento: '',
  });

  const [formData, setFormData] = useState(getInitialState());

  // Atualiza o horário automaticamente enquanto o nome estiver vazio
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
      const payload = {
        ...formData,
        perfilPaciente,
        encaminhadoHospital: tipoAtendimento === 'hospital' ? 'sim' : 'não',
        statusAtendimento: tipoAtendimento === 'hospital' ? 'Encaminhado/Em Aberto' : 'Finalizado',
        escola: "E. M. Anísio Teixeira", 
        escolaId: user?.escolaId || '',
        profissionalNome: user?.nome || 'Profissional',
        profissionalEmail: user?.email || '',
        profissionalCargo: user?.cargo || 'Enfermagem',
        userId: user?.uid || '',
        createdAt: serverTimestamp() 
      };

      await addDoc(collection(db, "atendimentos_enfermagem"), payload);
      
      toast.success(`BAM ${formData.bam} salvo com sucesso!`, { id: loadingToast });
      
      // Reseta e gera novo número automaticamente
      setFormData(getInitialState());
      setTipoAtendimento('local');
    } catch (error) {
      console.error(error);
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
        
        {/* INFO BAR: BAM + ESCOLA */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <div className="bg-slate-900 px-6 py-3 rounded-2xl border-2 border-blue-500/30 flex items-center gap-3 shadow-xl">
            <Hash size={18} className="text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Número do Registro</span>
              <span className="text-blue-400 font-black tracking-widest text-base uppercase italic">{formData.bam}</span>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
            <School size={18} className="text-slate-600" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Unidade Escolar</span>
              <span className="text-slate-700 font-black text-sm uppercase italic">E. M. Anísio Teixeira</span>
            </div>
          </div>
        </div>

        {/* SELETORES: QUEM E ONDE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Perfil do Paciente */}
          <div className="bg-slate-100 p-2 rounded-[25px] flex shadow-inner border border-slate-200">
            <button type="button" onClick={() => setPerfilPaciente('aluno')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all ${perfilPaciente === 'aluno' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>
              <GraduationCap size={18} /> ALUNO
            </button>
            <button type="button" onClick={() => setPerfilPaciente('funcionario')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all ${perfilPaciente === 'funcionario' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>
              <Briefcase size={18} /> FUNCIONÁRIO
            </button>
          </div>

          {/* Tipo de Atendimento */}
          <div className="bg-slate-100 p-2 rounded-[25px] flex shadow-inner border border-slate-200">
            <button type="button" onClick={() => setTipoAtendimento('local')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all ${tipoAtendimento === 'local' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>
              <Home size={18} /> LOCAL
            </button>
            <button type="button" onClick={() => setTipoAtendimento('hospital')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all ${tipoAtendimento === 'hospital' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>
              <Hospital size={18} /> REMOÇÃO
            </button>
          </div>
        </div>

        {/* DADOS IDENTIFICAÇÃO */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome do {perfilPaciente === 'aluno' ? 'Aluno' : 'Funcionário'}</label>
              <input type="text" required placeholder="Nome Completo" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.nomePaciente} onChange={(e) => setFormData({...formData, nomePaciente: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Idade</label>
              <input type="number" placeholder="Anos" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.idade} onChange={(e) => setFormData({...formData, idade: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sexo</label>
              <select required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.sexo} onChange={(e) => setFormData({...formData, sexo: e.target.value})}>
                <option value="">Selecione...</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Calendar size={12}/> Data</label>
              <input type="date" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Clock size={12}/> Horário</label>
              <input type="time" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.horario} onChange={(e) => setFormData({...formData, horario: e.target.value})} />
            </div>
            {perfilPaciente === 'aluno' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase ml-2 italic">Turma</label>
                <input type="text" placeholder="Ex: 1001" className="w-full bg-blue-50/50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.turma} onChange={(e) => setFormData({...formData, turma: e.target.value})} />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-500 uppercase ml-2 italic">Cargo</label>
                <input type="text" placeholder="Ex: Professor" className="w-full bg-indigo-50/50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-500 uppercase ml-2">Temperatura</label>
              <input type="text" placeholder="36.5" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.temperatura} onChange={(e) => setFormData({...formData, temperatura: e.target.value})} />
            </div>
          </div>
        </div>

        {/* ÁREA CLÍNICA DINÂMICA */}
        {tipoAtendimento === 'local' ? (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
              <Activity size={18} className="text-emerald-500" />
              <span className="font-black uppercase italic tracking-tighter">Atendimento na Unidade</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Motivo / Queixa</label>
                <textarea rows="3" className="w-full bg-slate-50 border-none rounded-[25px] px-6 py-5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={formData.motivoAtendimento} onChange={(e) => setFormData({...formData, motivoAtendimento: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Procedimentos</label>
                <textarea rows="3" className="w-full bg-slate-50 border-none rounded-[25px] px-6 py-5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={formData.procedimentos} onChange={(e) => setFormData({...formData, procedimentos: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Medicação S/N</label>
                <input type="text" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.medicacao} onChange={(e) => setFormData({...formData, medicacao: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Observações</label>
                <input type="text" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-2 text-orange-600 border-b border-orange-100 pb-4">
              <AlertTriangle size={18} />
              <span className="font-black uppercase italic tracking-tighter">Remoção / Encaminhamento</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2">Unidade de Destino</label>
                <select required className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" value={formData.destinoHospital} onChange={(e) => setFormData({...formData, destinoHospital: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="Hospital Conde Modesto Leal">Hospital Conde Modesto Leal</option>
                  <option value="UPA Inoã">UPA Inoã</option>
                  <option value="UPA Santa Rita">UPA Santa Rita</option>
                  <option value="Samu">Samu / Resgate</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2">Motivo</label>
                <input type="text" className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" value={formData.motivoEncaminhamento} onChange={(e) => setFormData({...formData, motivoEncaminhamento: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2">Responsável Transporte</label>
                <input type="text" className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" value={formData.responsavelTransporte} onChange={(e) => setFormData({...formData, responsavelTransporte: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2">Observações de Saída</label>
                <input type="text" className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" value={formData.obsEncaminhamento} onChange={(e) => setFormData({...formData, obsEncaminhamento: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* ASSINATURA AUTOMÁTICA DO FIREBASE */}
          <div className="flex items-center gap-3 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200 w-full md:w-auto">
            <UserCheck size={20} className="text-blue-600" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Responsável pelo Registro</span>
              <p className="text-slate-800 font-black text-sm uppercase italic">
                {user?.nome || 'Profissional'} — <span className="text-blue-600">{user?.cargo || 'Enfermagem'}</span>
              </p>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full md:w-auto px-16 py-5 rounded-[25px] font-black uppercase italic tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-4
              ${tipoAtendimento === 'local' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'} text-white`}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Salvar Registro'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AtendimentoEnfermagem;