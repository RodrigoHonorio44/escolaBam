import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; 
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  Search,
  ArrowUpRight,
  Calendar,
  Activity
} from 'lucide-react';

const HomeEnfermeiro = ({ user, onIniciarAtendimento, onAbrirHistorico, onAbrirCadastros, onAbrirPastaDigital }) => {
  const [metricas, setMetricas] = useState({ atendidoshoje: 0, totalPacientes: 0 });
  const [ultimosAtendimentos, setUltimosAtendimentos] = useState([]);

  useEffect(() => {
    // Filtro para o dia atual (YYYY-MM-DD)
    const hoje = new Date().toISOString().split('T')[0];
    
    // 1. Escuta em tempo real dos atendimentos de HOJE
    const qAtendimentos = query(
      collection(db, "atendimentos_enfermagem"),
      where("dataAtendimento", "==", hoje),
      orderBy("createdAt", "desc")
    );

    const unsubAtendimentos = onSnapshot(qAtendimentos, (snapshot) => {
      setMetricas(prev => ({ ...prev, atendidoshoje: snapshot.size }));
      setUltimosAtendimentos(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })).slice(0, 5)); // Pega os 5 mais recentes
    });

    // 2. Escuta em tempo real do total de alunos
    const qPacientes = query(collection(db, "alunos"));

    const unsubPacientes = onSnapshot(qPacientes, (snapshot) => {
      setMetricas(prev => ({ ...prev, totalPacientes: snapshot.size }));
    });

    return () => {
      unsubAtendimentos();
      unsubPacientes();
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER DE BOAS-VINDAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">
            Dashboard
          </h1>
          <p className="text-slate-500 font-medium">
            Olá, <span className="text-blue-600 font-bold">{user?.displayName || 'Enfermeiro'}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-2xl">
            <Calendar size={20} />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Data de Hoje</p>
            <p className="text-sm font-bold text-slate-700">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* CARDS DE RESUMO (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Iniciar Atendimento */}
        <button 
          onClick={onIniciarAtendimento}
          className="bg-[#0F172A] group hover:bg-blue-600 p-8 rounded-[40px] text-white transition-all shadow-xl flex flex-col justify-between h-48 relative overflow-hidden text-left"
        >
          <div className="bg-blue-600 group-hover:bg-white p-3 rounded-2xl w-fit transition-colors">
            <PlusCircle className="text-white group-hover:text-blue-600 transition-colors" size={24} />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black leading-none uppercase italic">Iniciar<br/>Atendimento</h3>
            <p className="text-slate-400 group-hover:text-blue-100 text-[10px] font-bold uppercase mt-2 tracking-widest">Triagem rápida</p>
          </div>
          <ArrowUpRight className="absolute top-8 right-8 text-white/10 group-hover:text-white/20 transition-all" size={80} />
        </button>

        {/* Card 2: Atendidos Hoje */}
        <div 
          onClick={onAbrirHistorico}
          className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between h-48 cursor-pointer hover:border-blue-300 group transition-all"
        >
          <div className="flex justify-between items-start">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase italic">Hoje</span>
          </div>
          <div>
            <h3 className="text-5xl font-black text-slate-800 italic tracking-tighter">{metricas.atendidoshoje}</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Atendimentos Concluídos</p>
          </div>
        </div>

        {/* Card 3: Alunos */}
        <div 
          onClick={onAbrirCadastros}
          className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between h-48 cursor-pointer hover:border-blue-300 group transition-all"
        >
          <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-5xl font-black text-slate-800 italic tracking-tighter">{metricas.totalPacientes}</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Alunos na Unidade</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Registros Recentes */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h4 className="font-black text-slate-800 uppercase italic flex items-center gap-2">
              <Clock className="text-blue-600" size={20} /> Últimos Atendimentos
            </h4>
          </div>
          <div className="divide-y divide-slate-50">
            {ultimosAtendimentos.length > 0 ? ultimosAtendimentos.map(atend => (
              <div key={atend.id} className="p-6 hover:bg-slate-50/50 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 uppercase text-sm">{atend.nomePaciente}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[250px]">
                      {atend.relatoCurto || 'Atendimento de rotina'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black italic ${atend.encaminhadoHospital === 'sim' ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {atend.encaminhadoHospital === 'sim' ? 'ENCAMINHADO' : 'FINALIZADO'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                    {atend.horario}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                Nenhum atendimento realizado hoje.
              </div>
            )}
          </div>
        </div>

        {/* Card de Busca Unificada (Pasta Digital) */}
        <div className="bg-[#0A1629] p-8 rounded-[40px] shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-white font-black uppercase italic mb-2 flex items-center gap-2">
              <Search size={18} className="text-blue-500" /> Pasta Digital
            </h4>
            <p className="text-slate-400 text-xs mb-6 font-medium leading-relaxed">
              Acesse o histórico clínico completo de qualquer aluno ou funcionário.
            </p>
            
            <button 
              onClick={onAbrirPastaDigital}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic text-xs py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              Abrir Consulta <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Integridade do Sistema</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-white/70 text-[11px] font-medium">Sincronizado com Cloud</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeEnfermeiro;