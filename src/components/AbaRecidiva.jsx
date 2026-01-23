import React from 'react';
import { Repeat, AlertCircle, CalendarDays, History, TrendingUp } from 'lucide-react';

const AbaRecidiva = ({ dados, darkMode }) => {
  // Ordenar reincidentes pelo maior número de atendimentos
  const reincidentesOrdenados = [...(dados?.reincidentes || [])].sort((a, b) => b.qtd - a.qtd);

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
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Monitoramento de Recidiva
            </div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
              Fluxo de <span className="text-rose-600 underline decoration-rose-600/20">Reincidência</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[9px] font-black uppercase opacity-40 leading-none">Status do Período</p>
              <p className="text-xs font-black italic">Alerta de Frequência</p>
            </div>
            <div className="px-8 py-4 bg-rose-500 text-white rounded-[20px] shadow-lg shadow-rose-500/20 flex items-center gap-3">
              <TrendingUp size={20} />
              <span className="text-xs font-black uppercase italic">{reincidentesOrdenados.length} Casos Críticos</span>
            </div>
          </div>
        </div>

        {/* Grid de Alunos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reincidentesOrdenados.length > 0 ? (
            reincidentesOrdenados.map((aluno, idx) => {
              // Garante que queixas seja um array único e limpo
              const queixasUnicas = Array.from(new Set(aluno.queixas || [])).filter(q => q);
              const nivelCritico = aluno.qtd > 3 ? 'text-rose-600' : 'text-orange-500';

              return (
                <div key={idx} className={`relative overflow-hidden p-8 rounded-[40px] border transition-all duration-300 group ${estilos.card}`}>
                  {/* Badge de Quantidade */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="relative">
                      <div className={`text-5xl font-black italic tracking-tighter ${nivelCritico}`}>
                        {aluno.qtd}<span className="text-xl ml-1">x</span>
                      </div>
                      <div className="h-1.5 w-full bg-current opacity-10 rounded-full mt-1" />
                    </div>
                    
                    <div className="text-right">
                      <span className={estilos.label}>Turma</span>
                      <p className="text-sm font-black uppercase italic bg-black/5 px-3 py-1 rounded-lg">{aluno.turma || "N/I"}</p>
                    </div>
                  </div>

                  {/* Nome do Aluno */}
                  <div className="mb-6">
                    <span className={estilos.label}>Identificação</span>
                    <h4 className="text-[13px] font-black uppercase italic leading-tight group-hover:text-rose-600 transition-colors">
                      {aluno.nome}
                    </h4>
                  </div>

                  {/* Timeline de Queixas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <History size={12} className="text-rose-500" />
                      <span className={estilos.label}>Histórico Recente</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {queixasUnicas.length > 0 ? (
                        queixasUnicas.map((queixa, i) => (
                          <span key={i} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic border shadow-sm ${estilos.tag}`}>
                            {queixa}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] italic opacity-30">Nenhuma queixa detalhada</span>
                      )}
                    </div>
                  </div>

                  {/* Efeito Decorativo Group Hover */}
                  <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <Repeat size={120} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-500/5 rounded-[30px] flex items-center justify-center mb-6">
                <CalendarDays size={40} className="text-slate-500/20" />
              </div>
              <p className="text-[11px] font-black uppercase opacity-30 tracking-[4px]">
                Estabilidade Detectada: Sem Reincidência
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Nota de Rodapé da Auditoria */}
      <div className="mt-6 ml-10 flex items-center gap-3 opacity-30">
        <AlertCircle size={14} />
        <p className="text-[8px] font-black uppercase tracking-widest">
          O ranking considera apenas alunos com 2 ou mais atendimentos no intervalo selecionado.
        </p>
      </div>
    </div>
  );
};

export default AbaRecidiva;