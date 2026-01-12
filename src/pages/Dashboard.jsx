import { useEffect, useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Users, ShieldCheck, Activity, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLicences: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = querySnapshot.docs.map(doc => doc.data());
        
        setStats({
          totalUsers: users.length,
          activeLicences: users.filter(u => u.licencaStatus === 'ativo').length
        });
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header de Boas-vindas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Olá, <span className="text-blue-600">{user?.nome?.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-slate-500 font-medium text-sm">Bem-vindo ao painel de controle do {user?.escolaId}.</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
          <Activity size={16} className="animate-pulse" /> Sistema Online
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Total de Usuários</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.totalUsers}</h3>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck size={24} />
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Licenças Ativas</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.activeLicences}</h3>
        </div>

        {/* Card 3 - Data de Expiração do próprio usuário */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-600">
          <div className="bg-slate-50 text-slate-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <Calendar size={24} />
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Sua Licença até</p>
          <h3 className="text-xl font-black text-slate-800 mt-1">
            {user?.dataExpiracao ? new Date(user.dataExpiracao).toLocaleDateString() : 'Ilimitado'}
          </h3>
        </div>
      </div>

      {/* Espaço para Gráficos Futuros */}
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-64 flex items-center justify-center">
        <p className="text-slate-400 font-bold italic">Espaço reservado para o Gráfico de Acessos Mensais</p>
      </div>
    </div>
  );
};

export default Dashboard;