import React, { useMemo } from 'react';
// Removido UserWarning que causava erro de exportação e erro 500
import { Users, History, AlertCircle, ArrowRight, AlertTriangle } from 'lucide-react';

const AbaRecidiva = ({ dados, darkMode }) => {
  // Padronização para exibição "Caio Giromba" (Primeiras letras em maiúsculo)
  const formatarRS = (str) => {
    if (!str || str === "n/i") return "n/i";
    return str.toString().toLowerCase().trim().split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const rankingAlunos = useMemo(() => {
    // Busca o ranking processado pelo Hook (esperado: [nome, quantidade])
    const lista = Array.isArray(dados?.estatisticas?.rankingAlunos) 
      ? dados.estatisticas.rankingAlunos 
      : [];
    
    return [...lista].sort((a, b) => b[1] - a[1]);
  }, [dados]);

  const estilos = {
    card: darkMode 
      ? "bg-[#0A1629] border-white/5 text-white" 
      : "bg-white border-slate-100 text-slate-900 shadow-xl shadow-slate-200/50",
    item: darkMode 
      ? "bg-white/5 border-white/5 hover:bg-white/10" 
      : "bg-slate-50 border-slate-100 hover:bg-white"
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-6 duration-700 space-y-8">
      
      {/* HEADER DE IMPACTO */}
      <div className={`p-10 rounded-[50px] border ${estilos.card}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-orange-500/10 text-orange-500 rounded-3xl">
              <History size={32} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-[4px] italic">análise de recidiva</h3>
              <p className="text-[10px] opacity-40 font-bold lowercase tracking-widest mt-1">
                alunos com maior frequência de atendimentos
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="px-6 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <span className="text-xl font-black italic text-orange-500 block leading-none">
                {rankingAlunos.filter(a => a[1] >= 3).length}
              </span>
              <span className="text-[8px] font-black uppercase opacity-60">alertas ativos</span>
            </div>
          </div>
        </div>

        {/* LISTAGEM DE ALUNOS FREQUENTES */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {rankingAlunos.length > 0 ? (
            rankingAlunos.slice(0, 10).map(([nome, qtd], idx) => (
              <div key={idx} className={`group p-6 rounded-[35px] border transition-all duration-300 hover:scale-[1.02] ${estilos.item}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-lg ${
                      qtd >= 5 ? 'bg-rose-500/20 text-rose-500' : 
                      qtd >= 3 ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {qtd}
                    </div>
                    <div>
                      <p className="text-[13px] font-black italic leading-none mb-1">
                        {formatarRS(nome)}
                      </p>
                      <p className="text-[8px] font-black uppercase opacity-30 tracking-tighter">
                        {qtd >= 5 ? 'requer intervenção' : qtd >= 3 ? 'monitoramento' : 'frequência estável'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>

                {/* BARRA DE INTENSIDADE */}
                <div className="mt-4 h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      qtd >= 5 ? 'bg-rose-500' : qtd >= 3 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min((qtd / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center opacity-20">
              <Users size={48} className="mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[5px]">sem dados de frequência</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER INFORMATIVO */}
      <div className={`p-8 rounded-[40px] border flex items-center gap-6 ${estilos.card} bg-gradient-to-r from-transparent via-transparent to-orange-500/5`}>
        <div className="p-4 bg-orange-500/20 rounded-2xl text-orange-500">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest italic">nota de auditoria</h4>
          <p className="text-[10px] opacity-50 font-bold lowercase leading-relaxed mt-1">
            recidiva superior a 3 atendimentos mensais deve ser comunicada à coordenação pedagógica para avaliação de fatores psicossomáticos ou crônicos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AbaRecidiva;