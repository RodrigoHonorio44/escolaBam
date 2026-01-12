import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users,           // Gestão de Funcionários
  KeyRound,        // Gestão de Licenças
  UserPlus,        // Cadastro de Usuários
  GraduationCap,   // Ícone Escolar
  ShieldCheck,     // Admin Master
  Settings, 
  LogOut,
  Building2        // Unidades/Escolas
} from 'lucide-react';

const Sidebar = () => {
  const { user, handleLogout } = useAuth();
  const location = useLocation();

  // Definição dos links focados em Gestão Escolar e SaaS
  const menuItems = [
    { 
      title: "Dashboard", 
      path: "/", 
      icon: <LayoutDashboard size={20} />, 
      roles: ['admin_saas', 'diretoria', 'enfermeiro', 'gestao'] 
    },
    { 
      title: "Cadastrar Acesso", 
      path: "/cadastrar-usuario", 
      icon: <UserPlus size={20} />, 
      roles: ['admin_saas', 'diretoria'] 
    },
    { 
      title: "Gestão de Usuários", 
      path: "/usuarios", 
      icon: <Users size={20} />, 
      roles: ['admin_saas', 'diretoria'] 
    },
    { 
      title: "Controle de Licenças", 
      path: "/licencas", 
      icon: <KeyRound size={20} />, 
      roles: ['admin_saas'] 
    },
    { 
      title: "Escolas / Unidades", 
      path: "/admin/unidades", 
      icon: <Building2 size={20} />, 
      roles: ['admin_saas'] 
    },
    { 
      title: "Painel Master", 
      path: "/admin/config", 
      icon: <ShieldCheck size={20} />, 
      roles: ['admin_saas'] 
    },
  ];

  // Filtra o menu baseado na role do usuário logado
  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 z-50 shadow-2xl">
      {/* Logo Area - Identidade Rodhon System Escolar */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
          <GraduationCap className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tighter leading-none">RODHON</h1>
          <p className="text-[10px] font-bold text-blue-400 tracking-widest uppercase mt-1">SaaS Control</p>
        </div>
      </div>

      {/* Menu Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive(item.path) 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50 font-semibold" 
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className={`${isActive(item.path) ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`}>
              {item.icon}
            </span>
            <span className="text-sm">{item.title}</span>
          </Link>
        ))}
      </nav>

      {/* Rodapé da Sidebar - Info do Usuário Master */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-inner">
            {user?.role === 'admin_saas' ? <ShieldCheck size={18} /> : user?.nome?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user?.nome}</p>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter italic">
              {user?.role === 'admin_saas' ? 'Master Control' : user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200 font-bold text-xs uppercase tracking-widest"
        >
          <LogOut size={16} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;