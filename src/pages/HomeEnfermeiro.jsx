import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig'; 
import { collection, query, where, onSnapshot, orderBy, getDocs, limit } from 'firebase/firestore';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  Search,
  ArrowUpRight,
  Calendar,
  Activity,
  ShieldCheck
} from 'lucide-react';

const HomeEnfermeiro = ({ onIniciarAtendimento, onAbrirHistorico, onAbrirCadastros, onAbrirPastaDigital, darkMode }) => {
  const [metricas, setMetricas] = useState({ atendidoshoje: 0, totalPacientes: 0 });
  const [ultimosAtendimentos, setUltimosAtendimentos] = useState([]);
  const [dadosUsuario, setDadosUsuario] = useState({ nome: "Carregando...", role: "...", escolaId: "Sede" });

  useEffect(() => {
    const buscarUsuario = async () => {
      try {
        const qUser = query(
          collection(db, "usuarios"), 
          where("nome", "==", "Maria conceiçao"),
          limit(1)
        );
        const querySnapshot = await getDocs(qUser);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setDadosUsuario({
            nome: docData.nome,
            role: docData.role,
            escolaId: docData.escolaId || "Sede"
          });
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    };

    buscarUsuario();

    const hoje = new Date().toISOString().split('T')[0];
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
      })).slice(0, 5));
    });

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
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* NOVO HEADER: GERENCIAMENTO DE SAÚDE ESCOLAR */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-dashed border-slate-700/20 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black tracking-[0.4em] text-blue-500 uppercase italic">
              Unidade de Gerenciamento de Saúde Escolar
            </span>
          </div>
          
          <h1 className={`text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none transition-colors duration-500 ${
            darkMode ? "text-white" : "text-[#0F172A]"
          }`}>
            Rodhon <span className="text-blue-600">MedSys</span>
          </h1>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <p className={`text-xl font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Olá, <span className="text-blue-600 font-black italic">{dadosUsuario.nome}</span>
            </p>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
              darkMode ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-500"
            }`}>
              <ShieldCheck size={12} className="text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest">{dadosUsuario.role}</span>
            </div>
          </div>
        </div>
        
        {/* Widget de Unidade e Data Estilizado */}
        <div className="flex items-center gap-4">
            <div className={`hidden lg:flex flex-col text-right pr-4 border-r ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Unidade Ativa</span>
                <span className={`text-sm font-bold italic ${darkMode ? "text-blue-400" : "text-blue-600"}`}>{dadosUsuario.escolaId}</span>
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-[24px] border transition-colors ${
                darkMode ? "bg-[#0A1629] border-white/5 shadow-none" : "bg-white border-slate-100 shadow-sm"
            }`}>
              <div className="bg-blue-500/10 text-blue-500 p-2 rounded-xl">
                <Calendar size={20} />
              </div>
              <div className="pr-2">
                <p className="text-[9px] font-black text-slate-500 uppercase leading-none mb-1 text-nowrap">Data da Operação</p>
                <p className={`text-xs font-black italic ${darkMode ? "text-white" : "text-slate-800"}`}>
                  {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
        </div>
      </div>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <button 
          onClick={onIniciarAtendimento}
          className="bg-[#0F172A] group hover:bg-blue-600 p-8 rounded-[40px] text-white transition-all shadow-xl flex flex-col justify-between h-52 relative overflow-hidden text-left"
        >
          <div className="bg-blue-600 group-hover:bg-white p-3 rounded-2xl w-fit transition-colors">
            <PlusCircle className="text-white group-hover:text-blue-600 transition-colors" size={28} />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black leading-none uppercase italic">Iniciar<br/>Atendimento</h3>
            <p className="text-slate-400 group-hover:text-blue-100 text-[10px] font-bold uppercase mt-2 tracking-widest">Triagem rápida e segura</p>
          </div>
          <ArrowUpRight className="absolute top-8 right-8 text-white/5 group-hover:text-white/20 transition-all" size={100} />
        </button>

        <div className={`p-8 rounded-[40px] border transition-all flex flex-col justify-between h-52 group ${
            darkMode ? "bg-[#0F1C2E] border-white/5" : "bg-white border-slate-200 shadow-sm shadow-slate-200/50"
        }`}>
          <div className="flex justify-between items-start">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase italic tracking-widest">Real-time</span>
          </div>
          <div>
            <h3 className={`text-6xl font-black italic tracking-tighter leading-none mb-2 ${darkMode ? "text-white" : "text-slate-800"}`}>{metricas.atendidoshoje}</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Atendimentos Hoje</p>
          </div>
        </div>

        <div className={`p-8 rounded-[40px] border transition-all flex flex-col justify-between h-52 group ${
            darkMode ? "bg-[#0F1C2E] border-white/5" : "bg-white border-slate-200 shadow-sm shadow-slate-200/50"
        }`}>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Users size={24} />
          </div>
          <div>
            <h3 className={`text-6xl font-black italic tracking-tighter leading-none mb-2 ${darkMode ? "text-white" : "text-slate-800"}`}>{metricas.totalPacientes}</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Alunos Monitorados</p>
          </div>
        </div>
      </div>

      {/* MONITORAMENTO INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <div className={`lg:col-span-2 rounded-[40px] border overflow-hidden transition-colors ${
            darkMode ? "bg-[#0F1C2E] border-white/5 shadow-none" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className={`p-8 border-b flex justify-between items-center ${darkMode ? "bg-white/5 border-white/5" : "bg-slate-50/30 border-slate-50"}`}>
            <h4 className={`font-black uppercase italic flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-800"}`}>
              <Clock className="text-blue-600" size={20} /> Histórico Operacional Recente
            </h4>
          </div>
          <div className={`divide-y ${darkMode ? "divide-white/5" : "divide-slate-100"}`}>
            {ultimosAtendimentos.length > 0 ? ultimosAtendimentos.map(atend => (
              <div key={atend.id} className={`p-6 transition-all flex items-center justify-between ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50/80"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className={`font-bold uppercase text-sm leading-none mb-1 ${darkMode ? "text-white" : "text-slate-800"}`}>{atend.nomePaciente}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate max-w-[200px]">
                      {atend.relatoCurto || 'Sem observações adicionais'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-black italic mb-1 ${atend.encaminhadoHospital === 'sim' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {atend.encaminhadoHospital === 'sim' ? 'ENCAMINHAMENTO' : 'CONCLUÍDO'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-black">{atend.horario}</p>
                </div>
              </div>
            )) : (
              <div className="p-16 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                Aguardando fluxos de atendimento.
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0A1629] p-8 rounded-[40px] shadow-2xl flex flex-col justify-between border border-white/5">
          <div>
            <h4 className="text-white font-black uppercase italic mb-2 flex items-center gap-2">
              <Search size={18} className="text-blue-500" /> Pasta Digital
            </h4>
            <p className="text-slate-400 text-xs mb-8 font-medium leading-relaxed">
              Consulte prontuários, alergias e histórico clínico unificado da unidade escolar.
            </p>
            
            <button 
              onClick={onAbrirPastaDigital}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic text-xs py-5 rounded-3xl transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 group"
            >
              Acessar Prontuários <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>

          <div className="mt-8 p-5 bg-white/5 border border-white/10 rounded-[24px]">
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 text-center">Protocolo de Sincronização</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              <p className="text-white/70 text-[11px] font-bold uppercase tracking-tighter text-nowrap">Cloud Database Verified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeEnfermeiro;