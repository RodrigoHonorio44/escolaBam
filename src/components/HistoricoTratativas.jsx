import React from 'react';
import { History } from 'lucide-react';

const HistoricoTratativas = ({ lista, theme }) => (
  <div className="space-y-6">
    <h3 className="text-xs font-black uppercase opacity-50 flex items-center gap-2">
      <History size={16} /> histórico de ações
    </h3>
    <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
      {lista.map((t, i) => (
        <div key={i} className={`p-6 rounded-[30px] border shadow-sm ${theme.card}`}>
          <div className="flex justify-between items-start mb-3">
             <span className="px-3 py-1 bg-blue-600/10 text-blue-500 text-[9px] font-black rounded-full uppercase">
               {t.grupo}
             </span>
             <span className="text-[8px] opacity-40 font-black">
               {t.createdAt?.seconds 
                 ? new Date(t.createdAt.seconds * 1000).toLocaleString('pt-BR') 
                 : 'agora'}
             </span>
          </div>
          <h5 className="text-[11px] font-black uppercase mb-1">{t.medida}</h5>
          <p className="text-[10px] opacity-70 italic leading-relaxed mb-4">"{t.observacao}"</p>
          <p className="text-[8px] font-black opacity-30 uppercase">auditado por: {t.usuarioNome}</p>
        </div>
      ))}
    </div>
  </div>
);

export default HistoricoTratativas;