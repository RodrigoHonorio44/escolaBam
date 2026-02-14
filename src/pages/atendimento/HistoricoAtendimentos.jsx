import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, Calendar as CalendarIcon, AlertCircle, CheckCircle2, 
  ChevronRight, ChevronLeft, Hospital, X, Save, Loader2, Stethoscope, Printer, 
  Search, FilterX
} from 'lucide-react';
import Calendar from 'react-calendar'; // Importação do novo calendário
import 'react-calendar/dist/Calendar.css'; // Estilos base
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, query, where, onSnapshot, orderBy, updateDoc, doc 
} from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import FichaImpressao from '../../components/FichaImpressao'; 
import ModalDetalhesDigital from '../../components/ModalDetalhesDigital';

const HistoricoAtendimentos = ({ user, onVerPasta }) => {
  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('Aberto'); 
  const [filtroData, setFiltroData] = useState('');
  const [buscaNome, setBuscaNome] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  const [selectedAtend, setSelectedAtend] = useState(null); 
  const [showDetails, setShowDetails] = useState(null);    
  const [viewPrint, setViewPrint] = useState(null); 
  const [closingLoading, setClosingLoading] = useState(false);
  
  const [hospitalInfo, setHospitalInfo] = useState({
    condutaHospitalar: '',
    dataAlta: new Date().toISOString().split('T')[0],
    observacoesFinais: ''
  });

  const formatarNomeDisplay = (nome) => {
    if (!nome) return "---";
    const palavras = nome.toLowerCase().split(' ');
    return palavras.map(p => {
      if (p === 'r' || p === 's' || p.length === 1) return p.toUpperCase();
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  };

  const limparFiltros = () => {
    setBuscaNome('');
    setFiltroData('');
    setFiltroStatus('Aberto');
    setPaginaAtual(1);
  };

  useEffect(() => {
    const escolaUsuario = (user?.escolaId || "E. M. ANÍSIO TEIXEIRA");
    const q = query(
      collection(db, "atendimentos_enfermagem"),
      where("escola", "in", [escolaUsuario.toUpperCase(), escolaUsuario.toLowerCase()]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({ 
          id: doc.id, 
          ...data,
          statusAtendimento: (data.statusAtendimento || 'aberto').toLowerCase(),
          tipoRegistro: (data.tipoRegistro || 'local').toLowerCase()
        });
      });
      setAtendimentos(docs);
      setLoading(false);
    }, (error) => {
      console.error("Erro Firestore:", error);
      toast.error("Erro ao carregar fluxo clínico.");
    });
    return () => unsubscribe();
  }, [user]);

  // LÓGICA DE FILTRAGEM CORRIGIDA (Trava de mês para Finalizados)
  const atendimentosFiltrados = useMemo(() => {
    return atendimentos.filter(atend => {
      const statusDoc = atend.statusAtendimento;
      const ehPendente = statusDoc === 'pendente' || statusDoc === 'aberto' || (atend.tipoRegistro === 'remoção' && statusDoc !== 'finalizado');
      
      // 1. Filtro de Status
      const matchesStatus = filtroStatus === 'Todos' ? true : (filtroStatus === 'Aberto' ? ehPendente : statusDoc === 'finalizado');
      
      // 2. Trava de Data Rigorosa
      const dataDoc = atend.dataAtendimento || atend.data || "";
      const mesAtual = new Date().toISOString().slice(0, 7); // "2026-02"
      
      let matchesData = true;
      if (buscaNome) {
        matchesData = true; // Busca global se houver nome
      } else if (filtroData) {
        matchesData = dataDoc === filtroData; // Filtro de dia específico
      } else {
        matchesData = dataDoc.startsWith(mesAtual); // TRAVA: Apenas mês atual para Aberto/Finalizado
      }

      // 3. Filtro de Nome
      const termoBusca = buscaNome.toLowerCase().trim();
      const nomePaciente = (atend.nomePaciente || "").toLowerCase();
      const matchesNome = nomePaciente.includes(termoBusca);

      return matchesStatus && matchesData && matchesNome;
    });
  }, [atendimentos, filtroStatus, filtroData, buscaNome]);

  // Mapeia dias que têm atendimento para as bolinhas do calendário
  const diasComDados = useMemo(() => {
    return atendimentos.map(a => a.dataAtendimento || a.data);
  }, [atendimentos]);

  const totalPaginas = Math.ceil(atendimentosFiltrados.length / itensPorPagina);
  const itensExibidos = atendimentosFiltrados.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const handleFinalizarAtendimento = async (e) => {
    e.preventDefault();
    setClosingLoading(true);
    try {
      const atendRef = doc(db, "atendimentos_enfermagem", selectedAtend.id);
      await updateDoc(atendRef, {
        condutaHospitalar: hospitalInfo.condutaHospitalar.toLowerCase().trim(),
        dataAlta: hospitalInfo.dataAlta,
        statusAtendimento: 'finalizado',
        finalizadoEm: new Date().toISOString()
      });
      toast.success("Caso encerrado com sucesso!");
      setSelectedAtend(null);
    } catch (error) {
      toast.error("Erro ao finalizar.");
    } finally {
      setClosingLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm relative animate-in fade-in duration-500 font-sans antialiased">
      <Toaster position="top-center" />
      
      {/* Estilos customizados para o react-calendar */}
      <style>{`
        .react-calendar { border: none; font-family: inherit; width: 100%; background: transparent; }
        .dot-indicator { height: 6px; width: 6px; background-color: #3b82f6; border-radius: 50%; display: inline-block; position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); }
        .react-calendar__tile { position: relative; height: 50px; border-radius: 12px; font-size: 11px; font-weight: 800; color: #64748b; }
        .react-calendar__tile--active { background: #1e293b !important; color: white !important; }
        .react-calendar__tile--now { background: #eff6ff; color: #3b82f6; }
      `}</style>

      {showDetails && <ModalDetalhesDigital atendimento={showDetails} onClose={() => setShowDetails(null)} />}

      <div className="flex flex-col gap-8 mb-10 border-b border-slate-50 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl">
              <ClipboardList size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Fluxo <span className="text-blue-600">Clínico</span></h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {filtroData ? `Data Selecionada: ${filtroData}` : `Registros do Mês Atual`}
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="BUSCAR PELO NOME..." 
              className="w-full pl-12 pr-12 py-3 bg-slate-100 border-none rounded-2xl text-[10px] font-black text-slate-700 outline-none focus:ring-2 ring-blue-500 transition-all uppercase"
              value={buscaNome}
              onChange={(e) => { setBuscaNome(e.target.value); setPaginaAtual(1); }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {['Aberto', 'Finalizado', 'Todos'].map((status) => (
              <button 
                key={status}
                onClick={() => { setFiltroStatus(status); setPaginaAtual(1); }}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroStatus === status ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {status === 'Aberto' ? 'Pendentes' : status}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            { (filtroData || buscaNome) && (
              <button onClick={limparFiltros} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><FilterX size={18} /></button>
            )}
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${showCalendar ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-white'}`}
            >
              <CalendarIcon size={16} /> {filtroData || "Filtrar Data"}
            </button>
          </div>
        </div>

        {/* CALENDÁRIO COM BOLINHAS INDICADORAS */}
        {showCalendar && (
          <div className="absolute right-8 top-52 z-50 bg-white p-6 rounded-[30px] shadow-2xl border border-slate-100 animate-in zoom-in duration-200 w-80">
            <Calendar 
              onChange={(value) => {
                const dataFormatada = value.toISOString().split('T')[0];
                setFiltroData(dataFormatada);
                setShowCalendar(false);
                setPaginaAtual(1);
              }}
              tileContent={({ date, view }) => {
                const dateString = date.toISOString().split('T')[0];
                if (view === 'month' && diasComDados.includes(dateString)) {
                  return <span className="dot-indicator"></span>;
                }
              }}
            />
          </div>
        )}
      </div>

      <div className="space-y-4 min-h-[400px]">
        {loading ? (
          <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : itensExibidos.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
            <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Sem registros para este período</p>
          </div>
        ) : (
          itensExibidos.map((atend) => (
            <div key={atend.id} className={`group border border-slate-100 p-6 rounded-[30px] flex items-center justify-between gap-6 transition-all ${atend.statusAtendimento === 'finalizado' ? 'bg-white' : 'bg-orange-50/20 border-orange-100'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center ${atend.statusAtendimento === 'finalizado' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                  {atend.destinoHospital ? <Hospital size={28} /> : <Stethoscope size={28} />}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase italic tracking-tighter text-xl">{formatarNomeDisplay(atend.nomePaciente)}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{atend.data || atend.dataAtendimento} • {atend.horario}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowDetails(atend)} className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Search size={20} /></button>
                <button onClick={() => setViewPrint(atend)} className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><Printer size={20} /></button>
                {atend.statusAtendimento !== 'finalizado' && (
                  <button onClick={() => setSelectedAtend(atend)} className="h-12 px-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] hover:bg-blue-600 transition-all">Dar Alta</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação Simplificada */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => p - 1)} className="p-4 bg-slate-100 rounded-2xl disabled:opacity-30"><ChevronLeft size={20} /></button>
          <span className="text-[10px] font-black text-slate-400 uppercase">Página {paginaAtual} de {totalPaginas}</span>
          <button disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(p => p + 1)} className="p-4 bg-slate-100 rounded-2xl disabled:opacity-30"><ChevronRight size={20} /></button>
        </div>
      )}

      {/* Modal de Finalização (Arquivamento) */}
      {selectedAtend && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-[40px] p-10 relative animate-in zoom-in duration-300">
                <button onClick={() => setSelectedAtend(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-red-500"><X size={24}/></button>
                <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                  <CheckCircle2 className="text-blue-600" /> Finalizar Caso
                </h3>
                <form onSubmit={handleFinalizarAtendimento} className="space-y-6">
                  <textarea 
                    className="w-full bg-slate-100 p-6 rounded-[30px] outline-none font-bold text-sm min-h-[150px] uppercase" 
                    placeholder="RELATE A CONDUTA FINAL..."
                    onChange={(e) => setHospitalInfo({...hospitalInfo, condutaHospitalar: e.target.value})}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="bg-slate-100 p-4 rounded-2xl font-bold" value={hospitalInfo.dataAlta} onChange={(e) => setHospitalInfo({...hospitalInfo, dataAlta: e.target.value})} />
                    <button type="submit" disabled={closingLoading} className="bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2">
                      {closingLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Salvar e Arquivar</>}
                    </button>
                  </div>
                </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default HistoricoAtendimentos;