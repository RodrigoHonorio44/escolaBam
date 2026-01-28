import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; 
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { 
  Users, CheckCircle2, Search, Calendar, 
  Activity, ShieldCheck, Clock, Truck,
  ChevronLeft, ChevronRight, AlertTriangle,
  RotateCw, BarChart3, Filter, X, Printer, UserCircle,
  FileText, ArrowRight, ClipboardList, Thermometer, MapPin, Stethoscope, Building2, User, UserCheck
} from 'lucide-react';

// Sub-componentes do Modal Lateral
const VitalCard = ({ icon, label, value }) => (
  <div className="bg-white p-4 rounded-3xl flex flex-col items-center gap-2 border border-slate-200 shadow-sm text-center">
    <div className="p-2 bg-slate-50 rounded-xl shadow-inner">{icon}</div>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
    <p className="text-[12px] font-black text-slate-900 uppercase italic leading-none">{value}</p>
  </div>
);

const DetailSection = ({ title, children }) => (
  <div className="bg-white rounded-[35px] border border-slate-200 p-8 shadow-sm h-full flex flex-col">
    <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest mb-6">
      <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div> {title}
    </h4>
    {children}
  </div>
);

const HomeEnfermeiro = ({ user, setActiveTab, onAbrirPastaDigital, darkMode, visaoMensal, setVisaoMensal }) => {
  const [metricas, setMetricas] = useState({ 
    atendidoshoje: 0, 
    atendidosMes: 0,
    totalAlunos: 0,
    totalFuncionarios: 0,
    tempoMedio: 0,
    tempoMedioMes: 0,
    pendentes: 0 
  });
  
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null); 
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [resultadoRelatorio, setResultadoRelatorio] = useState(null);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);

  const [todosAtendimentosHoje, setTodosAtendimentosHoje] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  const formatarParaTela = (texto) => {
    if (!texto) return "";
    const palavras = texto.toString().toLowerCase().trim().split(/\s+/);
    return palavras.map(p => {
      if (p === 'r' || p === 's') return p.toUpperCase();
      if (p.length <= 1) return p.toUpperCase();
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
    const mesAtualPrefix = hojeLocal.substring(0, 7);

    const unsubAtendimentos = onSnapshot(collection(db, "atendimentos_enfermagem"), (snapshot) => {
      let totalMinHoje = 0, countHoje = 0, totalMinMes = 0, countMes = 0;
      let pendentesCount = 0, totalMes = 0;
      
      const todosOsDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const daEscola = todosOsDocs.filter(atend => {
        const escDoc = (atend.escola || "").toLowerCase().trim();
        return escDoc === escolaUser || escolaUser === "admin" || escolaUser === "";
      });

      const filtradosHoje = daEscola.filter(atend => (atend.data || "").trim() === hojeLocal);

      daEscola.forEach(atend => {
        const dataDoc = (atend.data || "").trim();
        const status = (atend.statusAtendimento || "").toLowerCase().trim();
        
        if (atend.horario && atend.horarioSaida && status === "finalizado") {
          const [h1, m1] = atend.horario.split(':').map(Number);
          const [h2, m2] = atend.horarioSaida.split(':').map(Number);
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diff > 0) {
            if (dataDoc === hojeLocal) { totalMinHoje += diff; countHoje++; }
            if (dataDoc.startsWith(mesAtualPrefix)) { totalMinMes += diff; countMes++; }
          }
        }
        if (dataDoc.startsWith(mesAtualPrefix)) totalMes++;
        if (dataDoc === hojeLocal && (status === "pendente" || status === "aberto" || status === "")) { 
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
    });

    const unsubPastas = onSnapshot(collection(db, "pastas_digitais"), (snapshot) => {
      const docsEscola = snapshot.docs.map(doc => doc.data()).filter(p => {
        const esc = (p.escola || "").toLowerCase().trim();
        return esc === escolaUser || escolaUser === "admin";
      });

      const alunos = docsEscola.filter(p => (p.tipoPerfil || "").toLowerCase().trim() === "aluno").length;
      const funcionarios = docsEscola.filter(p => (p.tipoPerfil || "").toLowerCase().trim() === "funcionario").length;

      setMetricas(prev => ({ 
        ...prev, 
        totalAlunos: alunos, 
        totalFuncionarios: funcionarios 
      }));
    });

    return () => { unsubAtendimentos(); unsubPastas(); };
  }, [user]);

  const totalPaginas = Math.ceil(todosAtendimentosHoje.length / itensPorPagina);
  const atendimentosPaginados = todosAtendimentosHoje.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-500/10 pb-8 print:hidden">
        <div>
          <h1 className={`text-4xl md:text-5xl font-[1000] italic tracking-tighter uppercase leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
            Olá, <span className="text-blue-600">{formatarParaTela(user?.nome)}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black italic uppercase tracking-widest">
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

      {/* CARD INTELIGENTE DE FILTRO (Condicional) */}
      {mostrarRelatorio && (
        <div className={`p-8 rounded-[45px] border-2 border-blue-500/20 animate-in slide-in-from-top duration-500 ${darkMode ? "bg-white/5" : "bg-blue-50/50"}`}>
          <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-blue-600 uppercase italic ml-4 tracking-widest">Início do Período</label>
              <input 
                type="date" 
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className={`w-full border-none rounded-2xl p-4 text-sm font-bold shadow-sm focus:ring-2 ring-blue-500 outline-none ${darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}`}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-blue-600 uppercase italic ml-4 tracking-widest">Fim do Período</label>
              <input 
                type="date" 
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className={`w-full border-none rounded-2xl p-4 text-sm font-bold shadow-sm focus:ring-2 ring-blue-500 outline-none ${darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"}`}
              />
            </div>
            <button 
              onClick={gerarRelatorioGeral}
              disabled={carregandoRelatorio}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-[1000] uppercase italic text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center gap-3 disabled:opacity-50 h-[52px]"
            >
              {carregandoRelatorio ? <RotateCw className="animate-spin" size={18}/> : <Filter size={18}/>}
              {carregandoRelatorio ? "Processando" : "Consultar"}
            </button>
          </div>

          {/* RESULTADOS DA CONSULTA INTELIGENTE */}
          {resultadoRelatorio && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 animate-in fade-in zoom-in duration-300">
              <div className={`${darkMode ? "bg-white/5 border-white/10" : "bg-white border-blue-100"} p-6 rounded-[35px] shadow-sm border`}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Período</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{resultadoRelatorio.total}</span>
                  <span className="text-[10px] font-black text-blue-600 uppercase">Ações</span>
                </div>
              </div>
              
              <div className={`${darkMode ? "bg-white/5 border-white/10" : "bg-white border-blue-100"} p-6 rounded-[35px] shadow-sm border`}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Média de Tempo</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{resultadoRelatorio.tempoMedio}</span>
                  <span className="text-[10px] font-black text-orange-500 uppercase">Minutos</span>
                </div>
              </div>

              <button 
                onClick={() => window.print()}
                className="bg-slate-900 p-6 rounded-[35px] shadow-lg flex items-center justify-center gap-4 group hover:bg-blue-600 transition-all text-white"
              >
                <Printer className="group-hover:scale-110 transition-transform" size={24} />
                <div className="text-left">
                  <p className="font-black italic uppercase text-sm leading-none">Exportar PDF</p>
                  <p className="text-white/40 font-bold uppercase text-[8px] tracking-tighter">Gerar relatório de auditoria</p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CARDS KPIS - ATUALIZADOS COM TOGGLE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
        
        {/* CARD TEMPO MÉDIO (TOQUE PARA MUDAR) */}
        <div 
          onClick={() => setVisaoMensal(!visaoMensal)}
          className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm"}`}
        >
          <div className="flex justify-between items-start">
            <Clock className="text-orange-500" size={32} />
            <span className={`text-[7px] font-black px-2 py-1 rounded-full uppercase italic tracking-tighter transition-colors ${visaoMensal ? 'bg-blue-600 text-white' : 'bg-slate-500/10 text-slate-400'}`}>
              {visaoMensal ? "Visão Mensal" : "Visão Diária"}
            </span>
          </div>
          <div>
            <span className={`text-5xl font-[1000] italic leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
              {visaoMensal ? metricas.tempoMedioMes : metricas.tempoMedio}
            </span>
            <span className="text-xs font-black ml-1 text-slate-400 italic">MIN</span>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">
              Média {visaoMensal ? "do Mês" : "Hoje"}
            </p>
          </div>
        </div>
        
        {/* CARD PENDENTES */}
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 transition-all hover:scale-[1.02] ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm"}`}>
          <Activity className={metricas.pendentes > 0 ? "text-orange-500 animate-pulse" : "text-slate-400"} size={32} />
          <div>
            <span className={`text-5xl font-[1000] italic leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>{metricas.pendentes}</span>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Pendentes</p>
          </div>
        </div>

        {/* CARD TOTAL ATENDIDOS (TOQUE PARA MUDAR) */}
        <div 
          onClick={() => setVisaoMensal(!visaoMensal)}
          className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm"}`}
        >
          <div className="flex justify-between items-start">
            <CheckCircle2 className="text-emerald-500" size={32} />
            <span className={`text-[7px] font-black px-2 py-1 rounded-full uppercase italic tracking-tighter transition-colors ${visaoMensal ? 'bg-blue-600 text-white' : 'bg-slate-500/10 text-slate-400'}`}>
              {visaoMensal ? "Visão Mensal" : "Visão Diária"}
            </span>
          </div>
          <div>
            <span className={`text-5xl font-[1000] italic leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
              {visaoMensal ? metricas.atendidosMes : metricas.atendidoshoje}
            </span>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">
              Total {visaoMensal ? "do Mês" : "Hoje"}
            </p>
          </div>
        </div>

        {/* CARD POPULAÇÃO */}
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 transition-all hover:scale-[1.02] ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm"}`}>
          <Users className="text-blue-500" size={32} />
          <div>
            <span className={`text-4xl font-[1000] italic leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
              {metricas.totalAlunos}<span className="text-xl mx-1 text-slate-400">/</span>{metricas.totalFuncionarios}
            </span>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest leading-tight">Alunos / Funcionários</p>
          </div>
        </div>
      </div>

      {/* FLUXO DO DIA */}
      <div className={`rounded-[40px] border print:hidden transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm"}`}>
        <div className="p-6 border-b border-slate-500/5 flex items-center justify-between">
          <h4 className="text-[10px] font-[1000] uppercase text-slate-500 italic tracking-[0.2em] flex items-center gap-2">Fluxo Operacional Diário</h4>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-3">
              <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} className="p-1 hover:text-blue-500 transition-colors"><ChevronLeft size={18}/></button>
              <span className="text-[10px] font-black italic">{paginaAtual} / {totalPaginas}</span>
              <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} className="p-1 hover:text-blue-500 transition-colors"><ChevronRight size={18}/></button>
            </div>
          )}
        </div>
        <div className="p-4">
          {atendimentosPaginados.length > 0 ? atendimentosPaginados.map(atend => {
            const isPendente = (atend.statusAtendimento || "").toLowerCase() !== "finalizado";
            const perfil = (atend.perfilPaciente || "").toLowerCase().trim();
            const isAluno = perfil === "aluno";
            
            return (
              <div key={atend.id} className={`p-4 flex items-center justify-between border-b border-slate-500/5 last:border-0 transition-all rounded-3xl group mb-1 ${isPendente ? "bg-orange-500/5 hover:bg-orange-500/10" : "hover:bg-blue-500/5"}`}>
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[70px]">
                    <span className={`text-[11px] font-black p-2.5 rounded-2xl block transition-all italic ${isPendente ? 'bg-orange-500 text-white animate-pulse' : 'bg-blue-500/10 text-blue-600'}`}>
                      {atend.horario}
                    </span>
                    <p className="text-[8px] font-black text-slate-400 mt-1 uppercase italic">HOJE</p>
                  </div>
                  <div className="cursor-pointer" onClick={() => setAtendimentoSelecionado(atend)}>
                    <div className="flex items-center gap-2">
                      <p className={`text-base font-[1000] uppercase italic tracking-tighter ${darkMode ? "text-white" : "text-slate-800"}`}>
                        {formatarParaTela(atend.nomePaciente)}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 ${isAluno ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {atend.perfilPaciente || "Paciente"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                       <p className="text-[10px] text-slate-400 font-bold uppercase italic tracking-tight">{atend.motivoAtendimento || "Consulta de Enfermagem"}</p>
                       {atend.cargo && <span className="text-[8px] text-blue-500 font-black uppercase italic">• {atend.cargo}</span>}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setAtendimentoSelecionado(atend)} 
                  className={`p-3.5 rounded-2xl transition-all shadow-sm ${isPendente ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-slate-500/5 text-slate-400 hover:bg-blue-600 hover:text-white"}`}
                >
                  <Search size={20} />
                </button>
              </div>
            );
          }) : <div className="py-20 text-center text-[10px] font-black uppercase text-slate-300 italic tracking-[0.3em]">Aguardando registros...</div>}
        </div>
      </div>

      {/* MODAL LATERAL "BAM" */}
      {atendimentoSelecionado && (
        <div className="fixed inset-0 z-[200] flex items-center justify-end bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl h-[95vh] rounded-[45px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
            
            {(() => {
              const statusTexto = (atendimentoSelecionado.statusAtendimento || "").toLowerCase();
              const estaAberto = statusTexto.includes("aberto") || statusTexto.includes("aguardando") || statusTexto === "";
              const queixaDisplay = atendimentoSelecionado.motivoAtendimento || atendimentoSelecionado.queixaPrincipal || "NÃO INFORMADA";
              
              return (
                <>
                {/* HEADER DO MODAL */}
                <div className={`p-10 text-white flex justify-between items-start relative overflow-hidden transition-colors ${estaAberto ? 'bg-orange-600' : 'bg-slate-900'}`}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`${estaAberto ? 'bg-orange-800' : 'bg-blue-600'} text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter`}>
                        {estaAberto ? 'ATENDIMENTO EM ABERTO' : 'DOCUMENTO BAM'}
                      </span>
                      <span className="text-[9px] font-black text-white/60 uppercase">
                        {atendimentoSelecionado.data} às {atendimentoSelecionado.horario}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                      {atendimentoSelecionado.baenf || 'S/N'}
                    </h3>
                    <p className="text-white/80 text-xs font-black uppercase italic mt-2 flex items-center gap-1">
                      <UserCheck size={14}/> {formatarParaTela(atendimentoSelecionado.nomePaciente)}
                    </p>
                  </div>
                  <button 
                    onClick={() => setAtendimentoSelecionado(null)} 
                    className="relative z-10 p-3 bg-white/10 hover:bg-rose-600 rounded-2xl transition-all shadow-lg"
                  >
                    <X size={24}/>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30">
                  {estaAberto && (
                    <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-[30px] flex items-center gap-4 animate-pulse">
                      <AlertTriangle className="text-orange-600" size={32} />
                      <div>
                        <p className="text-orange-900 font-black uppercase italic text-sm leading-none">Aguardando Desfecho</p>
                        <p className="text-orange-700 text-[10px] font-bold uppercase mt-1">Este atendimento ainda não foi finalizado no sistema.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalCard icon={<Thermometer size={18} className="text-rose-500"/>} label="TEMPERATURA" value={`${atendimentoSelecionado.temperatura || '--'}°C`} />
                    <VitalCard icon={<Activity size={18} className="text-blue-500"/>} label="PRESSÃO" value={atendimentoSelecionado.pressaoArterial || '--'} />
                    <VitalCard icon={<MapPin size={18} className="text-green-500"/>} label="DESTINO" value={atendimentoSelecionado.destinoHospital || (estaAberto ? 'EM ANÁLISE' : 'ALTA')} />
                    <VitalCard icon={<Clock size={18} className="text-orange-500"/>} label="DURAÇÃO" value={atendimentoSelecionado.tempoDuracao || '--'} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailSection title="Avaliação Clínica">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Motivo / Queixa Principal</p>
                          <p className="text-sm font-black text-slate-900 uppercase italic leading-tight">{queixaDisplay}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Evolução de Enfermagem</p>
                          <div className="p-5 bg-white rounded-3xl text-[11px] text-slate-600 font-bold uppercase leading-relaxed border border-slate-200 shadow-sm min-h-[100px]">
                            {atendimentoSelecionado.descricaoAtendimento || "Nenhuma observação registrada."}
                          </div>
                        </div>
                      </div>
                    </DetailSection>

                    <DetailSection title="Conduta e Tratamento">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Procedimentos Realizados</p>
                          <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 text-[11px] text-blue-900 font-black uppercase italic min-h-[80px]">
                            {atendimentoSelecionado.procedimentos || "Nenhum procedimento registrado."}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ações Disponíveis</p>
                          <button 
                            onClick={() => {
                              onAbrirPastaDigital(atendimentoSelecionado);
                              setAtendimentoSelecionado(null);
                            }}
                            className="w-full p-4 bg-slate-900 text-white rounded-2xl text-[10px] font-[1000] uppercase italic hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                          >
                            <FileText size={14}/> Acessar Pasta Digital
                          </button>
                        </div>
                      </div>
                    </DetailSection>
                  </div>

                  <div className="bg-white rounded-[35px] border border-slate-200 p-8 shadow-sm mb-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Stethoscope size={12}/> Profissional</p>
                        <p className="text-xs font-black text-slate-900 uppercase italic">{atendimentoSelecionado.profissionalNome || 'Não Identificado'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Building2 size={12}/> Unidade</p>
                        <p className="text-xs font-black text-slate-900 uppercase italic">{atendimentoSelecionado.escola || 'Não informada'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><User size={12}/> Registro</p>
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full ${estaAberto ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {estaAberto ? 'PENDENTE' : 'FINALIZADO'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      
      <div className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-4 print:hidden">
        rodhon intelligence — painel operacional 2026
      </div>
    </div>
  );
};

export default HomeEnfermeiro;