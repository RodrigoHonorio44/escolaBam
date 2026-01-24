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

  // Regra Especial: "R S" maiúsculo, demais capitalizados
  const formatarNomeDisplay = (nome) => {
    if (!nome) return "---";
    return nome.split(' ').map(p => {
      const termo = p.toLowerCase();
      if (termo === 'r' || termo === 's') return termo.toUpperCase();
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    }).join(' ');
  };

  useEffect(() => {
    // IMPORTANTE: Busca pelo campo 'escola' que você confirmou no log
    const escolaBusca = (user?.escola || "unidade").toLowerCase().trim();
    
    const q = query(
      collection(db, "atendimentos_enfermagem"),
      where("escola", "==", escolaBusca),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({ 
          id: doc.id, 
          ...data,
          // Normalização para o filtro funcionar sem erros de case
          statusAtendimento: (data.statusAtendimento || 'finalizado').toLowerCase().trim()
        });
      });
      
      setAtendimentos(docs);
      setLoading(false);
    }, (error) => {
      console.error("Erro Firestore:", error);
      toast.error("erro na conexão com o banco.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.escola]);

  if (viewPrint) {
    return <FichaImpressao dados={viewPrint} onVoltar={() => setViewPrint(null)} />;
  }

  const handleFinalizarAtendimento = async (e) => {
    e.preventDefault();
    setClosingLoading(true);
    const toastId = toast.loading("sincronizando prontuário...");

    try {
      const atendRef = doc(db, "atendimentos_enfermagem", selectedAtend.id);
      
      const updateData = {
        condutaHospitalar: hospitalInfo.condutaHospitalar.toLowerCase().trim(),
        dataAlta: hospitalInfo.dataAlta,
        observacoesFinais: hospitalInfo.observacoesFinais.toLowerCase().trim(),
        statusAtendimento: 'finalizado',
        finalizadoEm: new Date().toISOString(),
        finalizadoPor: (user?.nome || 'profissional').toLowerCase().trim()
      };

      await updateDoc(atendRef, updateData);

      if (selectedAtend.pacienteId) {
        const pastaRef = doc(db, "pastas_digitais", selectedAtend.pacienteId.toLowerCase());
        await updateDoc(pastaRef, {
          ultimoStatusClinico: 'estável / alta',
          dataUltimaAlta: hospitalInfo.dataAlta,
          ultimaAtualizacao: new Date()
        });
      }

      toast.success("ocorrência encerrada!", { id: toastId });
      setSelectedAtend(null);
    } catch (error) {
      toast.error("erro ao salvar alta.", { id: toastId });
    } finally {
      setClosingLoading(false);
    }
  };

  const atendimentosFiltrados = atendimentos.filter(atend => {
    const statusDoc = atend.statusAtendimento;
    
    // CORREÇÃO DO FILTRO: Aceita 'pendente' ou 'aberto'
    const ehPendente = statusDoc === 'pendente' || statusDoc === 'aberto';
    const ehFinalizado = statusDoc === 'finalizado';

    const matchesStatus = filtroStatus === 'Todos' 
      ? true 
      : (filtroStatus === 'Aberto' ? ehPendente : ehFinalizado);

    const dataDoc = atend.data || "";
    const matchesData = filtroData ? dataDoc === filtroData : true;
    
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gestão de Prontuários e bams</p>
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
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date" 
              className="pl-12 pr-6 py-3 bg-slate-100 border-none rounded-2xl text-[11px] font-black text-slate-700 outline-none tabular-nums"
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">sincronizando nuvem...</p>
          </div>
        ) : atendimentosFiltrados.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
            <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">sem registros encontrados</p>
          </div>
        ) : (
          atendimentosFiltrados.map((atend) => {
            const precisaResolver = atend.statusAtendimento === 'pendente' || atend.statusAtendimento === 'aberto';
            const detalheAlergia = (atend.qualAlergia || "").toLowerCase();
            const temAlergiaReal = detalheAlergia.length > 2 && !["não", "n/a", "nenhuma"].includes(detalheAlergia);

            return (
              <div 
                key={atend.id}
                className={`group relative bg-white border border-slate-100 p-6 rounded-[30px] hover:border-blue-200 hover:shadow-2xl transition-all flex flex-col md:flex-row items-center justify-between gap-6 ${precisaResolver ? 'bg-orange-50/40 border-orange-100' : 'bg-white'}`}
              >
                <div className={`absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full ${precisaResolver ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center ${precisaResolver ? 'bg-orange-100 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {atend.tipoRegistro === 'remoção' ? <Hospital size={28} /> : <Stethoscope size={28} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-800 uppercase italic tracking-tighter text-xl">
                        {formatarNomeDisplay(atend.nomePaciente)}
                      </h3>
                      {temAlergiaReal && (
                        <span className="bg-rose-600 text-white text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                          <AlertCircle size={10} /> ALERGIA
                        </span>
                      )}
                    </div>

                    {/* DADOS VITAIS EXIBIDOS NO CARD (ALTURA, PESO, IMC) */}
                    <div className="flex gap-2 my-1">
                       {atend.peso && <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">P: {atend.peso}kg</span>}
                       {atend.altura && <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">A: {atend.altura}m</span>}
                       {atend.imc && <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded uppercase">IMC: {atend.imc}</span>}
                    </div>

                    {precisaResolver && (
                       <p className="text-[9px] font-black text-orange-600 uppercase tracking-tighter flex items-center gap-1">
                         <AlertCircle size={10} /> {atend.motivoEncaminhamento || 'aguardando retorno clínico'}
                       </p>
                    )}
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-black">
                        {atend.perfilPaciente}
                      </span>
                      <span className="tabular-nums">{atend.data} • {atend.horario}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${precisaResolver ? 'bg-orange-500 text-white shadow-lg' : 'bg-emerald-100 text-emerald-700'}`}>
                    {precisaResolver ? 'Pendente' : 'Finalizado'}
                  </span>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setViewPrint(atend)} className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Printer size={20} /></button>
                    {precisaResolver && (
                      <button 
                        onClick={() => setSelectedAtend(atend)}
                        className="h-12 px-6 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-lg font-black uppercase text-[10px] flex items-center gap-2"
                      >
                        Dar Alta <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE ALTA */}
      {selectedAtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden">
            <div className="bg-orange-500 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Retorno Clínico</h3>
                <p className="text-[10px] font-bold uppercase opacity-80">paciente: {formatarNomeDisplay(selectedAtend.nomePaciente)}</p>
              </div>
              <button onClick={() => setSelectedAtend(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
            </div>

            <form onSubmit={handleFinalizarAtendimento} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">conduta e procedimentos realizados</label>
                <textarea 
                  required
                  placeholder="descreva o atendimento..."
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[25px] px-6 py-5 text-sm outline-none focus:border-orange-500 transition-all uppercase"
                  rows="4"
                  value={hospitalInfo.condutaHospitalar}
                  onChange={(e) => setHospitalInfo({...hospitalInfo, condutaHospitalar: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">data da alta</label>
                  <input type="date" className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-orange-500" value={hospitalInfo.dataAlta} onChange={(e) => setHospitalInfo({...hospitalInfo, dataAlta: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">observações de repouso</label>
                  <input type="text" placeholder="ex: 3 dias de repouso" className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-orange-500 uppercase" value={hospitalInfo.observacoesFinais} onChange={(e) => setHospitalInfo({...hospitalInfo, observacoesFinais: e.target.value})} />
                </div>
              </div>

              <button 
                type="submit"
                disabled={closingLoading}
                className="w-full py-6 bg-slate-900 hover:bg-orange-600 text-white rounded-[30px] font-black uppercase italic text-xs shadow-2xl transition-all flex items-center justify-center gap-3"
              >
                {closingLoading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> finalizar e arquivar</>}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
        rodhon intelligence — monitoramento clínico 2026
      </div>
    </div>
  );
};

export default HistoricoAtendimentos;