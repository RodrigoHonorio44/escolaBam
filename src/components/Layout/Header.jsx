import { useAuth } from '../../context/AuthContext';
import { LogOut, Building2, ShieldCheck, UserCircle } from 'lucide-react';

const Header = () => {
  const { user, handleLogout } = useAuth();

  // Formata o cargo para exibição (ex: admin_saas -> ADMIN SAAS)
  const formatRole = (role) => role?.replace(/_/g, ' ').toUpperCase() || 'ACESSO RESTRITO';

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
      
      {/* LADO ESQUERDO: NOME DO SISTEMA / HOSPITAL */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl hidden sm:flex items-center justify-center shadow-lg shadow-blue-200">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-none">
            RODHON <span className="text-blue-600">SYSTEM</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            {user?.escolaId || 'Hosp. Conde Modesto Leal'}
          </p>
        </div>
      </div>

      {/* LADO DIREITO: PERFIL E LOGOUT */}
      <div className="flex items-center gap-4">
        
        {/* INFO DO USUÁRIO (Oculta em telas muito pequenas) */}
        <div className="hidden md:flex flex-col text-right pr-4 border-r border-slate-200">
          <span className="text-sm font-black text-slate-800 leading-tight uppercase tracking-tighter">
            {user?.nome || 'Usuário Rodhon'}
          </span>
          
          <div className="flex gap-2 items-center justify-end mt-1">
            {/* Badge de Cargo */}
            <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider
              ${user?.role === 'root' 
                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                : 'bg-blue-50 text-blue-700'}`}
            >
              {user?.role === 'root' ? (
                <span className="flex items-center gap-1"><ShieldCheck size={10}/> Master Root</span>
              ) : formatRole(user?.role)}
            </span>

            {/* Unidade/Escola */}
            {user?.escolaId && (
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black uppercase tracking-tight">
                {user.escolaId}
              </span>
            )}
          </div>
        </div>

        {/* BOTÃO SAIR COM FEEDBACK VISUAL */}
        <button 
          onClick={handleLogout}
          className="group flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-rose-500 text-slate-400 hover:text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-rose-200 active:scale-90"
          title="Encerrar Sessão"
        >
          <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest pl-1">Sair</span>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;