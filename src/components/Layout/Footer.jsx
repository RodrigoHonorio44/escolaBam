const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-6 px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center md:text-left">
          &copy; {new Date().getFullYear()} RODHON SYSTEM - GESTÃO INTEGRADA HOSPITALAR
        </p>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-300 tracking-tighter">VERSÃO 1.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;