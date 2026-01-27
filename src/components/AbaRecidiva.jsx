import React from 'react';
import { Repeat, AlertCircle, CalendarDays, History, TrendingUp } from 'lucide-react';

const AbaRecidiva = ({ dados, darkMode }) => {
  // Normalização padrão "caio giromba"
  const formatText = (val) => val?.toString().toLowerCase().trim() || "";

  // Ordenar reincidentes pelo maior volume de atendimentos
  const reincidentesOrdenados = [...(dados?.reincidentes || [])]
    .sort((a, b) => b.qtd - a.qtd);

  const estilos = {
    container: darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-100',
    card: darkMode 
      ? 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-rose-500/30' 
      : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/60',
    tag: darkMode 
      ? 'bg-black/20 border-white/10 text-slate-400' 
      : 'bg-white border-slate-200 text-slate-600 shadow-sm',
    label: "text-[9px] font-black uppercase tracking-[2px] opacity-40 mb-2 block"
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700">
      <div className={`p-8 md:p-12 rounded-[50px] border shadow-2xl shadow-black/5 ${estilos.container}`}>
        
        {/* HEADER DE MONITORAMENTO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-rose-500 font-black text-[10px] uppercase tracking-[4px] mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              análise de recidiva sistêmica
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">
              fluxo de <span className="text-rose-600 underline decoration-rose-600/10">reincidência</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:block text-right">
              <p className="text-[9px] font-black uppercase opacity-40 leading-none mb-1 text-rose-500">protocolo de risco</p>
              <p className="text-xs font-black italic lowercase opacity-70">frequência atípica detectada</p>
            </div>
            <div className="px-10 py-5 bg-rose-600 text-white rounded-[25px] shadow-xl shadow-rose-600/30 flex items-center gap-4 transition-all hover:scale-105 hover:rotate-1">
              <TrendingUp size={24} />
              <div className="flex flex-col">
                <span className="text-xl font-black leading-none">{reincidentesOrdenados.length}</span>
                <span className="text-[8px] font-black uppercase tracking-widest">casos críticos</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRID DE PACIENTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reincidentesOrdenados.length > 0 ? (
            reincidentesOrdenados.map((aluno, idx) => {
              // Normalização das queixas únicas (Set para evitar duplicatas)
              const queixasUnicas = Array.from(new Set(aluno.queixas || []))
                .map(q => formatText(q))
                .filter(q => q && q !== "null");
                
              const isCritico = aluno.qtd >= 3;

              return (
                <div key={idx} className={`relative overflow-hidden p-8 rounded-[45px] border transition-all duration-500 group ${estilos.card}`}>
                  
                  {/* MÉTRICA DE VOLUME */}
                  <div className="flex justify-between items-start mb-10">
                    <div className="relative">
                      <div className={`text-7xl font-black italic tracking-tighter leading-none ${isCritico ? 'text-rose-600' : 'text-orange-500'}`}>
                        {aluno.qtd}<span className="text-2xl ml-1">x</span>
                      </div>
                      <div className={`h-1.5 w-full rounded-full mt-2 ${isCritico ? 'bg-rose-600/20' : 'bg-orange-500/20'}`} />
                    </div>
                    
                    <div className="text-right">
                      <span className={estilos.label}>turma</span>
                      <p className="text-[10px] font-black lowercase italic bg-blue-500/10 text-blue-600 px-4 py-2 rounded-xl border border-blue-500/5 inline-block">
                        {formatText(aluno.turma) || "n/i"}
                      </p>
                    </div>
                  </div>

                  {/* IDENTIFICAÇÃO DO ALUNO */}
                  <div className="mb-8">
                    <span className={estilos.label}>identificação nominal</span>
                    <h4 className="text-lg font-black lowercase italic leading-tight group-hover:text-rose-600 transition-colors duration-300">
                      {formatText(aluno.nome)}
                    </h4>
                  </div>

                  {/* TIMELINE DE QUEIXAS */}
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-2 opacity-60">
                      <History size={14} className="text-rose-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest">histórico recorrente</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {queixasUnicas.length > 0 ? (
                        queixasUnicas.map((queixa, i) => (
                          <span key={i} className={`px-4 py-2 rounded-xl text-[9px] font-black lowercase italic border transition-all group-hover:scale-105 ${estilos.tag}`}>
                            {queixa}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-black lowercase opacity-20 italic">dados de sintoma omitidos</span>
                      )}
                    </div>
                  </div>

                  {/* BACKGROUND ICON (DECORATIVO) */}
                  <div className={`absolute -bottom-8 -right-8 opacity-[0.03] group-hover:opacity-[0.07] group-hover:rotate-12 transition-all duration-700 ${isCritico ? 'text-rose-600' : 'text-slate-500'}`}>
                    <Repeat size={160} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
              <div className="w-28 h-28 bg-slate-500/5 rounded-[50px] flex items-center justify-center mb-8 border-2 border-dashed border-slate-500/10">
                <CalendarDays size={48} className="text-slate-500/10" />
              </div>
              <p className="text-[12px] font-black lowercase italic opacity-20 tracking-[6px] max-w-md">
                estabilidade operacional detectada: sem recorrência no ciclo atual
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* DISCLAIMER DE AUDITORIA */}
      <div className="mt-8 flex items-center justify-center gap-3 opacity-20 hover:opacity-40 transition-opacity cursor-default">
        <AlertCircle size={14} />
        <p className="text-[9px] font-black lowercase italic tracking-[3px]">
          análise baseada em duplicidade de id/nome no intervalo de tempo ativo.
        </p>
      </div>
    </div>
  );
};

export default AbaRecidiva;