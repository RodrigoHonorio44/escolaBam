import React from 'react';

const AtendimentoEnfermagem = ({ onVoltar }) => {
  return (
    <div className="p-8 bg-white rounded-[40px] border border-slate-200 shadow-sm">
      <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter mb-4">Novo Atendimento</h2>
      <button onClick={onVoltar} className="text-xs font-bold text-blue-600 uppercase italic">← Voltar</button>
      <div className="mt-10 p-20 border-2 border-dashed border-slate-100 rounded-[30px] text-center text-slate-400 font-bold italic">
        Área de Triagem e Evolução Clínica
      </div>
    </div>
  );
};

export default AtendimentoEnfermagem;