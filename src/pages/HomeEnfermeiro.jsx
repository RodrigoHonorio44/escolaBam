import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; 
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { 
  Users, CheckCircle2, Search, Calendar, 
  Activity, ShieldCheck, Clock, Truck,
  ChevronLeft, ChevronRight, AlertTriangle,
  RotateCw, BarChart3, Filter, X, Printer
} from 'lucide-react';

const HomeEnfermeiro = ({ user, onAbrirPastaDigital, darkMode }) => {
  const [metricas, setMetricas] = useState({ 
    atendidoshoje: 0, 
    atendidosMes: 0,
    totalPacientes: 0,
    tempoMedio: 0,
    tempoMedioMes: 0,
    pendentes: 0 
  });
  
  const [exibirMensalAtend, setExibirMensalAtend] = useState(false);
  const [exibirMensalTempo, setExibirMensalTempo] = useState(false);
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [resultadoRelatorio, setResultadoRelatorio] = useState(null);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);

  const [todosAtendimentosHoje, setTodosAtendimentosHoje] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  const formatarParaTela = (texto) => {
    if (!texto) return "";
    const palavras = texto.toString().toLowerCase().split(' ');
    return palavras.map(p => {
      if (p === 'r' || p === 's' || p.length === 1) return p.toUpperCase();
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  };

  const cnum = user?.registroProfissional || user?.coren || "Não Informado";

  const gerarRelatorioGeral = async () => {
    if (!filtroDataInicio || !filtroDataFim) return;
    setCarregandoRelatorio(true);
    try {
      const escolaUser = (user?.escola || "").toLowerCase().trim();
      const colRef = collection(db, "atendimentos_enfermagem");
      const q = query(colRef, where("data", ">=", filtroDataInicio), where("data", "<=", filtroDataFim));
      const snap = await getDocs(q);
      
      const docsFiltrados = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(atend => {
          const esc = (atend.escola || "").toLowerCase().trim();
          return esc === escolaUser || escolaUser === "admin" || escolaUser === "";
        });

      let totalMin = 0;
      let countComTempo = 0;
      docsFiltrados.forEach(atend => {
        if (atend.horario && atend.horarioSaida && atend.statusAtendimento === "finalizado") {
          const [h1, m1] = atend.horario.split(':').map(Number);
          const [h2, m2] = atend.horarioSaida.split(':').map(Number);
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diff > 0) { totalMin += diff; countComTempo++; }
        }
      });

      setResultadoRelatorio({
        total: docsFiltrados.length,
        tempoMedio: countComTempo > 0 ? Math.round(totalMin / countComTempo) : 0,
        lista: docsFiltrados.sort((a, b) => a.data.localeCompare(b.data) || (a.horario || "").localeCompare(b.horario || ""))
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCarregandoRelatorio(false);
    }
  };

  useEffect(() => {
    const escolaUser = (user?.escola || "").toLowerCase().trim();
    const agora = new Date();
    const hojeLocal = agora.toLocaleDateString('en-CA'); 
    const amanhaLocal = new Date(agora.getTime() + 86400000).toLocaleDateString('en-CA');
    const mesAtualPrefix = hojeLocal.substring(0, 7);

    const unsubAtendimentos = onSnapshot(collection(db, "atendimentos_enfermagem"), (snapshot) => {
      let totalMinHoje = 0, countHoje = 0, totalMinMes = 0, countMes = 0;
      let pendentesCount = 0, totalMes = 0;
      
      const todosOsDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const daEscola = todosOsDocs.filter(atend => {
        const escDoc = (atend.escola || "").toLowerCase().trim();
        return escDoc === escolaUser || escolaUser === "admin" || escolaUser === "";
      });

      const filtradosHoje = daEscola.filter(atend => {
        const dataDoc = (atend.data || "").trim();
        return dataDoc === hojeLocal || dataDoc === amanhaLocal;
      });

      daEscola.forEach(atend => {
        const dataDoc = (atend.data || "").trim();
        const status = (atend.statusAtendimento || "").toLowerCase().trim();
        
        if (atend.horario && atend.horarioSaida && status === "finalizado") {
          const [h1, m1] = atend.horario.split(':').map(Number);
          const [h2, m2] = atend.horarioSaida.split(':').map(Number);
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diff > 0) {
            if (dataDoc === hojeLocal || dataDoc === amanhaLocal) { totalMinHoje += diff; countHoje++; }
            if (dataDoc.startsWith(mesAtualPrefix)) { totalMinMes += diff; countMes++; }
          }
        }

        if (dataDoc.startsWith(mesAtualPrefix)) totalMes++;

        if ((dataDoc === hojeLocal || dataDoc === amanhaLocal) && 
            (status === "pendente" || status === "aberto" || status === "")) { 
          pendentesCount++; 
        }
      });

      setMetricas(prev => ({ 
        ...prev,
        atendidoshoje: filtradosHoje.length,
        atendidosMes: totalMes,
        pendentes: pendentesCount,
        tempoMedio: countHoje > 0 ? Math.round(totalMinHoje / countHoje) : 0,
        tempoMedioMes: countMes > 0 ? Math.round(totalMinMes / countMes) : 0
      }));

      setTodosAtendimentosHoje(filtradosHoje.sort((a, b) => (b.horario || "").localeCompare(a.horario || "")));
      setPaginaAtual(1); // Resetar para a primeira página quando houver novos dados
    });

    const unsubPacientes = onSnapshot(collection(db, "alunos"), (snapshot) => {
      const total = snapshot.docs.filter(doc => {
        const esc = (doc.data().escola || "").toLowerCase().trim();
        return esc === escolaUser || escolaUser === "admin";
      }).length;
      setMetricas(prev => ({ ...prev, totalPacientes: total }));
    });

    return () => { unsubAtendimentos(); unsubPacientes(); };
  }, [user]);

  const totalPaginas = Math.ceil(todosAtendimentosHoje.length / itensPorPagina);
  const atendimentosPaginados = todosAtendimentosHoje.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* CSS DE IMPRESSÃO - REFINADO */}
      <style>{`
        @media print {
          .print\\:hidden, nav, aside, button, .menu-lateral { display: none !important; }
          .print\\:block { display: block !important; }
          body { background: white !important; padding: 0 !important; color: black !important; }
          .relatorio-container { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; }
          
          .grid-relatorio-print {
            display: flex !important;
            justify-content: space-around !important;
            text-align: center !important;
            margin-bottom: 40px !important;
          }

          table { width: 100% !important; border-collapse: collapse !important; }
          th { border-bottom: 2px solid #333 !important; color: #000 !important; font-size: 10px !important; padding: 12px !important; text-transform: uppercase !important; }
          td { border-bottom: 1px solid #eee !important; padding: 12px !important; font-size: 11px !important; color: #000 !important; }
          
          .kpi-value-print { font-size: 60px !important; font-weight: 1000 !important; font-style: italic !important; color: #000 !important; }
          .kpi-label-print { font-size: 10px !important; font-weight: 900 !important; text-transform: uppercase !important; color: #666 !important; }
          .paciente-nome-print { font-weight: 900 !important; font-style: italic !important; text-transform: uppercase !important; }
        }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-500/10 pb-8 print:hidden">
        <div>
          <h1 className={`text-4xl md:text-5xl font-[1000] italic tracking-tighter uppercase leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
            Olá, <span className="text-blue-600">{formatarParaTela(user?.nome)}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold italic uppercase">
              <ShieldCheck size={14} className="text-blue-500" />
              {user?.escola} <span className="opacity-30 mx-1">|</span> {cnum}
            </div>
            <button 
              onClick={() => setMostrarRelatorio(!mostrarRelatorio)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all ${mostrarRelatorio ? "bg-blue-600 border-blue-600 text-white" : "bg-transparent border-slate-500/20 text-slate-500 hover:border-blue-500"}`}
            >
              <BarChart3 size={14} />
              {mostrarRelatorio ? "Fechar Consulta" : "Relatório Inteligente"}
            </button>
          </div>
        </div>
      </div>

      {/* PAINEL DE RELATÓRIO */}
      {mostrarRelatorio && (
          <div className={`relatorio-container p-8 rounded-[40px] border animate-in slide-in-from-top-4 duration-500 ${darkMode ? "bg-white/5 border-white/20 text-white" : "bg-slate-50 border-slate-200 shadow-xl"}`}>
            
            <div className="hidden print:flex items-center justify-between mb-10">
               <div>
                 <h2 className="text-lg font-black uppercase italic tracking-tighter">Rodhon System | Gestão de Enfermagem</h2>
                 <p className="text-[9px] font-bold text-slate-400 uppercase">Unidade: {user?.escola}</p>
               </div>
               <div className="text-right">
                 <p className="text-[9px] font-black uppercase text-slate-400">Dashboard de Atendimento</p>
                 <p className="text-[8px] font-bold text-slate-300">Emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
               </div>
            </div>

            <div className="flex items-center justify-between mb-6 print:hidden">
              <h3 className="text-[10px] font-[1000] uppercase tracking-widest italic text-blue-500">Consulta de Dados Operacionais</h3>
              <button onClick={() => setMostrarRelatorio(false)} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end print:hidden">
               <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase ml-2 opacity-50">Início</label>
                 <input type="date" className={`w-full p-3 rounded-2xl border text-xs font-bold ${darkMode ? "bg-black/20 border-white/10 text-white" : "bg-white border-slate-200"}`} value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase ml-2 opacity-50">Fim</label>
                 <input type="date" className={`w-full p-3 rounded-2xl border text-xs font-bold ${darkMode ? "bg-black/20 border-white/10 text-white" : "bg-white border-slate-200"}`} value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
               </div>
               <button onClick={gerarRelatorioGeral} className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase italic flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                 {carregandoRelatorio ? <RotateCw size={14} className="animate-spin" /> : <Filter size={14} />} Gerar Indicadores
               </button>
            </div>

            {resultadoRelatorio && (
              <div className="mt-8 space-y-10 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 grid-relatorio-print">
                  <div className="p-8 rounded-[30px] bg-blue-600 print:bg-transparent text-white flex flex-col items-center justify-center border border-blue-500 print:border-none">
                    <h4 className="text-7xl font-[1000] italic leading-none kpi-value-print">{resultadoRelatorio.total}</h4>
                    <span className="text-[10px] uppercase font-black opacity-80 mt-2 kpi-label-print">Atendimentos no Período</span>
                  </div>
                  <div className="p-8 rounded-[30px] bg-slate-800 print:bg-transparent text-white flex flex-col items-center justify-center border border-slate-700 print:border-none">
                    <h4 className="text-7xl font-[1000] italic leading-none kpi-value-print">{resultadoRelatorio.tempoMedio}<span className="text-2xl ml-1">min</span></h4>
                    <span className="text-[10px] uppercase font-black opacity-80 mt-2 kpi-label-print">Tempo Médio</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[30px] border border-slate-500/10 bg-white/5 print:border-none">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-blue-600/10 print:bg-slate-50 text-[9px] font-black uppercase text-blue-500 print:text-slate-900">
                          <th className="p-4">Data/Hora</th>
                          <th className="p-4">Nome do Paciente</th>
                          <th className="p-4">Motivo</th>
                        </tr>
                      </thead>
                      <tbody className={darkMode ? "text-white" : "text-slate-800"}>
                        {resultadoRelatorio.lista.map((atend) => (
                          <tr key={atend.id} className="border-t border-slate-500/5 print:border-slate-100 text-[11px] hover:bg-blue-500/5">
                            <td className="p-4 font-bold opacity-70">
                              {new Date(atend.data).toLocaleDateString('pt-BR')} | {atend.horario}
                            </td>
                            <td className="p-4 paciente-nome-print">{formatarParaTela(atend.nomePaciente)}</td>
                            <td className="p-4 font-bold uppercase opacity-60">{atend.motivoAtendimento || "Consulta"}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>

                <button onClick={() => window.print()} className="print:hidden w-full p-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-[1000] uppercase italic flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
                  <Printer size={18} /> Finalizar e Imprimir Relatório Operacional
                </button>
              </div>
            )}
          </div>
      )}

      {/* CARDS KPIS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
        <div onClick={() => setExibirMensalTempo(!exibirMensalTempo)} className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 cursor-pointer transition-all ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/20" : "bg-white border-slate-100 shadow-sm hover:shadow-md"}`}>
          <div className="flex justify-between items-start"><Clock className="text-orange-500" size={32} /><RotateCw size={12} className="text-slate-400" /></div>
          <div>
            <span className={`text-4xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{exibirMensalTempo ? metricas.tempoMedioMes : metricas.tempoMedio} min</span>
            <p className="text-[10px] font-black text-slate-500 uppercase">{exibirMensalTempo ? "Média no Mês" : "Média Hoje"}</p>
          </div>
        </div>
        
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 transition-all ${metricas.pendentes > 0 ? "bg-orange-500/10 border-orange-500" : (darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm")}`}>
          <Activity className={metricas.pendentes > 0 ? "text-orange-500 animate-pulse" : "text-slate-400"} size={32} />
          <div>
            <span className={`text-4xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{metricas.pendentes}</span>
            <p className="text-[10px] font-black text-slate-500 uppercase">Pendentes</p>
          </div>
        </div>

        <div onClick={() => setExibirMensalAtend(!exibirMensalAtend)} className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 cursor-pointer transition-all ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/20" : "bg-white border-slate-100 shadow-sm hover:shadow-md"}`}>
          <div className="flex justify-between items-start"><CheckCircle2 className={exibirMensalAtend ? "text-blue-500" : "text-emerald-500"} size={32} /><RotateCw size={12} className="text-slate-400" /></div>
          <div>
            <span className={`text-4xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{exibirMensalAtend ? metricas.atendidosMes : metricas.atendidoshoje}</span>
            <p className="text-[10px] font-black text-slate-500 uppercase">{exibirMensalAtend ? "Total no Mês" : "Total Hoje"}</p>
          </div>
        </div>

        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm"}`}>
          <Users className="text-blue-500" size={32} />
          <div><span className={`text-4xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{metricas.totalPacientes}</span><p className="text-[10px] font-black text-slate-500 uppercase">Alunos/Funcionários</p></div>
        </div>
      </div>

      {/* FLUXO DO DIA COM PAGINAÇÃO REFORÇADA */}
      <div className={`rounded-[40px] border print:hidden transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm"}`}>
        <div className="p-6 border-b border-slate-500/5 flex items-center justify-between">
          <h4 className="text-[10px] font-[1000] uppercase text-slate-500 italic tracking-widest flex items-center gap-2">Fluxo Operacional Diário</h4>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-3 bg-slate-500/5 p-1 px-3 rounded-full">
              <button 
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} 
                disabled={paginaAtual === 1} 
                className="p-1.5 hover:bg-blue-600 hover:text-white rounded-full disabled:opacity-10 transition-all active:scale-75"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-black text-blue-600 tabular-nums">{paginaAtual} de {totalPaginas}</span>
              <button 
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} 
                disabled={paginaAtual === totalPaginas} 
                className="p-1.5 hover:bg-blue-600 hover:text-white rounded-full disabled:opacity-10 transition-all active:scale-75"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
        <div className="p-4">
          {atendimentosPaginados.length > 0 ? atendimentosPaginados.map(atend => {
            const isPendente = (atend.statusAtendimento || "").toLowerCase() !== "finalizado";
            return (
              <div key={atend.id} className={`p-4 flex items-center justify-between border-b border-slate-500/5 last:border-0 transition-all rounded-3xl group mb-1 ${isPendente ? "bg-orange-500/5 hover:bg-orange-500/10" : "hover:bg-blue-500/5"}`}>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black p-2.5 rounded-xl transition-all ${isPendente ? 'bg-orange-500 text-white animate-pulse shadow-lg shadow-orange-500/20' : 'bg-blue-500/10 text-blue-600'}`}>
                    {atend.horario}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-black uppercase italic tracking-tight ${darkMode ? "text-white" : "text-slate-800"}`}>{formatarParaTela(atend.nomePaciente)}</p>
                      {isPendente && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500 text-[8px] font-black text-white uppercase animate-bounce">
                          <AlertTriangle size={8} /> Pendente
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{atend.motivoAtendimento || "Consulta de Enfermagem"}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onAbrirPastaDigital(atend)} 
                  className={`p-3.5 rounded-2xl transition-all ${isPendente ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 active:scale-90" : "text-slate-400 hover:bg-blue-600 hover:text-white active:scale-90"}`}
                >
                  <Search size={18} />
                </button>
              </div>
            );
          }) : <div className="py-20 text-center text-[10px] font-black uppercase text-slate-300 italic tracking-[0.3em]">Aguardando registros...</div>}
        </div>
      </div>
      
      <div className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-4 print:hidden">
        rodhon intelligence — painel operacional 2026
      </div>
    </div>
  );
};

export default HomeEnfermeiro;