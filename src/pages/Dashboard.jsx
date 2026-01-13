import { useEffect, useState } from 'react';
import { db } from '../firebase/firebaseConfig'; // Nome padronizado
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // Importado para navegação
import { 
  Users, ShieldCheck, Activity, Calendar, 
  AlertCircle, ArrowRight, Loader2 
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, ativos: 0, bloqueados: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sincronização Master: Monitora todos exceto Root para estatísticas
    const q = query(collection(db, "usuarios"), where("role", "!=", "root"));
    
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => d.data());
      setStats({
        total: docs.length,
        // Filtra por 'ativa' ou 'ativo' para cobrir ambas as nomenclaturas do seu banco
        ativos: docs.filter(d => d.statusLicenca === 'ativa' || d.status === 'ativo').length,
        bloqueados: docs.filter(d => d.statusLicenca === 'bloqueada' || d.status === 'bloqueado').length
      });
      setLoading(false);
    }, (error) => {
      console.error("Erro Dashboard:", error);
    });
    
    return () => unsub();
  }, []);

  // Formata a data de validade do próprio Rodrigo (Root)
  const formatarValidade = (data) => {
    if (!data) return "INFINITO";
    const d = new Date(data);
    return d.getFullYear(); // Retorna apenas o ano para o layout
  };

  return (
    <div className="p-2 md:p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Cabeçalho Profissional */}
      <header className="mb-10">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">
          Olá, {user?.nome ? user.nome.split(' ')[0] : 'Rodrigo'}!
        </h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
          {user?.role === 'root' ? 'Master Access • Painel de Controle' : `Unidade: ${user?.escolaId || 'Sede'}`}
        </p>
      </header>

      {/* Grid de Status Superior */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Usuários</p>
          <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
            {loading ? <Loader2 className="animate-spin text-slate-200" size={24}/> : stats.total}
          </h3>
        </div>

        <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="bg-emerald-500 text-white w-10 h-10 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
            <ShieldCheck size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Licenças Ativas</p>
          <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{stats.ativos}</h3>
        </div>

        <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="bg-rose-500 text-white w-10 h-10 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-rose-100 group-hover:scale-110 transition-transform">
            <AlertCircle size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloqueados</p>
          <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{stats.bloqueados}</h3>
        </div>

        <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
            <Calendar size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Validade</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter mt-1">
            {formatarValidade(user?.dataExpiracao)}
          </h3>
        </div>
      </div>

      {/* Seção de Módulos Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card Gestão de Usuários */}
        <Link to="/usuarios" className="bg-[#0f172a] p-10 rounded-[45px] text-white flex flex-col justify-between min-h-[320px] shadow-2xl relative overflow-hidden group">
           <div className="z-10 bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
             <Activity size={24} className="text-blue-400"/>
           </div>
           <div className="z-10">
             <h3 className="text-3xl font-black italic mb-2 tracking-tighter">Gestão de Usuários</h3>
             <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[250px]">
               Revogar acessos, editar perfis e gerenciar colaboradores da rede Maricá.
             </p>
             <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-blue-400 group-hover:gap-4 transition-all">
                Abrir Administração <ArrowRight size={14}/>
             </div>
           </div>
           <Activity size={180} className="absolute -right-10 -bottom-10 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
        </Link>

        {/* Card Controle SaaS */}
        <Link to="/licencas" className="bg-white p-10 rounded-[45px] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[320px] group hover:border-blue-200 transition-all">
           <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
             <ShieldCheck size={24} className="text-blue-600"/>
           </div>
           <div>
             <h3 className="text-3xl font-black italic mb-2 tracking-tighter text-slate-800">Controle SaaS</h3>
             <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[250px]">
               Faturamento estimado e renovação imediata de licenças expiradas.
             </p>
             <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 group-hover:gap-4 transition-all">
                Acessar Licenças <ArrowRight size={14}/>
             </div>
           </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;