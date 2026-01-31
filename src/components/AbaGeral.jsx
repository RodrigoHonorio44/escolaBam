import React from 'react';
import { Activity, AlertTriangle, HeartPulse, TrendingUp, Brain } from 'lucide-react';

const AbaGeral = ({ dados, darkMode }) => {
  // Padronização estrita: tudo em lowercase para consistência r s
  const normalizar = (str) => str?.toString().toLowerCase().trim() || "";

  // Extração segura de dados
  const totalAtendimentos = dados?.estatisticas?.totalAtendimentos || 0;
  const rankingSeguro = Array.isArray(dados?.estatisticas?.rankingQueixas) 
    ? dados.estatisticas.rankingQueixas 
    : [];

  // Cálculos para os cards
  const totalAlergias = dados?.gruposSaude?.alergias?.length || 0;
  const totalRestricoes = dados?.gruposSaude?.restricaoAlimentar?.length || 0;
  const totalCronicos = dados?.gruposSaude?.cronicos?.length || 0;
  const totalPCD = dados?.gruposSaude?.acessibilidade?.length || 0;
  const totalNeuro = dados?.gruposSaude?.neurodiversidade?.length || 0;

  const stats = [
    { label: "total atendimentos", value: totalAtendimentos, icon: <Activity />, color: "blue" },
    { label: "alertas críticos", value: totalAlergias + totalRestricoes, icon: <AlertTriangle />, color: "orange" },
    { label: "doenças crônicas", value: totalCronicos, icon: <TrendingUp />, color: "rose" },
    { label: "pcd / neurodiversos", value: totalPCD + totalNeuro, icon: <Brain />, color: "emerald" },
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
      
      {/* GRID DE IMPACTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, idx) => (
          <div key={idx} className={`group p-8 rounded-[40px] border transition-all duration-500 hover:translate-y-[-10px] ${estilos.card}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110 ${estilos.bgIcon(item.color)}`}>
              {React.cloneElement(item.icon, { size: 28 })}
            </div>
            <h2 className="text-6xl font-[1000] italic leading-none mb-3 tracking-tighter group-hover:text-blue-600 transition-colors">
              {item.value}
            </h2>
            <p className="text-[10px] font-black lowercase tracking-[2.5px] opacity-40 group-hover:opacity-100 transition-opacity">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* PAINEL EPIDEMIOLÓGICO */}
      <div className={`p-10 rounded-[50px] border relative overflow-hidden ${estilos.card}`}>
        <div className="absolute -top-12 -right-12 p-8 opacity-[0.02] pointer-events-none rotate-12 scale-150">
          <Activity size={300} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-[5px] flex items-center gap-4 italic">
                <span className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/40">
                  <HeartPulse size={24} />
                </span>
                perfil epidemiológico
              </h3>
              <p className="text-[10px] opacity-40 font-bold lowercase ml-[68px] tracking-[2px]">
                distribuição de queixas clínicas normalizadas (r s)
              </p>
            </div>
            <div className={`px-8 py-4 rounded-2xl border text-[11px] font-black uppercase italic tracking-widest shadow-sm ${
              darkMode ? 'bg-blue-500/5 border-white/10 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
            }`}>
              amostragem: {totalAtendimentos} eventos
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-12">
            {rankingSeguro.length > 0 ? (
              rankingSeguro.map((queixa, idx) => {
                const porcentagem = totalAtendimentos > 0 ? (queixa.value / totalAtendimentos) * 100 : 0;
                return (
                  <div key={idx} className="group space-y-5">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-blue-500/50 lowercase tracking-[3px] block">frequência identificada</span>
                        <span className="text-lg font-black lowercase italic leading-none group-hover:text-blue-500 transition-colors tracking-tight">
                          {normalizar(queixa.label)}
                        </span>
                      </div>
                      <div className="text-right flex items-baseline gap-3">
                        <span className="text-3xl font-[1000] italic text-blue-600 leading-none">{queixa.value}</span>
                        <span className="text-[11px] font-black opacity-20">[{porcentagem.toFixed(1)}%]</span>
                      </div>
                    </div>
                    <div className={`h-4 w-full rounded-full p-[3px] border transition-all duration-500 ${
                      darkMode ? 'bg-black/40 border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]' : 'bg-slate-100 border-slate-200 shadow-inner'
                    }`}>
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        style={{ width: `${porcentagem}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-500/10 rounded-[60px] bg-slate-500/5">
                <Activity className="text-blue-500/10 mb-8 animate-pulse" size={80} />
                <p className="text-[12px] font-black lowercase opacity-30 tracking-[8px] italic text-center max-w-sm leading-relaxed">
                  aguardando processamento de dados médicos...
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