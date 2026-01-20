import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Calendar, AlertCircle, CheckCircle2, 
  ChevronRight, Hospital, X, Save, Loader2, Stethoscope, Printer, FileSearch
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, query, where, onSnapshot, orderBy, updateDoc, doc 
} from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import FichaImpressao from '../../components/FichaImpressao'; 

const HistoricoAtendimentos = ({ user, onVerPasta }) => {
  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('Aberto'); 
  const [filtroData, setFiltroData] = useState('');
  
  const [selectedAtend, setSelectedAtend] = useState(null);
  const [viewPrint, setViewPrint] = useState(null); 
  const [closingLoading, setClosingLoading] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState({
    condutaHospitalar: '',
    dataAlta: new Date().toISOString().split('T')[0],
    observacoesFinais: ''
  });

  useEffect(() => {
    const escolaUsuario = user?.escolaId || "E. M. Anísio Teixeira";
    
    const q = query(
      collection(db, "atendimentos_enfermagem"),
      where("escola", "==", escolaUsuario),
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
      console.error("Erro Firestore:", error);
      toast.error("Erro ao carregar fluxo clínico.");
    });

    return () => unsubscribe();
  }, [user]);

  if (viewPrint) {
    return <FichaImpressao dados={viewPrint} onVoltar={() => setViewPrint(null)} />;
  }

  const handleFinalizarAtendimento = async (e) => {
    e.preventDefault();
    setClosingLoading(true);
    const toastId = toast.loading("Sincronizando prontuário hospitalar...");

    try {
      const atendRef = doc(db, "atendimentos_enfermagem", selectedAtend.id);
      
      await updateDoc(atendRef, {
        ...hospitalInfo,
        statusAtendimento: 'Finalizado',
        finalizadoEm: new Date().toISOString(),
        finalizadoPor: user?.nome || 'Profissional',
        registroFinalizador: user?.registroProfissional || 'Sem Registro'
      });

      if (selectedAtend.pacienteId) {
        const pastaRef = doc(db, "pastas_digitais", selectedAtend.pacienteId);
        await updateDoc(pastaRef, {
          ultimoStatusClinico: 'Estável / Alta Hospitalar',
          dataUltimaAlta: hospitalInfo.dataAlta,
          ultimaConduta: hospitalInfo.condutaHospitalar
        });
      }

      toast.success("Ocorrência finalizada e arquivada!", { id: toastId });
      setSelectedAtend(null);
      setHospitalInfo({ condutaHospitalar: '', dataAlta: new Date().toISOString().split('T')[0], observacoesFinais: '' });
    } catch (error) {
      console.error(error);
      toast.error("Falha ao encerrar caso.", { id: toastId });
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
    <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm relative animate-in fade-in duration-500 font-sans antialiased">
      <Toaster position="top-center" />

      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-50 pb-8">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl">
            <ClipboardList size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Fluxo <span className="text-blue-600">Clínico</span></h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gestão de Prontuários e BAMs</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            {['Aberto', 'Finalizado', 'Todos'].map((status) => (
              <button 
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroStatus === status ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {status === 'Aberto' ? 'Pendentes' : status}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="date" 
              className="pl-12 pr-6 py-3 bg-slate-100 border-none rounded-2xl text-[11px] font-black text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all tabular-nums"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Atendimentos */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acessando banco de dados...</p>
          </div>
        ) : atendimentosFiltrados.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
            <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Nenhuma ocorrência encontrada</p>
          </div>
        ) : (
          atendimentosFiltrados.map((atend) => (
            <div 
              key={atend.id}
              className={`group relative bg-white border border-slate-100 p-6 rounded-[30px] hover:border-blue-200 hover:shadow-2xl hover:shadow-slate-100 transition-all flex flex-col md:flex-row items-center justify-between gap-6 ${atend.statusAtendimento === 'Finalizado' ? 'bg-slate-50/30' : ''}`}
            >
              <div className={`absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full ${atend.statusAtendimento === 'Finalizado' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>
              
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-transform group-hover:scale-110 ${atend.statusAtendimento === 'Finalizado' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                  {atend.statusAtendimento === 'Finalizado' ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 uppercase italic tracking-tighter text-xl">
                      {atend.nomePaciente}
                    </h3>
                    <button 
                      onClick={() => onVerPasta && onVerPasta(atend)}
                      className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Ver Pasta Digital Completa"
                    >
                      <FileSearch size={16} />
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-black">{atend.perfilPaciente === 'aluno' ? `TURMA ${atend.turma}` : atend.cargo}</span>
                    <span className="tabular-nums">{atend.data} • {atend.horario}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="flex flex-col md:items-end gap-1.5">
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.15em] ${atend.statusAtendimento === 'Finalizado' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white shadow-lg shadow-orange-100'}`}>
                    {atend.statusAtendimento}
                  </span>
                  {atend.encaminhadoHospital === 'sim' && (
                    <span className="text-[10px] font-black text-blue-600 flex items-center gap-1.5 uppercase italic tracking-tight">
                      <Hospital size={12}/> {atend.destinoHospital}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setViewPrint(atend)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    title="Imprimir BAM"
                  >
                    <Printer size={20} />
                  </button>

                  {atend.statusAtendimento === 'Aberto' ? (
                    <button 
                      onClick={() => setSelectedAtend(atend)}
                      className="h-12 px-6 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                    >
                      Resolver <ChevronRight size={16} />
                    </button>
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-2xl" title="Caso Encerrado">
                       <CheckCircle2 size={22} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE RESOLUÇÃO CLÍNICA */}
      {selectedAtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-orange-500 p-3 rounded-2xl shadow-lg">
                  <Hospital size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic leading-none tracking-tighter">Retorno do <span className="text-orange-500">Encaminhamento</span></h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 italic">Paciente: {selectedAtend.nomePaciente}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAtend(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleFinalizarAtendimento} className="p-10 space-y-8">
              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
                <p className="text-[9px] font-black text-blue-500 uppercase mb-2 tracking-widest italic">Queixa Inicial na Escola:</p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                  "{selectedAtend.motivoAtendimento || selectedAtend.motivoEncaminhamento || "Não especificado"}"
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2 tracking-widest">
                    <Stethoscope size={14} className="text-blue-600" /> Diagnóstico e Procedimentos Hospitalares
                  </label>
                  <textarea 
                    required
                    placeholder="Descreva a conduta médica realizada no hospital..."
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[25px] px-6 py-5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:bg-white outline-none resize-none transition-all shadow-inner"
                    rows="4"
                    value={hospitalInfo.condutaHospitalar}
                    onChange={(e) => setHospitalInfo({...hospitalInfo, condutaHospitalar: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Data da Alta</label>
                    <input 
                      type="date"
                      required
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-black text-slate-700 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner tabular-nums"
                      value={hospitalInfo.dataAlta}
                      onChange={(e) => setHospitalInfo({...hospitalInfo, dataAlta: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Observações de Repouso</label>
                    <input 
                      type="text"
                      placeholder="Ex: 3 dias de repouso"
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
                      value={hospitalInfo.observacoesFinais}
                      onChange={(e) => setHospitalInfo({...hospitalInfo, observacoesFinais: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={closingLoading}
                className="w-full py-6 bg-slate-900 hover:bg-emerald-600 text-white rounded-[30px] font-black uppercase italic tracking-[0.2em] text-xs shadow-2xl transition-all flex items-center justify-center gap-3 disabled:bg-slate-200"
              >
                {closingLoading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Encerrar Caso e Atualizar Prontuário</>}
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="mt-8 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
        Rodhon Intelligence — Monitoramento Clínico 2026
      </div>
    </div>
  );
};

export default HistoricoAtendimentos;