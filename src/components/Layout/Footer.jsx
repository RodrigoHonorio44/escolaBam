const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-100 py-6 px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* LADO ESQUERDO: COPYRIGHT & BRANDING */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            © {currentYear} <span className="text-blue-600">Rodhon</span> System
          </p>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter italic">
            Gestão Integrada Escolar • Maricá, RJ
          </p>
        </div>

        {/* LADO DIREITO: STATUS E VERSÃO */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          
          {/* INDICADOR DE STATUS (Visual apenas, para confiança do usuário) */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Sistemas Online
            </span>
          </div>

          {/* VERSÃO DO SOFTWARE */}
          <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">
              Build <span className="text-slate-600">v1.2.4</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;