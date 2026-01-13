import React, { useState } from 'react';
import { Save, ArrowLeft, ClipboardPlus, Loader2 } from 'lucide-react';
import { db } from '../../firebase/firebaseConfig'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// Importação do Toast
import toast, { Toaster } from 'react-hot-toast';

const AtendimentoEnfermagem = ({ user, onVoltar }) => {
  const [loading, setLoading] = useState(false);
  
  const getInitialState = () => ({
    data: new Date().toISOString().split('T')[0],
    turma: '',
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    temperatura: '',
    nomeAluno: '',
    motivoAtendimento: '',
    procedimentos: '',
    medicacao: '',
    observacoes: ''
  });

  const [formData, setFormData] = useState(getInitialState());

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nomeAluno || !formData.motivoAtendimento) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);
    // Inicia um toast de carregamento
    const loadingToast = toast.loading("Salvando registro...");

    try {
      await addDoc(collection(db, "atendimentos_enfermagem"), {
        ...formData,
        escola: user?.escolaId || 'Não informada', 
        profissionalNome: user?.nome || 'Não identificado',
        profissionalRole: user?.role || 'enfermeiro', 
        profissionalEmail: user?.email || '',
        userId: user?.uid,
        createdAt: serverTimestamp() 
      });

      // Feedback de Sucesso
      toast.success("Registro salvo com sucesso!", { id: loadingToast });

      // Limpa o formulário e mantém aberto
      setFormData(getInitialState());

    } catch (error) {
      console.error("Erro ao salvar:", error);
      // Feedback de Erro
      toast.error("Erro ao salvar. Verifique sua conexão.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* Componente que renderiza as mensagens na tela */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header */}
      <div className="bg-[#0A1629] p-8 text-white flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <ClipboardPlus size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Registro Clínico Digital</span>
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">
            Atendimento <span className="text-blue-500">Enfermagem</span>
          </h2>
        </div>
        <button 
          onClick={onVoltar} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10"
        >
          <ArrowLeft size={14} /> SAIR
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
        {/* Linha 1: Dados Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Data</label>
            <input 
              type="date" 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.data}
              onChange={(e) => setFormData({...formData, data: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Turma</label>
            <input 
              type="text" 
              placeholder="Ex: 3º Ano A"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.turma}
              onChange={(e) => setFormData({...formData, turma: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Horário</label>
            <input 
              type="time" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.horario}
              onChange={(e) => setFormData({...formData, horario: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Temperatura</label>
            <input 
              type="text" 
              placeholder="Ex: 36.5°C"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.temperatura}
              onChange={(e) => setFormData({...formData, temperatura: e.target.value})}
            />
          </div>
        </div>

        {/* Linha 2: Identificação */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome do Aluno / Paciente</label>
          <input 
            type="text" 
            required
            placeholder="Nome completo do atendido"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.nomeAluno}
            onChange={(e) => setFormData({...formData, nomeAluno: e.target.value})}
          />
        </div>

        {/* Linha 3: Motivo e Procedimentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Motivo do Atendimento</label>
            <textarea 
              rows="3"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              value={formData.motivoAtendimento}
              onChange={(e) => setFormData({...formData, motivoAtendimento: e.target.value})}
            ></textarea>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Procedimentos Realizados</label>
            <textarea 
              rows="3"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              value={formData.procedimentos}
              onChange={(e) => setFormData({...formData, procedimentos: e.target.value})}
            ></textarea>
          </div>
        </div>

        {/* Linha 4: Medicação e Observações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Medicação Administrada</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.medicacao}
              onChange={(e) => setFormData({...formData, medicacao: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Observações Adicionais</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
            />
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Save size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 italic">Profissional Logado</p>
              <p className="text-sm font-bold text-slate-700 italic">
                {user?.nome} — <span className="text-blue-600 uppercase">{user?.role}</span>
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">{user?.escolaId}</p>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 disabled:bg-slate-400"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Salvando...
              </>
            ) : (
              'Finalizar e Salvar Registro'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AtendimentoEnfermagem;