import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; 
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  Users, CheckCircle2, Search, Calendar, 
  Activity, ShieldCheck, Clock
} from 'lucide-react';

const HomeEnfermeiro = ({ user, onAbrirPastaDigital, darkMode }) => {
  const [metricas, setMetricas] = useState({ 
    atendidoshoje: 0, 
    totalPacientes: 0,
    tempoMedio: 0 
  });
  const [ultimosAtendimentos, setUltimosAtendimentos] = useState([]);

  useEffect(() => {
    const escolaIdentificador = user?.escola || user?.escolaId;
    if (!escolaIdentificador) return;

    const hoje = new Date().toLocaleDateString('en-CA'); 

    const qAtendimentos = query(
      collection(db, "atendimentos_enfermagem"),
      where("dataAtendimento", "==", hoje),
      where("escola", "==", escolaIdentificador) 
    );

    const unsubAtendimentos = onSnapshot(qAtendimentos, (snapshot) => {
      let totalMinutos = 0;
      let contagemComTempo = 0;

      const dados = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Lógica para calcular tempo médio (se houver horaInicio e horaFim)
        if (data.horaInicio && data.horaFim) {
          const inicio = new Date(`1970-01-01T${data.horaInicio}`);
          const fim = new Date(`1970-01-01T${data.horaFim}`);
          const diff = (fim - inicio) / (1000 * 60); // converte para minutos
          if (diff > 0) {
            totalMinutos += diff;
            contagemComTempo++;
          }
        }

        return {
          id: doc.id,
          ...data,
          horario: data.horarioReferencia || data.horaInicio 
        };
      });

      const media = contagemComTempo > 0 ? Math.round(totalMinutos / contagemComTempo) : 0;

      setMetricas(prev => ({ 
        ...prev, 
        atendidoshoje: snapshot.size,
        tempoMedio: media
      }));
      
      const ordenados = dados.sort((a, b) => b.horaInicio?.localeCompare(a.horaInicio));
      setUltimosAtendimentos(ordenados.slice(0, 5));
    });

    const qPacientes = query(
      collection(db, "alunos"),
      where("escola", "==", escolaIdentificador)
    );

    const unsubPacientes = onSnapshot(qPacientes, (snapshot) => {
      setMetricas(prev => ({ ...prev, totalPacientes: snapshot.size }));
    });

    return () => {
      unsubAtendimentos();
      unsubPacientes();
    };
  }, [user]);

  const executarAction = (fn) => {
    if (typeof fn === 'function') fn();
  };

  const formatarNome = (nomeCompleto) => {
    if (!nomeCompleto) return "Profissional";
    const partes = nomeCompleto.trim().split(' ');
    return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : partes[0];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-500/10 pb-8">
        <div>
          <h1 className={`text-4xl md:text-5xl font-[1000] italic tracking-tighter uppercase leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
            Olá, <span className="text-blue-600">{formatarNome(user?.nome)}</span>
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-2 whitespace-nowrap">
                {user?.cargo || "Enfermeiro(a)"}
                {user?.registroProfissional && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-blue-300" />
                    <span className="opacity-80">COREN: {user.registroProfissional}</span>
                  </>
                )}
              </span>
            </div>
            <span className="text-slate-400 text-xs font-bold italic uppercase">{user?.escola}</span>
          </div>
        </div>

        <div className={`p-4 rounded-3xl border flex items-center gap-4 shrink-0 ${darkMode ? "bg-white/5 border-white/10" : "bg-white shadow-sm"}`}>
          <Calendar className="text-blue-500" size={20} />
          <p className={`text-sm font-black italic ${darkMode ? "text-white" : "text-slate-800"}`}>
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
          </p>
        </div>
      </div>

      {/* CARDS KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* NOVO CARD: TEMPO MÉDIO */}
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 ${darkMode ? "bg-white/5 border-white/10" : "bg-white"}`}>
          <Clock className="text-orange-500" size={32} />
          <div>
            <span className={`text-5xl font-[1000] italic ${darkMode ? "text-white" : "text-slate-900"}`}>
              {metricas.tempoMedio}<span className="text-xl ml-1">min</span>
            </span>
            <p className="text-[10px] font-black text-slate-500 uppercase">Tempo Médio de Atendimento</p>
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

      {/* LISTA DE HOJE */}
      <div className={`rounded-[40px] border overflow-hidden ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <Activity size={18} className="text-blue-500" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fluxo Recente</h4>
        </div>
        <div className="p-4">
          {ultimosAtendimentos.length > 0 ? ultimosAtendimentos.map(atend => (
            <div key={atend.id} className="p-4 flex items-center justify-between hover:bg-blue-500/5 rounded-2xl transition-all">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 p-2 rounded-lg">{atend.horario}</span>
                <div>
                  <p className="text-sm font-black uppercase italic">{atend.nomePaciente}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{atend.queixaPrincipal}</p>
                </div>
              </div>
              <button 
                onClick={() => executarAction(onAbrirPastaDigital)}
                className="p-2 hover:bg-blue-500 hover:text-white rounded-full transition-all"
              >
                <Search size={16} />
              </button>
            </div>
          )) : (
            <div className="py-12 text-center text-[10px] font-black uppercase text-slate-500 italic opacity-40">
              Nenhum registro encontrado para hoje.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeEnfermeiro;