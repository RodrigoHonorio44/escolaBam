import React from 'react';
import { ShieldAlert, MessageCircle, LogOut } from 'lucide-react';

const TelaBloqueio = () => {
  const handleSuporte = () => {
    // Link direto para o seu WhatsApp ou e-mail de suporte
    window.open("https://wa.me/seu-numero-aqui", "_blank");
  };

  const handleSair = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 p-10 text-center animate-in zoom-in duration-300">
        
        {/* Ícone de Alerta */}
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShieldAlert className="text-red-500" size={48} />
        </div>

        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic mb-4">
          Acesso Suspenso
        </h1>
        
        <p className="text-slate-500 font-medium leading-relaxed mb-10">
          Sua licença de uso para a <span className="font-bold text-slate-700">E. M. Anísio Teixeira</span> expirou ou foi desativada pelo administrador.
        </p>

        <div className="space-y-4">
          <button 
            onClick={handleSuporte}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <MessageCircle size={18} /> Contatar Suporte
          </button>

          <button 
            onClick={handleSair}
            className="w-full flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 text-slate-600 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95"
          >
            <LogOut size={18} /> Sair do Sistema
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-50">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            ID de Sessão: {localStorage.getItem('currentSessionId') || 'Sessão Encerrada'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TelaBloqueio;