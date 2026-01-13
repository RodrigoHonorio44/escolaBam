import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, Calendar, AlertCircle, CheckCircle2, 
  ChevronRight, Hospital, X, Save, Loader2, Stethoscope, User, Printer
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, query, where, onSnapshot, orderBy, updateDoc, doc 
} from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import FichaImpressao from '../../components/FichaImpressao'; // Importe seu componente de impressão aqui

const HistoricoAtendimentos = ({ user }) => {
  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('Encaminhado/Em Aberto');
  const [filtroData, setFiltroData] = useState('');
  
  const [selectedAtend, setSelectedAtend] = useState(null);
  const [viewPrint, setViewPrint] = useState(null); // NOVO: Estado para visualização de impressão
  const [closingLoading, setClosingLoading] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState({
    condutaHospitalar: '',
    dataAlta: new Date().toISOString().split('T')[0],
    observacoesFinais: ''
  });

  useEffect(() => {
    const q = query(
      collection(db, "atendimentos_enfermagem"),
      where("escola", "==", "E. M. Anísio Teixeira"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setAtendimentos(docs);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Erro ao carregar dados.");
    });

    return () => unsubscribe();
  }, [user]);

  // NOVO: Lógica para mostrar a ficha de impressão sem sair desta tela
  if (viewPrint) {
    return <FichaImpressao dados={viewPrint} onVoltar={() => setViewPrint(null)} />;
  }

  const handleFinalizarAtendimento = async (e) => {
    e.preventDefault();
    setClosingLoading(true);
    const toastId = toast.loading("Finalizando prontuário...");

    try {
      const atendRef = doc(db, "atendimentos_enfermagem", selectedAtend.id);
      await updateDoc(atendRef, {
        ...hospitalInfo,
        statusAtendimento: 'Finalizado',
        finalizadoEm: new Date().toISOString(),
        finalizadoPor: user?.nome || 'Profissional'
      });

      toast.success("Atendimento finalizado com sucesso!", { id: toastId });
      setSelectedAtend(null);
      setHospitalInfo({ condutaHospitalar: '', dataAlta: new Date().toISOString().split('T')[0], observacoesFinais: '' });
    } catch (error) {
      toast.error("Erro ao atualizar status.", { id: toastId });
    } finally {
      setClosingLoading(false);
    }
  };

  const atendimentosFiltrados = atendimentos.filter(atend => {
    const matchesStatus = filtroStatus === 'Todos' ? true : atend.statusAtendimento === filtroStatus;
    const matchesData = filtroData ? atend.data === filtroData : true;
    return matchesStatus && matchesData;
  });

  return (
    <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm relative">
      <Toaster position="top-center" />

      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg">
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Histórico Clínico</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E. M. Anísio Teixeira</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['Encaminhado/Em Aberto', 'Finalizado', 'Todos'].map((status) => (
              <button 
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filtroStatus === status ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {status === 'Encaminhado/Em Aberto' ? 'Em Aberto' : status}
              </button>
            ))}
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date" 
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Atendimentos */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : atendimentosFiltrados.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum registro encontrado</div>
        ) : (
          atendimentosFiltrados.map((atend) => (
            <div 
              key={atend.id}
              className={`relative overflow-hidden bg-white border border-slate-100 p-5 rounded-[25px] hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${atend.statusAtendimento === 'Finalizado' ? 'opacity-80' : 'hover:border-orange-200'}`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${atend.statusAtendimento === 'Finalizado' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${atend.statusAtendimento === 'Finalizado' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  {atend.statusAtendimento === 'Finalizado' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase italic tracking-tighter text-lg leading-tight">
                    {atend.nomePaciente}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {atend.perfilPaciente === 'aluno' ? `Turma: ${atend.turma}` : `Cargo: ${atend.cargo}`} • {atend.data} às {atend.horario}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="flex flex-col md:items-end gap-1">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${atend.statusAtendimento === 'Finalizado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {atend.statusAtendimento}
                  </span>
                  {atend.encaminhadoHospital === 'sim' && (
                    <span className="text-[9px] font-bold text-blue-600 flex items-center gap-1"><Hospital size={10}/> {atend.destinoHospital}</span>
                  )}
                </div>

                {/* BOTÕES DE AÇÃO - IMPRIMIR E EDITAR */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setViewPrint(atend)}
                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    title="Imprimir BAM"
                  >
                    <Printer size={18} />
                  </button>

                  {atend.statusAtendimento !== 'Finalizado' ? (
                    <button 
                      onClick={() => setSelectedAtend(atend)}
                      className="p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-md"
                      title="Finalizar Atendimento"
                    >
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <div className="p-3 text-slate-300">
                       <CheckCircle2 size={18} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE FECHAMENTO (Original) */}
      {selectedAtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-orange-500 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Hospital size={24} />
                <div>
                  <h3 className="font-black uppercase italic leading-none">Fechamento de Encaminhamento</h3>
                  <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">{selectedAtend.nomePaciente}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAtend(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleFinalizarAtendimento} className="p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ocorrência na Escola:</p>
                <p className="text-sm font-medium text-slate-600 italic">"{selectedAtend.motivoAtendimento || selectedAtend.motivoEncaminhamento}"</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2">
                    <Stethoscope size={14} className="text-orange-500" /> Conduta Realizada no Hospital / UPA
                  </label>
                  <textarea 
                    required
                    placeholder="Descreva o que foi feito na unidade de saúde..."
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    rows="4"
                    value={hospitalInfo.condutaHospitalar}
                    onChange={(e) => setHospitalInfo({...hospitalInfo, condutaHospitalar: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Data da Alta / Retorno</label>
                    <input 
                      type="date"
                      required
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                      value={hospitalInfo.dataAlta}
                      onChange={(e) => setHospitalInfo({...hospitalInfo, dataAlta: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Observações Finais</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                      value={hospitalInfo.observacoesFinais}
                      onChange={(e) => setHospitalInfo({...hospitalInfo, observacoesFinais: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={closingLoading}
                className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl font-black uppercase italic tracking-widest text-xs shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-3"
              >
                {closingLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Finalizar e Arquivar Prontuário</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoAtendimentos;