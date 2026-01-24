import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; 
import { collection, query, onSnapshot } from 'firebase/firestore';
import { 
  Users, CheckCircle2, Search, Calendar, 
  Activity, ShieldCheck, Clock, Truck,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const HomeEnfermeiro = ({ user, onAbrirPastaDigital, darkMode }) => {
  const [metricas, setMetricas] = useState({ 
    atendidoshoje: 0, 
    totalPacientes: 0,
    tempoMedio: 0 
  });
  
  const [todosAtendimentosHoje, setTodosAtendimentosHoje] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  // Formata nomes: "lana giromba" -> "Lana Giromba" e respeita "R S"
  const formatarParaTela = (texto) => {
    if (!texto) return "";
    return texto.toString().split(' ').map(p => {
      if (p.toLowerCase() === 'r' || p.toLowerCase() === 's') return p.toUpperCase();
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    }).join(' ');
  };

  useEffect(() => {
    const escolaUser = (user?.escola || user?.escolaId || "").toLowerCase().trim();
    const hojeISO = new Date().toLocaleDateString('en-CA'); 

    // Monitoramento de Atendimentos
    const qAtendimentos = collection(db, "atendimentos_enfermagem");
    const unsubAtendimentos = onSnapshot(qAtendimentos, (snapshot) => {
      let totalMinutos = 0;
      let contagemComTempo = 0;
      const todosOsDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtro manual para garantir que os dados apareçam sem erro de índice
      const filtrados = todosOsDocs.filter(atend => {
        const escolaDoc = (atend.escola || "").toLowerCase().trim();
        return (escolaDoc === escolaUser || escolaUser === "admin") && atend.data === hojeISO;
      });

      filtrados.forEach(atend => {
        if (atend.horario && atend.horarioSaida) {
          const [h1, m1] = atend.horario.split(':').map(Number);
          const [h2, m2] = atend.horarioSaida.split(':').map(Number);
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diff > 0) { totalMinutos += diff; contagemComTempo++; }
        }
      });

      setMetricas(prev => ({ 
        ...prev, 
        atendidoshoje: filtrados.length,
        tempoMedio: contagemComTempo > 0 ? Math.round(totalMinutos / contagemComTempo) : 0
      }));
      
      const ordenados = filtrados.sort((a, b) => (b.horario || "").localeCompare(a.horario || ""));
      setTodosAtendimentosHoje(ordenados);
    });

    // Monitoramento de Alunos
    const qPacientes = collection(db, "alunos");
    const unsubPacientes = onSnapshot(qPacientes, (snapshot) => {
      const total = snapshot.docs.filter(doc => 
        (doc.data().escola || "").toLowerCase().trim() === escolaUser
      ).length;
      setMetricas(prev => ({ ...prev, totalPacientes: total }));
    });

    return () => { unsubAtendimentos(); unsubPacientes(); };
  }, [user]);

  // Lógica de Paginação
  const totalPaginas = Math.ceil(todosAtendimentosHoje.length / itensPorPagina);
  const atendimentosPaginados = todosAtendimentosHoje.slice(
    (paginaAtual - 1) * itensPorPagina, 
    paginaAtual * itensPorPagina
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER COM COREN REATIVADO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-500/10 pb-8">
        <div>
          <h1 className={`text-4xl md:text-5xl font-[1000] italic tracking-tighter uppercase leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
            Olá, <span className="text-blue-600">{formatarParaTela(user?.nome)}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-2">
                {user?.cargo || "Enfermeiro(a)"}
                {user?.registroProfissional && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                    <span>COREN: {user.registroProfissional}</span>
                  </>
                )}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 ${darkMode ? "bg-white/5 border-white/10" : "bg-white"}`}>
          <Clock className="text-orange-500" size={32} />
          <div>
            <span className={`text-5xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{metricas.tempoMedio}<span className="text-xl ml-1">min</span></span>
            <p className="text-[10px] font-black text-slate-500 uppercase">Tempo Médio</p>
          </div>
        </div>
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 ${darkMode ? "bg-white/5 border-white/10" : "bg-white"}`}>
          <CheckCircle2 className="text-emerald-500" size={32} />
          <div>
            <span className={`text-5xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{metricas.atendidoshoje}</span>
            <p className="text-[10px] font-black text-slate-500 uppercase">Atendidos Hoje</p>
          </div>
        </div>
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 ${darkMode ? "bg-white/5 border-white/10" : "bg-white"}`}>
          <Users className="text-blue-500" size={32} />
          <div>
            <span className={`text-5xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>{metricas.totalPacientes}</span>
            <p className="text-[10px] font-black text-slate-500 uppercase">Alunos na Unidade</p>
          </div>
        </div>
      </div>

      {/* FLUXO RECENTE COM PAGINAÇÃO NO FOOTER */}
      <div className={`rounded-[40px] border ${darkMode ? "bg-white/5 border-white/10" : "bg-white shadow-sm"}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fluxo do Dia</h4>
          </div>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="p-1 hover:bg-slate-500/10 rounded-full disabled:opacity-10"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-black text-slate-400">{paginaAtual}/{totalPaginas}</span>
              <button 
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="p-1 hover:bg-slate-500/10 rounded-full disabled:opacity-10"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="p-4 min-h-[380px]">
          {atendimentosPaginados.length > 0 ? atendimentosPaginados.map(atend => (
            <div key={atend.id} className="p-4 flex items-center justify-between hover:bg-blue-500/5 rounded-2xl transition-all border-b border-slate-500/5 last:border-0">
              <div className="flex items-center gap-4">
                <span className={`text-[10px] font-black p-2 rounded-lg tabular-nums ${atend.tipoRegistro === 'remoção' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
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
                    {atend.tipoRegistro === 'remoção' ? `Remoção: ${atend.motivoEncaminhamento}` : (atend.motivoAtendimento || "Consulta Local")}
                  </p>
                </div>
              </div>
              <button onClick={() => onAbrirPastaDigital(atend)} className="p-3 text-slate-400 hover:text-blue-500">
                <Search size={18} />
              </button>
            </div>
          )) : (
            <div className="py-20 text-center text-[10px] font-black uppercase text-slate-500 italic opacity-30">
              Nenhum registro para hoje.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeEnfermeiro;