import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; 
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { 
  Users, CheckCircle2, PlusCircle, Search,
  ArrowUpRight, Calendar, Activity, ShieldCheck
} from 'lucide-react';

const HomeEnfermeiro = ({ user, onIniciarAtendimento, onAbrirPastaDigital, darkMode }) => {
  const [metricas, setMetricas] = useState({ atendidoshoje: 0, totalPacientes: 0 });
  const [ultimosAtendimentos, setUltimosAtendimentos] = useState([]);

  useEffect(() => {
    // IMPORTANTE: Use o campo que identifica a escola no seu objeto 'user'
    // Se o seu usuário logado tiver 'escola', use user.escola
    const escolaIdentificador = user?.escola || user?.escolaId;
    
    if (!escolaIdentificador) {
      console.warn("Aviso: Identificador da escola não encontrado no usuário logado.");
      return;
    }

    const hoje = new Date().toLocaleDateString('en-CA'); // "2026-01-22"

    // 1. QUERY DE ATENDIMENTOS (Ajustada para o campo 'escola' que você mostrou)
    const qAtendimentos = query(
      collection(db, "atendimentos_enfermagem"),
      where("dataAtendimento", "==", hoje),
      where("escola", "==", escolaIdentificador) 
    );

    const unsubAtendimentos = onSnapshot(qAtendimentos, (snapshot) => {
      console.log("Docs encontrados hoje:", snapshot.size);
      setMetricas(prev => ({ ...prev, atendidoshoje: snapshot.size }));
      
      const dados = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Usamos o campo 'horarioReferencia' que você tem no banco
        horario: doc.data().horarioReferencia || doc.data().horaInicio 
      }));

      // Ordenação manual para não precisar criar índices no Firebase agora
      const ordenados = dados.sort((a, b) => b.horaInicio?.localeCompare(a.horaInicio));
      setUltimosAtendimentos(ordenados.slice(0, 5));
    });

    // 2. QUERY DE ALUNOS (Ajustada para o campo 'escola')
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

  // Função de segurança para os botões
  const executarAction = (fn) => {
    if (typeof fn === 'function') {
      fn();
    } else {
      console.error("Erro: A função de navegação não foi passada para o HomeEnfermeiro.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER COM NOME E CARGO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-500/10 pb-8">
        <div>
          <h1 className={`text-5xl font-[1000] italic tracking-tighter uppercase leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
            Olá, <span className="text-blue-600">{user?.nome?.split(' ')[0] || "Profissional"}</span>
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase text-blue-600">
                {user?.cargo || "Enfermeiro(a)"}
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
        <button 
          onClick={() => executarAction(onIniciarAtendimento)}
          className="bg-[#0F172A] hover:bg-blue-600 p-8 rounded-[40px] text-white transition-all h-48 flex flex-col justify-between group overflow-hidden relative"
        >
          <PlusCircle size={32} className="relative z-10" />
          <h3 className="text-2xl font-[1000] uppercase italic leading-none relative z-10">Iniciar<br/>Atendimento</h3>
          <ArrowUpRight className="absolute top-6 right-6 opacity-10 group-hover:opacity-30" size={80} />
        </button>

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
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 p-2 rounded-lg">{atend.horarioReferencia}</span>
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
              Nenhum registro encontrado para hoje nesta unidade.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeEnfermeiro;