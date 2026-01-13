import React from "react";
import { FiClock, FiAlertTriangle } from "react-icons/fi";

const Expirado = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl border border-amber-100">
        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <FiClock size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 uppercase italic">Licença Expirada</h1>
        <p className="text-slate-500 text-sm mt-4 font-medium">
          O prazo de validade da sua licença de uso chegou ao fim.
        </p>
        <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-2">
          Renove seu plano para continuar
        </p>
        
        <button 
          onClick={() => window.location.href = "/login"}
          className="mt-8 w-full bg-slate-900 text-white font-black py-4 rounded-2xl transition-all hover:bg-blue-600"
        >
          Voltar ao Login
        </button>
      </div>
    </div>
  );
};

export default Expirado;