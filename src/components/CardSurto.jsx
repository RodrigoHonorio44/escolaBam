import React from 'react';
import { Users, Loader2 } from 'lucide-react';

const CardSurto = ({ grupo, dados, onSalvar, enviando, darkMode }) => (
  <form onSubmit={(e) => onSalvar(e, grupo)} className={`p-8 rounded-[40px] border-2 border-rose-500/20 shadow-2xl ${darkMode ? 'bg-[#0A1629]' : 'bg-white'}`}>
    <div className="flex justify-between items-start mb-6">
      <h4 className="text-3xl font-black uppercase italic text-rose-500">{grupo}</h4>
      <span className="text-2xl font-black bg-rose-500 text-white px-6 py-2 rounded-2xl">{dados.total} casos</span>
    </div>

    <div className="mb-6 p-5 rounded-3xl bg-slate-500/5 border border-dashed border-rose-500/20">
      <p className="text-[9px] font-black uppercase mb-3 opacity-40 flex items-center gap-2">
        <Users size={12} /> alunos detectados:
      </p>
      <div className="space-y-2">
        {dados.pacientes.map((p, idx) => (
          <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase italic">{p.nome}</span>
              <span className="text-[8px] opacity-40 uppercase italic">{p.sintoma}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-[9px] font-bold opacity-40 uppercase">{p.turma}</span>
              <span className="text-[9px] font-bold opacity-40">{p.data}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-4">
      <select name="medida" required className={`w-full p-4 rounded-2xl text-[10px] font-black uppercase border-none ${darkMode ? 'bg-white/5 text-white' : 'bg-slate-100'}`}>
        <option value="">selecione a medida técnica...</option>
        <option value="notificacao aos responsaveis">notificação aos responsáveis</option>
        <option value="isolamento de turma">isolamento de turma</option>
        <option value="reforco de higienizacao">reforço de higienização</option>
      </select>
      <textarea name="observacao" required placeholder="descreva a conduta técnica..." className={`w-full p-4 rounded-2xl text-[10px] font-bold border-none min-h-[100px] ${darkMode ? 'bg-white/5 text-white' : 'bg-slate-100'}`} />
      <button disabled={enviando} className="w-full bg-blue-600 text-white font-black uppercase italic py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
        {enviando ? <Loader2 className="animate-spin" /> : 'registrar tratativa'}
      </button>
    </div>
  </form>
);

export default CardSurto;