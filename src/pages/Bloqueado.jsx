import React from "react";
import { FiLock, FiMessageCircle } from "react-icons/fi";

const Bloqueado = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl border border-red-100">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <FiLock size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 uppercase italic">Acesso Suspenso</h1>
        <p className="text-slate-500 text-sm mt-4 font-medium">
          Sua conta ou unidade escolar encontra-se bloqueada no sistema.
        </p>
        
        <a 
          href="https://wa.me/seunumeroaqui" 
          target="_blank" 
          className="mt-8 flex items-center justify-center gap-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-200"
        >
          <FiMessageCircle size={20} />
          Falar com Suporte
        </a>
      </div>
    </div>
  );
};

export default Bloqueado;