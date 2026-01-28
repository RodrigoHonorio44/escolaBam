import React from 'react';
import { Activity, Thermometer, AlertTriangle, Clock, HeartPulse, TrendingUp, Users } from 'lucide-react';

const AbaGeral = ({ dados, darkMode }) => {
  // Padronização estrita: tudo em lowercase para busca e consistência
  const normalizar = (str) => str?.toString().toLowerCase().trim() || "";

  const rankingSeguro = Array.isArray(dados?.estatisticas?.rankingQueixas) 
    ? dados.estatisticas.rankingQueixas 
    : [];
    
  const totalAtendimentos = dados?.estatisticas?.totalAtendimentos || 0;

  // Cálculos dinâmicos baseados nos novos grupos de saúde
  const totalAlergias = dados?.gruposSaude?.alergias?.length || 0;
  const totalCronicos = dados?.gruposSaude?.cronicos?.length || 0;
  const totalPCD = dados?.gruposSaude?.acessibilidade?.length || 0;
  const totalRestricoes = dados?.gruposSaude?.restricaoAlimentar?.length || 0;

  // Mapeamento de cards superiores atualizado
  const stats = [
    { 
      label: "total atendimentos", 
      value: totalAtendimentos, 
      icon: <Activity />, 
      color: "blue" 
    },
    { 
      label: "alertas críticos", 
      value: totalAlergias + totalRestricoes, 
      icon: <AlertTriangle />, 
      color: "orange" 
    },
    { 
      label: "doenças crônicas", 
      value: totalCronicos, 
      icon: <TrendingUp />, 
      color: "rose" 
    },
    { 
      label: "pcd / neurodiversos", 
      value: totalPCD, 
      icon: <HeartPulse />, 
      color: "emerald" 
    },
  ];

  const estilos = {
    card: darkMode 
      ? "bg-[#0A1629] border-white/5 text-white shadow-2xl shadow-black/40" 
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
      
      {/* GRID DE CARDS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, idx) => (
          <div key={idx} className={`group p-8 rounded-[40px] border transition-all duration-500 hover:translate-y-[-10px] ${estilos.card}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110 ${estilos.bgIcon(item.color)}`}>
              {React.cloneElement(item.icon, { size: 28 })}
            </div>
            <h2 className="text-5xl font-black italic leading-none mb-3 tracking-tighter group-hover:text-blue-500 transition-colors">
              {item.value}
            </h2>
            <p className="text-[10px] font-black lowercase tracking-[2px] opacity-40 group-hover:opacity-80 transition-opacity">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* MAPA DE SINTOMAS (EPIDEMIOLOGIA) */}
      <div className={`p-10 rounded-[50px] border relative overflow-hidden ${estilos.card}`}>
        <div className="absolute -top-6 -right-6 p-8 opacity-[0.03] pointer-events-none rotate-12">
          <TrendingUp size={240} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-[4px] flex items-center gap-4 italic">
                <span className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
                  <HeartPulse size={22} />
                </span>
                distribuição epidemiológica
              </h3>
              <p className="text-[10px] opacity-40 font-bold lowercase ml-14 tracking-widest">análise de queixas registradas no banco</p>
            </div>
            
            <div className={`px-6 py-3 rounded-2xl border text-[10px] font-black uppercase italic tracking-widest ${
              darkMode ? 'bg-blue-500/5 border-white/5 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
            }`}>
              amostra: {totalAtendimentos} registros
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
            {rankingSeguro.length > 0 ? (
              rankingSeguro.slice(0, 10).map(([nome, qtd], idx) => {
                const porcentagem = totalAtendimentos > 0 ? (qtd / totalAtendimentos) * 100 : 0;
                
                return (
                  <div key={idx} className="group space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-blue-500/60 lowercase tracking-[2px] block">
                          frequência de queixa
                        </span>
                        <span className="text-sm font-black lowercase italic leading-none group-hover:text-blue-500 transition-colors">
                          {normalizar(nome)}
                        </span>
                      </div>
                      <div className="text-right flex items-baseline gap-2">
                        <span className="text-xl font-black italic text-blue-600 leading-none">{qtd}</span>
                        <span className="text-[10px] font-bold opacity-30">({porcentagem.toFixed(1)}%)</span>
                      </div>
                    </div>
                    
                    <div className={`h-3 w-full rounded-full p-[2px] border transition-all ${
                      darkMode ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-200 shadow-inner'
                    }`}>
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-800 via-blue-500 to-indigo-400 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:brightness-125"
                        style={{ width: `${porcentagem}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-500/10 rounded-[50px]">
                <Activity className="text-blue-500/20 mb-6 animate-pulse" size={60} />
                <p className="text-[11px] font-black lowercase opacity-30 tracking-[6px] italic text-center">
                  aguardando sincronização de dados médicos...
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