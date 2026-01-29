import React, { useMemo } from 'react';
import { Users, History, ArrowRight, AlertTriangle } from 'lucide-react';

const AbaRecidiva = ({ dados, darkMode }) => {
  // Padronização estrita: "Caio Giromba"
  const formatarRS = (str) => {
    if (!str || str === "n/i") return "n/i";
    return str.toString().toLowerCase().trim().split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  // 🔍 Extração segura dos dados vindos do hook
  const rankingAlunos = useMemo(() => {
    // O hook retorna os dados dentro de estatisticas.rankingAlunos
    const lista = Array.isArray(dados?.estatisticas?.rankingAlunos) 
      ? dados.estatisticas.rankingAlunos 
      : [];
    
    return lista;
  }, [dados]);

  const estilos = {
    card: darkMode 
      ? "bg-[#0A1629] border-white/5 text-white shadow-2xl" 
      : "bg-white border-slate-100 text-slate-900 shadow-xl shadow-slate-200/50",
    item: darkMode 
      ? "bg-white/5 border-white/5 hover:bg-white/10" 
      : "bg-slate-50 border-slate-200 hover:bg-white hover:shadow-lg"
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-6 duration-700 space-y-8">
      
      {/* HEADER DE IMPACTO */}
      <div className={`p-10 rounded-[50px] border relative overflow-hidden ${estilos.card}`}>
        {/* Efeito Decorativo */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
          <History size={200} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-orange-600 rounded-[25px] text-white shadow-xl shadow-orange-600/30">
              <History size={32} />
            </div>
            <div>
              <h3 className="text-sm font-[1000] uppercase tracking-[5px] italic">análise de recidiva</h3>
              <p className="text-[10px] opacity-40 font-bold lowercase tracking-widest mt-2 ml-1">
                rastreamento de frequência crítica por paciente
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="px-8 py-4 rounded-[25px] bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm text-center">
              <span className="text-3xl font-[1000] italic text-orange-500 block leading-none">
                {rankingAlunos.filter(a => a.quantidade >= 3).length}
              </span>
              <span className="text-[8px] font-black uppercase opacity-60 tracking-tighter">alertas ativos</span>
            </div>
          </div>
        </div>

        {/* LISTAGEM DE ALUNOS FREQUENTES */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          {rankingAlunos.length > 0 ? (
            rankingAlunos.slice(0, 10).map((aluno, idx) => (
              <div key={idx} className={`group p-8 rounded-[40px] border transition-all duration-500 hover:translate-x-2 ${estilos.item}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    {/* Badge de Quantidade */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-[1000] italic text-2xl shadow-lg transition-transform group-hover:scale-110 ${
                      aluno.quantidade >= 5 ? 'bg-rose-600 text-white shadow-rose-600/20' : 
                      aluno.quantidade >= 3 ? 'bg-orange-500 text-white shadow-orange-500/20' : 
                      'bg-blue-600 text-white shadow-blue-600/20'
                    }`}>
                      {aluno.quantidade}
                    </div>

                    <div>
                      <div className="flex flex-col mb-2">
                        <p className="text-lg font-[1000] italic leading-tight uppercase tracking-tighter">
                          {formatarRS(aluno.nome)}
                        </p>
                        <span className="text-[9px] w-fit px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-md font-black uppercase tracking-widest mt-1">
                          {aluno.turma || 'setor n/i'}
                        </span>
                      </div>
                      <p className={`text-[9px] font-[1000] uppercase tracking-widest ${
                        aluno.quantidade >= 5 ? 'text-rose-500' : 
                        aluno.quantidade >= 3 ? 'text-orange-500' : 'text-slate-400'
                      }`}>
                        {aluno.quantidade >= 5 ? '● intervenção imediata' : 
                         aluno.quantidade >= 3 ? '● monitoramento ativo' : '● fluxo normal'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                    <ArrowRight size={18} className="text-blue-600" />
                  </div>
                </div>

                {/* BARRA DE INTENSIDADE ESTILIZADA */}
                <div className="mt-6 h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden p-[2px]">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      aluno.quantidade >= 5 ? 'bg-gradient-to-r from-rose-700 to-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.4)]' : 
                      aluno.quantidade >= 3 ? 'bg-gradient-to-r from-orange-600 to-orange-300' : 
                      'bg-gradient-to-r from-blue-700 to-blue-400'
                    }`}
                    style={{ width: `${Math.min((aluno.quantidade / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-500/10 rounded-[60px]">
              <Users size={60} className="text-slate-500/10 mb-6" />
              <p className="text-[10px] font-black uppercase tracking-[8px] opacity-20 italic">aguardando banco de dados...</p>
            </div>
          )}
        </div>
      </div>

      {/* NOTA DE AUDITORIA */}
      <div className={`p-10 rounded-[45px] border flex flex-col md:flex-row items-center gap-8 ${estilos.card} bg-gradient-to-br from-transparent via-transparent to-orange-500/[0.03]`}>
        <div className="p-5 bg-orange-500/10 rounded-3xl text-orange-500 animate-pulse">
          <AlertTriangle size={32} />
        </div>
        <div className="text-center md:text-left">
          <h4 className="text-[12px] font-[1000] uppercase tracking-[4px] italic text-orange-500 mb-2">protocolo de recidiva</h4>
          <p className="text-[11px] opacity-60 font-bold lowercase leading-relaxed max-w-2xl">
            pacientes com frequência superior a **3 atendimentos** no período selecionado devem ser submetidos à revisão de prontuário para descartar patologias não diagnosticadas ou somatização.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AbaRecidiva;