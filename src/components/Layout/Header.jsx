import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, handleLogout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg hidden sm:block">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-none">RODHON <span className="text-blue-600">SYSTEM</span></h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Hosp. Conde Modesto Leal</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col text-right pr-4 border-r border-slate-200">
          <span className="text-sm font-bold text-slate-800 leading-tight">{user?.nome}</span>
          <div className="flex gap-2 items-center justify-end mt-1">
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-tight">
              {user?.role?.replace('_', ' ')}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase">
              {user?.escolaId}
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="p-2.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-xl transition-all duration-200"
          title="Sair"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;