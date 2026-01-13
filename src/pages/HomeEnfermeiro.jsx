import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  Search,
  ArrowUpRight,
  Calendar
} from 'lucide-react';

const HomeEnfermeiro = ({ user, onIniciarAtendimento }) => {
  const [metricas, setMetricas] = useState({ atendidoshoje: 0, totalPacientes: 0 });
  const [ultimosAtendimentos, setUltimosAtendimentos] = useState([]);

  useEffect(() => {
    if (!user?.escolaId) return;

    // 1. DATA DE HOJE (Formato YYYY-MM-DD para o Firebase)
    const hoje = new Date().toISOString().split('T')[0];
    
    // 2. QUERY: Atendimentos concluídos HOJE na unidade específica
    const qAtendimentos = query(
      collection(db, "atendimentos"),
      where("escolaId", "==", user.escolaId),
      where("dataAtendimento", "==", hoje), // Filtro de data adicionado
      orderBy("createdAt", "desc")
    );

    const unsubAtendimentos = onSnapshot(qAtendimentos, (snapshot) => {
      setMetricas(prev => ({ ...prev, atendidoshoje: snapshot.size }));
      setUltimosAtendimentos(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })).slice(0, 5));
    });

    // 3. QUERY: Total de Pacientes (Alunos) cadastrados nesta escola
    // Assumindo que sua coleção de alunos chama-se "pacientes" ou "alunos"
    const qPacientes = query(
      collection(db, "pacientes"), 
      where("escolaId", "==", user.escolaId)
    );

    const unsubPacientes = onSnapshot(qPacientes, (snapshot) => {
      setMetricas(prev => ({ ...prev, totalPacientes: snapshot.size }));
    });

    return () => {
      unsubAtendimentos();
      unsubPacientes();
    };
  }, [user.escolaId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER DE BOAS-VINDAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">
            Dashboard
          </h1>
          <p className="text-slate-500 font-medium">
            Unidade: <span className="text-blue-600 font-bold">{user?.escolaId || 'Não Vinculada'}</span>
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
        
        {/* Card 1: Botão de Ação Principal */}
        <button 
          onClick={onIniciarAtendimento}
          className="bg-slate-900 group hover:bg-blue-600 p-8 rounded-[40px] text-white transition-all shadow-xl shadow-slate-200 flex flex-col justify-between h-48 relative overflow-hidden text-left"
        >
          <PlusCircle className="text-blue-400 group-hover:text-white transition-colors" size={40} />
          <div className="relative z-10">
            <h3 className="text-2xl font-black leading-none uppercase italic">Iniciar<br/>Atendimento</h3>
            <p className="text-slate-400 group-hover:text-blue-100 text-[10px] font-bold uppercase mt-2 tracking-widest">Triagem rápida</p>
          </div>
          <ArrowUpRight className="absolute top-8 right-8 text-white/10 group-hover:text-white/20 transition-all" size={80} />
        </button>

        {/* Card 2: Atendidos Hoje */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase italic">Hoje</span>
          </div>
          <div>
            <h3 className="text-5xl font-black text-slate-800 italic">{metricas.atendidoshoje}</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Atendimentos Concluídos</p>
          </div>
        </div>

        {/* Card 3: Pacientes Cadastrados (Dinâmico) */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between h-48">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl w-fit">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-5xl font-black text-slate-800 italic">{metricas.totalPacientes}</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Alunos na Unidade</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tabela de Recentes */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h4 className="font-black text-slate-800 uppercase italic flex items-center gap-2">
              <Clock className="text-blue-600" size={20} /> Últimos Registros
            </h4>
          </div>
          
          <div className="divide-y divide-slate-50">
            {ultimosAtendimentos.length > 0 ? ultimosAtendimentos.map(atend => (
              <div key={atend.id} className="p-6 hover:bg-slate-50/50 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-500 text-xs">
                    {atend.pacienteNome?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 uppercase text-sm">{atend.pacienteNome}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">
                      {atend.queixaPrincipal || 'Sem queixa registrada'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black italic ${atend.classificacao === 'Urgente' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {atend.statusAtendimento || 'Finalizado'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                    {atend.horaAtendimento || 'Agora'}
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

        {/* Busca Rápida de Prontuário */}
        <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl shadow-blue-900/10 flex flex-col justify-between">
          <div>
            <h4 className="text-white font-black uppercase italic mb-2">Busca de Prontuário</h4>
            <p className="text-slate-400 text-xs mb-6 font-medium leading-relaxed">Localize o histórico clínico pelo nome ou CPF.</p>
            
            <div className="relative">
              <Search className="absolute left-4 top-4 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="BUSCAR PACIENTE..."
                className="w-full bg-slate-800 border-none rounded-2xl p-4 pl-12 text-white font-bold text-xs focus:ring-2 focus:ring-blue-600 transition-all outline-none placeholder:text-slate-600"
              />
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Status do Servidor</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-white/70 text-[11px]">Banco de dados sincronizado</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeEnfermeiro;