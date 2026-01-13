import React from 'react';
import { ClipboardList } from 'lucide-react';

const HistoricoAtendimentos = () => {
  return (
    <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg shadow-slate-200">
          <ClipboardList size={24} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Histórico Geral</h2>
      </div>
      
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[30px]">
        <p className="text-slate-400 font-bold italic">Lista de atendimentos em desenvolvimento...</p>
      </div>
    </div>
  );
};

export default HistoricoAtendimentos;