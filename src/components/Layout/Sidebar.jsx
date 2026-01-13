import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  KeyRound, 
  UserPlus, 
  GraduationCap, 
  ShieldCheck, 
  LogOut,
  Building2 
} from 'lucide-react';

const Sidebar = () => {
  const { user, handleLogout } = useAuth();
  const location = useLocation();

  // Definição Centralizada de Permissões
  const menuItems = [
    { 
      title: "Dashboard", 
      path: "/", 
      icon: <LayoutDashboard size={20} />, 
      roles: ['root', 'admin_saas', 'diretoria', 'enfermeiro', 'gestao'] 
    },
    { 
      title: "Cadastrar Acesso", 
      path: "/cadastrar-usuario", 
      icon: <UserPlus size={20} />, 
      roles: ['root', 'admin_saas', 'diretoria'] 
    },
    { 
      title: "Gestão de Usuários", 
      path: "/usuarios", 
      icon: <Users size={20} />, 
      roles: ['root', 'admin_saas', 'diretoria'] 
    },
    { 
      title: "Controle de Licenças", 
      path: "/licencas", 
      icon: <KeyRound size={20} />, 
      roles: ['root', 'admin_saas'] 
    },
    { 
      title: "Escolas / Unidades", 
      path: "/admin/unidades", 
      icon: <Building2 size={20} />, 
      roles: ['root', 'admin_saas'] 
    },
    { 
      title: "Painel Master", 
      path: "/admin/config", 
      icon: <ShieldCheck size={20} />, 
      roles: ['root', 'admin_saas'] 
    },
  ];

  // Filtro de Segurança: Se não houver usuário, não renderiza itens
  const filteredMenu = user?.role 
    ? menuItems.filter(item => item.roles.includes(user.role))
    : [];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 z-50 shadow-2xl border-r border-white/5">
      
      {/* AREA DA LOGO - BRANDING MARICÁ SaaS */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/40">
          <GraduationCap className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tighter leading-none">RODHON</h1>
          <p className="text-[10px] font-black text-blue-400 tracking-widest uppercase mt-1 italic opacity-80">SaaS Control</p>
        </div>
      </div>

      {/* NAVEGAÇÃO PRINCIPAL */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {filteredMenu.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                active 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50 font-bold" 
                  : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={`${active ? "text-white" : "text-slate-500 group-hover:text-blue-400 transition-colors"}`}>
                {item.icon}
              </span>
              <span className="text-sm tracking-tight">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER - PERFIL DO USUÁRIO ATUAL */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg border border-white/10
            ${user?.role === 'root' ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}
          >
            {user?.role === 'root' ? <ShieldCheck size={20} /> : (user?.nome?.charAt(0).toUpperCase() || 'U')}
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-white truncate uppercase tracking-tighter leading-tight">
              {user?.nome || 'Rodrigo Honorio'}
            </p>
            <p className={`text-[9px] font-black uppercase tracking-widest italic
              ${user?.role === 'root' ? 'text-amber-400' : 'text-blue-400'}`}>
              {user?.role === 'root' ? 'Master Root' : (user?.role || 'Acesso Restrito')}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-rose-500/5 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-[0.15em] border border-rose-500/10 hover:border-rose-600 shadow-sm"
        >
          <LogOut size={14} />
          Encerrar Sessão
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;