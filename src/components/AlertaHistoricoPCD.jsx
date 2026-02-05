import React, { useState } from 'react';
// Importação corrigida: Wheelchair não existe, usamos Accessibility e Brain
import { History, AlertTriangle, Accessibility, ChevronRight, Brain, Info } from 'lucide-react';

const AlertaHistoricoPCD = ({ formData, temCadastro, onVerHistorico }) => {
  const [expandido, setExpandido] = useState(false);

  if (!temCadastro || !formData?.nomePaciente) return null;

  const condicoes = formData.condicoesEspeciais || [];
  const ehAtipico = condicoes.length > 0;

  const getConfigAtipico = () => {
    const texto = condicoes.join(' ').toLowerCase();
    
    // Prioridade 1: Mobilidade / Física -> AZUL
    if (texto.includes('cadeira') || texto.includes('física') || texto.includes('mobilidade')) {
      return {
        cor: 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]',
        icone: <Accessibility size={16} className="animate-bounce" />, // Accessibility para físico
        label: 'aluno atípico'
      };
    }
    // Prioridade 2: Intelectual / Neuro -> ROXO
    if (texto.includes('intelectual') || texto.includes('tdah') || texto.includes('tea') || texto.includes('autismo')) {
      return {
        cor: 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.4)]',
        icone: <Brain size={16} className="animate-bounce" />,
        label: 'aluno atípico'
      };
    }
    // Padrão: Outros -> VERMELHO
    return {
      cor: 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]',
      icone: <AlertTriangle size={16} className="animate-bounce" />,
      label: 'aluno atípico'
    };
  };

  const config = ehAtipico ? getConfigAtipico() : null;
  const temMedicamento = formData.medicacaoFixa && formData.medicacaoFixa !== "nenhum informado";

  return (
    <div className="relative flex flex-col items-end font-sans">
      <button 
        type="button" 
        onClick={() => setExpandido(!expandido)}
        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2 tracking-widest text-white border-2 border-white/30 uppercase italic
          ${ehAtipico ? `${config.cor} animate-pulse scale-105` : 'bg-emerald-500 hover:bg-emerald-600'}`}
      >
        {ehAtipico ? (
          <>
            {config.icone}
            {config.label}
          </>
        ) : (
          <>
            <History size={14} /> 
            ver histórico
          </>
        )}
      </button>

      {expandido && (
        <div className="absolute top-14 right-0 z-[100] w-80 bg-white border-2 border-slate-200 rounded-[35px] shadow-2xl p-7 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Info className={ehAtipico ? "text-slate-900" : "text-emerald-500"} size={18} />
              <span className="text-slate-900 font-black text-[10px] uppercase italic tracking-tighter">saúde inclusiva</span>
            </div>
            <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-lg uppercase italic">baenf</span>
          </div>
          
          <div className="space-y-4 text-left">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 italic">diagnóstico / pcd</p>
              <div className="flex flex-wrap gap-1.5">
                {condicoes.length > 0 ? condicoes.map((tag, i) => (
                  <span key={i} className="text-[10px] font-black px-2.5 py-1 rounded-xl border bg-slate-50 text-slate-700 border-slate-200 lowercase italic">
                    {tag}
                  </span>
                )) : (
                  <span className="text-[10px] font-bold text-slate-400 italic">nenhuma condição informada</span>
                )}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border-2 ${temMedicamento ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1.5 italic tracking-wider">medicação contínua</p>
              <p className={`text-[11px] font-black lowercase italic ${temMedicamento ? 'text-emerald-700' : 'text-slate-500'}`}>
                {formData.medicacaoFixa || "não informada"}
              </p>
            </div>

            {formData.contatoEmergencia && (
              <div className="bg-blue-50/50 p-4 rounded-2xl border-2 border-blue-100/50">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 italic">contato de emergência</p>
                <p className="text-[11px] font-black text-blue-800 lowercase italic tracking-tight">
                  {formData.contatoEmergencia}
                </p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => {
              setExpandido(false);
              onVerHistorico?.(formData.nomePaciente.toLowerCase().trim());
            }}
            className="w-full mt-6 py-4 bg-[#0A1629] hover:bg-slate-800 text-white rounded-[20px] text-[10px] font-black uppercase italic tracking-[0.1em] flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            abrir histórico completo <ChevronRight size={14} className="text-blue-400" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertaHistoricoPCD;