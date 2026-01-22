import React from 'react';
import { Repeat, AlertCircle, CalendarDays } from 'lucide-react';

const AbaRecidiva = ({ dados, darkMode }) => {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <div className={`p-8 md:p-12 rounded-[50px] border ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-100'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest mb-1">
              <AlertCircle size={14}/> Monitoramento Crítico
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Ranking de <span className="text-rose-600">Reincidência</span></h2>
          </div>
          <div className="px-6 py-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
            <span className="text-[10px] font-black text-rose-600 uppercase italic">{dados.reincidentes.length} Alunos em observação</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dados.reincidentes.length > 0 ? (
            dados.reincidentes.map((aluno, idx) => (
              <div key={idx} className={`p-6 rounded-[35px] border transition-all hover:border-rose-500/30 group ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-rose-500 text-white rounded-2xl font-black text-xl italic shadow-lg shadow-rose-500/20">
                    {aluno.qtd}x
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest leading-none">Turma</p>
                    <p className="text-sm font-black italic">{aluno.turma || "N/I"}</p>
                  </div>
                </div>

                <h4 className="text-xs font-black uppercase italic mb-4 leading-tight group-hover:text-rose-500 transition-colors">
                  {aluno.nome}
                </h4>

                <div className="space-y-2">
                   <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">Histórico de Queixas:</p>
                   <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(aluno.queixas)).map((queixa, i) => (
                        <span key={i} className={`px-2 py-1 rounded-md text-[8px] font-bold border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                          {queixa}
                        </span>
                      ))}
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
               <CalendarDays size={48} className="mx-auto text-slate-500/20 mb-4" />
               <p className="text-[10px] font-black uppercase opacity-30 tracking-widest">Nenhuma reincidência detectada neste período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AbaRecidiva;