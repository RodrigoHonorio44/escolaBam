import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  History, 
  LogOut, 
  Stethoscope,
  Menu,
  X,
  Users,
  ShieldAlert
} from 'lucide-react';

// IMPORTAÇÃO DOS COMPONENTES
import HomeEnfermeiro from './HomeEnfermeiro';
import AtendimentoEnfermagem from './AtendimentoEnfermagem';
import CadastroPaciente from './CadastroPaciente';
import HistoricoAtendimentos from './HistoricoAtendimentos';

const DashboardEnfermeiro = ({ user, logout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarAberta, setSidebarAberta] = useState(true);

  // Função para navegar e fechar sidebar no mobile
  const navegarPara = (rota) => {
    navigate(rota);
    if (window.innerWidth < 768) setSidebarAberta(false);
  };

  // Formatação amigável do Role para exibição
  const formatRole = (role) => {
    const roles = {
      'enfermeiro': 'Enfermeiro(a)',
      'enfermeira': 'Enfermeiro(a)',
      'tecnico_enfermagem': 'Técnico(a) em Enfermagem',
      'tecnica_enfermagem': 'Técnico(a) em Enfermagem',
      'root': 'Administrador Root'
    };
    return roles[role?.toLowerCase()] || role?.toUpperCase();
  };

  // Determina qual componente mostrar baseado na URL atual
  const renderConteudo = () => {
    // Verificação de segurança: Se não houver escola vinculada (exceto para root)
    if (!user?.escolaId && user?.role !== 'root') {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-10">
          <ShieldAlert size={64} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-800">Acesso Restrito</h2>
          <p className="text-slate-500 max-w-md">Sua conta não possui uma unidade escolar vinculada. Entre em contato com o suporte.</p>
        </div>
      );
    }

    switch (location.pathname) {
      case '/atendimento':
        return <AtendimentoEnfermagem user={user} />;
      case '/cadastrar-paciente':
        return <CadastroPaciente user={user} />;
      case '/historico':
        return <HistoricoAtendimentos user={user} />;
      default:
        return <HomeEnfermeiro user={user} onIniciarAtendimento={() => navigate('/atendimento')} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* SIDEBAR LATERAL */}
      <aside className={`
        ${sidebarAberta ? 'w-72' : 'w-24'} 
        bg-slate-900 h-full p-6 flex flex-col transition-all duration-300 ease-in-out relative z-50
      `}>
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2 mb-12 overflow-hidden">
          <div className="bg-blue-600 p-2.5 rounded-2xl shrink-0 shadow-lg shadow-blue-900/20">
            <Stethoscope className="text-white" size={24} />
          </div>
          {sidebarAberta && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              <h1 className="text-white font-black text-xl italic tracking-tighter leading-none">
                RODHON<span className="text-blue-500">SYSTEM</span>
              </h1>
              <span className="text-[8px] text-blue-400 font-black uppercase tracking-[0.3em]">Medical Care</span>
            </div>
          )}
        </div>

        {/* MENU DE NAVEGAÇÃO */}
        <nav className="flex-1 space-y-2">
          <MenuBtn 
            ativo={location.pathname === '/'} 
            onClick={() => navegarPara('/')}
            icon={LayoutDashboard} 
            label="Dashboard" 
            expandida={sidebarAberta}
          />
          <MenuBtn 
            ativo={location.pathname === '/atendimento'} 
            onClick={() => navegarPara('/atendimento')}
            icon={Stethoscope} 
            label="Triagem / Atendimento" 
            expandida={sidebarAberta}
          />
          <MenuBtn 
            ativo={location.pathname === '/cadastrar-paciente'} 
            onClick={() => navegarPara('/cadastrar-paciente')}
            icon={UserPlus} 
            label="Cadastrar Aluno" 
            expandida={sidebarAberta}
          />
          <MenuBtn 
            ativo={location.pathname === '/historico'} 
            onClick={() => navegarPara('/historico')}
            icon={History} 
            label="Histórico de Ações" 
            expandida={sidebarAberta}
          />
        </nav>

        {/* PERFIL E LOGOUT */}
        <div className="pt-6 border-t border-slate-800/50">
          {sidebarAberta && (
            <div className="px-4 mb-6 animate-in fade-in duration-700">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">
                {formatRole(user?.role)}
              </p>
              <p className="text-white font-bold text-sm truncate">{user?.nome}</p>
              <p className="text-slate-500 text-[10px] font-medium truncate">{user?.email}</p>
            </div>
          )}
          
          <button 
            onClick={logout}
            className={`
              w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 
              hover:bg-red-500/10 transition-all uppercase text-[10px] font-black tracking-widest
              ${!sidebarAberta && 'justify-center'}
            `}
          >
            <LogOut size={20} />
            {sidebarAberta && <span>Encerrar Sessão</span>}
          </button>
        </div>

        {/* BOTÃO TOGGLE (SIDEBAR) */}
        <button 
          onClick={() => setSidebarAberta(!sidebarAberta)}
          className="absolute -right-3 top-20 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-4 border-[#F8FAFC] hover:bg-blue-500 transition-all hover:scale-110"
        >
          {sidebarAberta ? <X size={12} /> : <Menu size={12} />}
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative scroll-smooth">
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
          {renderConteudo()}
        </div>

        {/* FOOTER DISCRETO NO CONTEÚDO */}
        <footer className="max-w-7xl mx-auto mt-12 pb-6 flex justify-between items-center border-t border-slate-200 pt-6">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            {user?.escolaId || 'Unidade não identificada'}
          </p>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            © 2026 Rodhon System v2.0
          </p>
        </footer>
      </main>
    </div>
  );
};

// Componente Auxiliar de Botão do Menu
const MenuBtn = ({ ativo, onClick, icon: Icon, label, expandida }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative
      ${ativo 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
        : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'}
      ${!expandida && 'justify-center'}
    `}
  >
    <Icon size={22} className={`${ativo ? 'text-white' : 'group-hover:text-blue-400'} transition-colors`} />
    
    {expandida ? (
      <span className="uppercase text-[10px] font-black tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2">
        {label}
      </span>
    ) : (
      // Tooltip simples para quando a sidebar está fechada
      <div className="absolute left-20 bg-slate-800 text-white text-[10px] font-black px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity uppercase tracking-widest z-[60]">
        {label}
      </div>
    )}

    {ativo && expandida && (
      <div className="absolute right-4 w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse"></div>
    )}
  </button>
);

export default DashboardEnfermeiro;