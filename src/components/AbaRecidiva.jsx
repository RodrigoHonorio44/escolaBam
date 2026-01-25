import React from 'react';
import { Repeat, AlertCircle, CalendarDays, History, TrendingUp } from 'lucide-react';

const AbaRecidiva = ({ dados, darkMode }) => {
  // Ordenar reincidentes pelo maior número de atendimentos
  const reincidentesOrdenados = [...(dados?.reincidentes || [])].sort((a, b) => b.qtd - a.qtd);

  // Função de normalização padrão "caio giromba"
  const formatText = (val) => val?.toString().toLowerCase().trim() || "";

  const estilos = {
    container: darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-100',
    card: darkMode ? 'bg-white/5 border-white/5 hover:bg-white/[0.08]' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50',
    tag: darkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600',
    label: "text-[9px] font-black uppercase tracking-[2px] opacity-40 mb-2 block"
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700">
      <div className={`p-8 md:p-12 rounded-[50px] border shadow-2xl shadow-black/5 ${estilos.container}`}>
        
        {/* Header da Aba */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-[3px] mb-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
              monitoramento de recidiva
            </div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
              fluxo de <span className="text-rose-600 underline decoration-rose-600/20">reincidência</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[9px] font-black uppercase opacity-40 leading-none mb-1">status do período</p>
              <p className="text-xs font-black italic lowercase">alerta de frequência alta</p>
            </div>
            <div className="px-8 py-4 bg-rose-600 text-white rounded-[22px] shadow-lg shadow-rose-600/30 flex items-center gap-3 transition-transform hover:scale-105">
              <TrendingUp size={20} />
              <span className="text-xs font-black uppercase italic">{reincidentesOrdenados.length} casos críticos</span>
            </div>
          </div>
        </div>

        {/* Grid de Alunos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reincidentesOrdenados.length > 0 ? (
            reincidentesOrdenados.map((aluno, idx) => {
              // Limpeza e normalização das queixas únicas
              const queixasUnicas = Array.from(new Set(aluno.queixas || []))
                .map(q => formatText(q))
                .filter(q => q && q !== "null");
                
              const nivelCritico = aluno.qtd > 3 ? 'text-rose-600' : 'text-orange-500';

              return (
                <div key={idx} className={`relative overflow-hidden p-8 rounded-[40px] border transition-all duration-300 group ${estilos.card}`}>
                  
                  {/* Badge de Quantidade - Visual Impactante */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="relative">
                      <div className={`text-6xl font-black italic tracking-tighter ${nivelCritico}`}>
                        {aluno.qtd}<span className="text-xl ml-1">x</span>
                      </div>
                      <div className="h-2 w-full bg-current opacity-10 rounded-full mt-1" />
                    </div>
                    
                    <div className="text-right">
                      <span className={estilos.label}>turma</span>
                      <p className="text-xs font-black lowercase italic bg-blue-500/10 text-blue-600 px-4 py-1.5 rounded-xl border border-blue-500/10">
                        {formatText(aluno.turma) || "n/i"}
                      </p>
                    </div>
                  </div>

                  {/* Identificação */}
                  <div className="mb-6">
                    <span className={estilos.label}>identificação do aluno</span>
                    <h4 className="text-[15px] font-black lowercase italic leading-tight group-hover:text-rose-600 transition-colors">
                      {formatText(aluno.nome)}
                    </h4>
                  </div>

                  {/* Histórico de Queixas */}
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <History size={14} className="text-rose-500" />
                      <span className={estilos.label}>histórico de queixas</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {queixasUnicas.length > 0 ? (
                        queixasUnicas.map((queixa, i) => (
                          <span key={i} className={`px-3 py-2 rounded-xl text-[9px] font-black lowercase italic border transition-all group-hover:border-rose-500/30 ${estilos.tag}`}>
                            {queixa}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-black lowercase opacity-20 italic">nenhuma queixa detalhada</span>
                      )}
                    </div>
                  </div>

                  {/* Marca d'água de fundo */}
                  <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-500">
                    <Repeat size={140} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-500/5 rounded-[40px] flex items-center justify-center mb-6 border border-dashed border-slate-500/20">
                <CalendarDays size={40} className="text-slate-500/20" />
              </div>
              <p className="text-[11px] font-black lowercase italic opacity-30 tracking-[4px]">
                estabilidade detectada: sem registros de reincidência
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Disclaimer */}
      <div className="mt-6 flex items-center justify-center gap-3 opacity-30">
        <AlertCircle size={14} />
        <p className="text-[9px] font-black lowercase italic tracking-[2px]">
          este ranking considera apenas alunos com 2 ou mais atendimentos registrados no período.
        </p>
      </div>
    </div>
  );
};

export default AbaRecidiva;