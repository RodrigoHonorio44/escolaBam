import React from 'react';
import { Activity, Thermometer, AlertTriangle, Clock, HeartPulse, TrendingUp } from 'lucide-react';

const AbaGeral = ({ dados, darkMode }) => {
  // Padronização para minúsculas conforme diretriz "caio giromba"
  const normalizar = (str) => str?.toString().toLowerCase().trim() || "";

  const rankingSeguro = Array.isArray(dados?.rankingQueixas) ? dados.rankingQueixas : [];
  const totalAtendimentos = dados?.atendimentos?.length || 0;

  const stats = [
    { label: "total atendimentos", value: totalAtendimentos, icon: <Activity />, color: "blue" },
    { label: "casos de febre", value: dados?.totalFebre || 0, icon: <Thermometer />, color: "orange" },
    { label: "alunos alérgicos", value: dados?.totalAlergicos || 0, icon: <AlertTriangle />, color: "rose" },
    { label: "tempo médio", value: `${dados?.tempoMedio || 0}m`, icon: <Clock />, color: "emerald" },
  ];

  const estilos = {
    card: darkMode 
      ? "bg-[#0A1629] border-white/5 text-white shadow-2xl shadow-black/20" 
      : "bg-white border-slate-100 text-slate-900 shadow-xl shadow-slate-200/50",
    bgIcon: (color) => {
      const colors = {
        blue: "text-blue-500 bg-blue-500/10 shadow-blue-500/5",
        orange: "text-orange-500 bg-orange-500/10 shadow-orange-500/5",
        rose: "text-rose-500 bg-rose-500/10 shadow-rose-500/5",
        emerald: "text-emerald-500 bg-emerald-500/10 shadow-emerald-500/5",
      };
      return colors[color] || colors.blue;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
      
      {/* Grid de Cards Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, idx) => (
          <div key={idx} className={`group p-8 rounded-[40px] border transition-all duration-300 hover:translate-y-[-8px] ${estilos.card}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${estilos.bgIcon(item.color)}`}>
              {React.cloneElement(item.icon, { size: 28 })}
            </div>
            <h2 className="text-5xl font-black italic leading-none mb-3 tracking-tighter transition-all group-hover:text-blue-600">
              {item.value}
            </h2>
            <p className="text-[10px] font-black lowercase tracking-[2px] opacity-40">
              {normalizar(item.label)}
            </p>
          </div>
        ))}
      </div>

      {/* Mapa de Sintomas (Epidemiologia) */}
      <div className={`p-10 rounded-[50px] border relative overflow-hidden ${estilos.card}`}>
        {/* Background Decorativo */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <TrendingUp size={120} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <h3 className="text-sm font-black uppercase tracking-[3px] flex items-center gap-4 italic">
              <span className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-600/20">
                <HeartPulse size={20} />
              </span>
              distribuição epidemiológica
            </h3>
            <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase italic ${
              darkMode ? 'bg-blue-500/5 border-blue-500/10 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
            }`}>
              amostra: {totalAtendimentos} atendimentos
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
            {rankingSeguro.length > 0 ? (
              rankingSeguro.slice(0, 10).map(([nome, qtd], idx) => {
                const porcentagem = totalAtendimentos > 0 ? (qtd / totalAtendimentos) * 100 : 0;
                
                return (
                  <div key={idx} className="group space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-blue-500 lowercase tracking-widest block opacity-60">
                          queixa identificada
                        </span>
                        <span className="text-sm font-black lowercase italic leading-none">
                          {normalizar(nome)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black italic text-blue-600 leading-none">{qtd}</span>
                        <span className="text-[10px] font-bold opacity-30 ml-2">({porcentagem.toFixed(1)}%)</span>
                      </div>
                    </div>
                    
                    {/* Barra de Progresso Customizada */}
                    <div className={`h-3 w-full rounded-full p-[2px] border ${
                      darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.2)] group-hover:brightness-110"
                        style={{ width: `${porcentagem}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-500/10 rounded-[40px]">
                <Activity className="text-slate-500/20 mb-4 animate-pulse" size={48} />
                <p className="text-[10px] font-black lowercase opacity-30 tracking-[4px]">
                  sincronizando dados da rede...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaGeral;