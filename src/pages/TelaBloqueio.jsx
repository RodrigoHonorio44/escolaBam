import React from 'react';
import { ShieldAlert, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Bloqueado = () => {
  const { handleLogout } = useAuth();

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl border border-red-50 text-center relative overflow-hidden">
        {/* Detalhe decorativo de fundo */}
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
        
        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-[32px] flex items-center justify-center mb-8 mx-auto shadow-lg shadow-red-100">
          <ShieldAlert size={48} />
        </div>

        <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">
          Acesso <span className="text-red-600">Suspenso</span>
        </h1>
        
        <p className="text-slate-500 font-medium leading-relaxed mb-10">
          Sua conta ou a licença desta unidade escolar foi bloqueada por um administrador. 
          Entre em contato com o suporte para regularizar seu acesso.
        </p>

        <div className="space-y-4">
          <a 
            href="https://wa.me/seunumeroaqui" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
          >
            <MessageCircle size={18} />
            Falar com Suporte
          </a>

          <button 
            onClick={handleLogout}
            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Voltar para Login
          </button>
        </div>

        <p className="mt-10 text-[9px] text-slate-300 font-black uppercase tracking-[0.3em]">
          RODHON SYSTEM • SEGURANÇA ATIVA
        </p>
      </div>
    </div>
  );
};

export default Bloqueado;