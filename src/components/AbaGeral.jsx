import React from 'react';
import { Activity, Thermometer, AlertTriangle, Clock, HeartPulse } from 'lucide-react';

const AbaGeral = ({ dados, darkMode }) => {
  const stats = [
    { label: "Total Atendimentos", value: dados.atendimentos.length, icon: <Activity />, color: "blue" },
    { label: "Casos de Febre", value: dados.totalFebre, icon: <Thermometer />, color: "orange" },
    { label: "Alunos Alérgicos", value: dados.totalAlergicos, icon: <AlertTriangle />, color: "rose" },
    { label: "Tempo Médio", value: `${dados.tempoMedio}m`, icon: <Clock />, color: "emerald" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Grid de Cards Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, idx) => (
          <div key={idx} className={`p-8 rounded-[40px] border shadow-sm transition-all hover:scale-105 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100"}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 
              ${item.color === 'blue' ? 'text-blue-500 bg-blue-500/10' : ''}
              ${item.color === 'orange' ? 'text-orange-500 bg-orange-500/10' : ''}
              ${item.color === 'rose' ? 'text-rose-500 bg-rose-500/10' : ''}
              ${item.color === 'emerald' ? 'text-emerald-500 bg-emerald-500/10' : ''}
            `}>
              {React.cloneElement(item.icon, { size: 24 })}
            </div>
            <h2 className="text-4xl font-black italic leading-none mb-3">{item.value}</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Mapa de Sintomas (Progress Bars) */}
      <div className={`p-10 rounded-[45px] border ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-100'}`}>
        <h3 className="text-xs font-black uppercase mb-10 opacity-40 tracking-widest flex items-center gap-3 italic">
          <HeartPulse size={18} className="text-blue-600" /> Distribuição Epidemiológica de Queixas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {dados.rankingQueixas.slice(0, 8).map(([nome, qtd], idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex justify-between text-[11px] font-black uppercase italic">
                <span>{nome}</span>
                <span className="text-blue-600">{qtd} ocorrências</span>
              </div>
              <div className="h-3 w-full bg-slate-500/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                  style={{ width: `${(qtd / (dados.atendimentos.length || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AbaGeral;