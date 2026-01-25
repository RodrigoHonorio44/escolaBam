import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; 
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  Users, CheckCircle2, Search, Calendar, 
  Activity, ShieldCheck, Clock, Truck,
  ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';

const HomeEnfermeiro = ({ user, onAbrirPastaDigital, darkMode }) => {
  const [metricas, setMetricas] = useState({ 
    atendidoshoje: 0, 
    totalPacientes: 0,
    tempoMedio: 0,
    pendentes: 0 
  });
  
  const [todosAtendimentosHoje, setTodosAtendimentosHoje] = useState([]);
  const [alertasSurtos, setAlertasSurtos] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  const formatarParaTela = (texto) => {
    if (!texto) return "";
    const palavras = texto.toString().toLowerCase().split(' ');
    return palavras.map(p => {
      if (p === 'r' || p === 's') return p.toUpperCase();
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  };

  useEffect(() => {
    const escolaUser = (user?.escola || "").toLowerCase().trim();
    const agoraLocal = new Date();
    const hojeLocal = [
      agoraLocal.getFullYear(),
      String(agoraLocal.getMonth() + 1).padStart(2, '0'),
      String(agoraLocal.getDate()).padStart(2, '0')
    ].join('-');

    const colRef = collection(db, "atendimentos_enfermagem");
    
    const unsubAtendimentos = onSnapshot(colRef, (snapshot) => {
      let totalMinutos = 0;
      let contagemComTempo = 0;
      let pendentesCount = 0;
      const mapaSurtos = {};

      const todosOsDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const filtrados = todosOsDocs.filter(atend => {
        const escolaDoc = (atend.escola || "").toLowerCase().trim();
        const dataDoc = (atend.data || "").trim();
        const eDaEscola = escolaDoc === escolaUser || escolaUser === "admin" || escolaUser === "";
        return eDaEscola && dataDoc === hojeLocal;
      });

      filtrados.forEach(atend => {
        const status = (atend.statusAtendimento || "").toLowerCase().trim();
        if (status === "pendente" || status === "aberto") pendentesCount++;
        
        if (atend.horario && atend.horarioSaida && (status === "finalizado" || status === "concluído")) {
          const [h1, m1] = atend.horario.split(':').map(Number);
          const [h2, m2] = atend.horarioSaida.split(':').map(Number);
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diff > 0) { totalMinutos += diff; contagemComTempo++; }
        }

        const turma = (atend.turma || "Sem Turma").toUpperCase();
        const motivo = (atend.motivoAtendimento || "Consulta").toUpperCase();
        const chaveSurto = `${turma}-${motivo}`;
        
        if (!mapaSurtos[chaveSurto]) mapaSurtos[chaveSurto] = { qtd: 0, turma, motivo };
        mapaSurtos[chaveSurto].qtd++;
      });

      const novosAlertas = Object.values(mapaSurtos)
        .filter(item => item.qtd >= 3)
        .map(item => ({
          titulo: item.qtd >= 5 ? "SURTO CRÍTICO DETECTADO" : "ALERTA DE INCIDÊNCIA",
          msg: `${item.qtd} casos de ${item.motivo} na turma ${item.turma}`,
          nivel: item.qtd >= 5 ? "critico" : "atencao"
        }));

      setAlertasSurtos(novosAlertas);

      setMetricas(prev => ({ 
        ...prev, 
        atendidoshoje: filtrados.length,
        pendentes: pendentesCount,
        tempoMedio: contagemComTempo > 0 ? Math.round(totalMinutos / contagemComTempo) : 0
      }));
      
      setTodosAtendimentosHoje(filtrados.sort((a, b) => {
        const statusA = (a.statusAtendimento || "").toLowerCase().trim();
        const statusB = (b.statusAtendimento || "").toLowerCase().trim();
        const isPendA = statusA === "pendente" || statusA === "aberto";
        const isPendB = statusB === "pendente" || statusB === "aberto";
        if (isPendA && !isPendB) return -1;
        if (!isPendA && isPendB) return 1;
        return (b.horario || "").localeCompare(a.horario || "");
      }));
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
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-500/10 pb-8">
        <div>
          <h1 className={`text-4xl md:text-5xl font-[1000] italic tracking-tighter uppercase leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
            Olá, <span className="text-blue-600">{formatarParaTela(user?.nome)}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase text-blue-600">
                {user?.cargo || "Enfermeiro(a)"} {user?.registroProfissional && `| ${user.registroProfissional}`}
              </span>
            </div>
            <span className="text-slate-400 text-xs font-bold italic uppercase">{user?.escola}</span>
          </div>
        </div>
        <div className={`p-4 rounded-3xl border flex items-center gap-4 ${darkMode ? "bg-white/5 border-white/10" : "bg-white shadow-sm"}`}>
          <Calendar className="text-blue-500" size={20} />
          <p className={`text-sm font-black italic ${darkMode ? "text-white" : "text-slate-800"}`}>
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
          </p>
        </div>
      </div>

      {/* CARDS KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 ${darkMode ? "bg-white/5 border-white/10" : "bg-white shadow-sm"}`}>
          <Clock className="text-orange-500" size={32} />
          <div>
            <span className={`text-4xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{metricas.tempoMedio} min</span>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tempo Médio</p>
          </div>
        </div>
        
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 ${darkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-100"}`}>
          <Activity className="text-orange-500" size={32} />
          <div>
            <span className={`text-4xl font-[1000] italic ${darkMode ? "text-orange-600" : "text-orange-700"}`}>{metricas.pendentes}</span>
            <p className="text-[10px] font-black text-orange-600 uppercase italic tracking-widest">Pendentes</p>
          </div>
        </div>

        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 ${darkMode ? "bg-white/5 border-white/10" : "bg-white shadow-sm"}`}>
          <CheckCircle2 className="text-emerald-500" size={32} />
          <div>
            <span className={`text-4xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{metricas.atendidoshoje}</span>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Hoje</p>
          </div>
        </div>

        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 ${darkMode ? "bg-white/5 border-white/10" : "bg-white shadow-sm"}`}>
          <Users className="text-blue-500" size={32} />
          <div>
            <span className={`text-4xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{metricas.totalPacientes}</span>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alunos</p>
          </div>
        </div>
      </div>

      {/* ALERTAS DE SURTO (AGORA EMBAIXO DOS CARDS) */}
      {alertasSurtos.length > 0 && (
        <div className="space-y-3">
          {alertasSurtos.map((alerta, i) => (
            <div key={i} className={`p-4 rounded-[24px] border flex items-center gap-4 animate-pulse ${alerta.nivel === 'critico' ? "bg-red-500/10 border-red-500/20" : "bg-orange-500/10 border-orange-500/20"}`}>
              <AlertTriangle className={alerta.nivel === 'critico' ? "text-red-500" : "text-orange-500"} size={24} />
              <div>
                <p className={`text-[10px] font-black uppercase ${alerta.nivel === 'critico' ? "text-red-600" : "text-orange-600"}`}>{alerta.titulo}</p>
                <p className={`text-sm font-bold uppercase italic ${darkMode ? "text-white" : "text-slate-800"}`}>{alerta.msg}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FLUXO DO DIA */}
      <div className={`rounded-[40px] border ${darkMode ? "bg-white/5 border-white/10" : "bg-white shadow-sm"}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" /> Fluxo do Dia
          </h4>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="p-1 hover:bg-slate-500/10 rounded-full disabled:opacity-10 transition-colors"><ChevronLeft size={16} /></button>
              <span className="text-[10px] font-black text-slate-400 tabular-nums">{paginaAtual}/{totalPaginas}</span>
              <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="p-1 hover:bg-slate-500/10 rounded-full disabled:opacity-10 transition-colors"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>

        <div className="p-4 min-h-[380px]">
          {atendimentosPaginados.length > 0 ? atendimentosPaginados.map(atend => {
            const status = (atend.statusAtendimento || "").toLowerCase().trim();
            const isPendente = status === 'pendente' || status === 'aberto';
            
            return (
              <div key={atend.id} className={`p-4 flex items-center justify-between rounded-2xl transition-all border-b border-slate-500/5 last:border-0 ${isPendente ? 'bg-orange-500/5' : 'hover:bg-blue-500/5'}`}>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black p-2 rounded-lg tabular-nums ${isPendente ? 'bg-orange-500 text-white animate-pulse shadow-lg' : 'bg-blue-500/10 text-blue-500'}`}>
                    {atend.horario}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-black uppercase italic ${darkMode ? "text-white" : "text-slate-800"}`}>
                        {formatarParaTela(atend.nomePaciente)}
                      </p>
                      {atend.tipoRegistro === 'remoção' && <Truck size={12} className="text-red-500" />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">
                      {isPendente ? `PENDENTE: ${atend.motivoAtendimento || atend.motivoEncaminhamento}` : (atend.motivoAtendimento || "Consulta")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => onAbrirPastaDigital(atend)} className="p-3 text-slate-400 hover:text-blue-500 transition-colors">
                    <Search size={18} />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="py-20 text-center text-[10px] font-black uppercase text-slate-500 italic opacity-30 tracking-[0.3em]">
              Nenhum registro para hoje.
            </div>
          )}
        </div>
      </div>
      <div className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-4">
        rodhon intelligence — painel operacional 2026
      </div>
    </div>
  );
};

export default HomeEnfermeiro;