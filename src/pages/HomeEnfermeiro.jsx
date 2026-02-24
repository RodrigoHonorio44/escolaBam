import React, { useState } from 'react';
import { 
  Users, CheckCircle2, Search, Activity, ShieldCheck, Clock, 
  RotateCw, BarChart3, Filter, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useHomeEnfermeiro } from '../hooks/useHomeEnfermeiro';

const HomeEnfermeiro = ({ user, darkMode, visaoMensal, setVisaoMensal }) => {
  // unidadeExibida vem do hook que checa o localStorage (Modo Root/Joana)
  const { 
    metricas, 
    todosAtendimentosHoje, 
    resultadoRelatorio, 
    carregandoRelatorio, 
    gerarRelatorioGeral,
    unidadeExibida 
  } = useHomeEnfermeiro(user);
  
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null); 
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  // ✅ Regra de Ouro: R S em UP, resto LowerCase capitalizado
  const formatarParaTela = (texto) => {
    if (!texto) return "";
    return texto.toString().toLowerCase().trim().split(/\s+/).map(p => {
      // Se for R ou S (mesmo com ponto), mantém em caixa alta
      if (p === 'r' || p === 's' || p === 'r.' || p === 's.') return p.toUpperCase();
      // Nomes curtos de ligação (da, do, de) podem ficar em lowercase se preferir, 
      // mas aqui estou capitalizando tudo para manter o padrão "Caio Giromba"
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  };

  const totalPaginas = Math.ceil(todosAtendimentosHoje.length / itensPorPagina);
  const atendimentosPaginados = todosAtendimentosHoje.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  return (
    <div className={`min-h-screen space-y-8 animate-in fade-in duration-500 pb-10 px-4 md:px-0 ${darkMode ? "text-white" : "text-slate-900"}`}>
      
      {/* HEADER - IDENTIFICAÇÃO DINÂMICA */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8 print:hidden ${darkMode ? "border-white/10" : "border-slate-200"}`}>
        <div>
          <h1 className={`text-4xl md:text-5xl font-[1000] italic tracking-tighter uppercase leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
            Olá, <span className="text-blue-600">{formatarParaTela(user?.nome?.split(' ')[0])}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className={`flex items-center gap-2 text-[10px] font-black italic uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              <ShieldCheck size={14} className="text-blue-500" />
              {/* ✅ Exibição da Unidade formatada */}
              {formatarParaTela(unidadeExibida)} 
              <span className="opacity-30 mx-1">|</span> 
              {user?.registroProfissional || "COREN PENDENTE"}
            </div>
            
            <button 
              onClick={() => setMostrarRelatorio(!mostrarRelatorio)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all ${
                mostrarRelatorio 
                ? "bg-blue-600 border-blue-600 text-white" 
                : (darkMode ? "bg-transparent border-white/20 text-slate-300" : "bg-white border-slate-200 text-slate-500 hover:border-blue-500 shadow-sm")
              }`}
            >
              <BarChart3 size={14} /> {mostrarRelatorio ? "Fechar Consulta" : "Relatório Inteligente"}
            </button>
          </div>
        </div>
      </div>

      {/* CARDS KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
        {[
          { icon: <Clock className="text-orange-500" />, label: "Média", val: visaoMensal ? metricas.tempoMedioMes : metricas.tempoMedio, unit: "MIN", sub: visaoMensal ? "Mês" : "Hoje" },
          { icon: <Activity className={metricas.pendentes > 0 ? "text-orange-500 animate-pulse" : "text-slate-400"} />, label: "Pendentes", val: metricas.pendentes, sub: "Aguardando" },
          { icon: <CheckCircle2 className="text-emerald-500" />, label: "Total", val: visaoMensal ? metricas.atendidosMes : metricas.atendidoshoje, sub: visaoMensal ? "Mês" : "Hoje" },
          { icon: <Users className="text-blue-500" />, label: "Base", val: `${metricas.totalAlunos}/${metricas.totalFuncionarios}`, sub: "Alunos/Func" },
        ].map((card, idx) => (
          <div 
            key={idx} 
            onClick={idx !== 1 && idx !== 3 ? () => setVisaoMensal(!visaoMensal) : undefined} 
            className={`p-8 rounded-[40px] border flex flex-col justify-between h-48 transition-all hover:scale-[1.02] cursor-pointer ${
              darkMode 
              ? "bg-white/5 border-white/10 shadow-2xl" 
              : "bg-white border-slate-100 shadow-sm hover:shadow-md"
            }`}
          >
            {card.icon}
            <div>
              <span className={`text-4xl font-[1000] italic leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
                {card.val}
              </span>
              {card.unit && <span className="text-xs font-black ml-1 text-slate-400 italic">{card.unit}</span>}
              <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">{card.label} {card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* LISTA DE FLUXO OPERACIONAL */}
      <div className={`rounded-[40px] border transition-all ${
        darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm"
      }`}>
        <div className={`p-6 border-b flex items-center justify-between ${darkMode ? "border-white/5" : "border-slate-100"}`}>
          <h4 className={`text-[10px] font-black uppercase italic tracking-widest ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Fluxo Operacional Diário — {formatarParaTela(unidadeExibida)}
          </h4>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-3">
              <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} className={`hover:text-blue-500 transition-colors ${darkMode ? "text-white" : "text-slate-400"}`}><ChevronLeft size={18}/></button>
              <span className="text-[10px] font-black italic">{paginaAtual} / {totalPaginas}</span>
              <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} className={`hover:text-blue-500 transition-colors ${darkMode ? "text-white" : "text-slate-400"}`}><ChevronRight size={18}/></button>
            </div>
          )}
        </div>
        
        <div className="p-4">
          {atendimentosPaginados.length > 0 ? (
            atendimentosPaginados.map(atend => (
              <div key={atend.id} className={`p-4 flex items-center justify-between border-b last:border-0 rounded-3xl transition-all mb-1 ${
                darkMode ? "border-white/5 hover:bg-white/5" : "border-slate-50 hover:bg-slate-50"
              }`}>
                <div className="flex items-center gap-4">
                  <span className={`text-[11px] font-black px-3 py-2 rounded-2xl italic ${
                    atend.statusAtendimento !== 'finalizado' 
                    ? 'bg-orange-500 text-white animate-pulse' 
                    : (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                  }`}>
                    {atend.horario}
                  </span>
                  <div onClick={() => setAtendimentoSelecionado(atend)} className="cursor-pointer">
                    <p className={`text-base font-black uppercase italic tracking-tighter ${darkMode ? "text-white" : "text-slate-800"}`}>
                      {/* ✅ Nome formatado com R S Up */}
                      {formatarParaTela(atend.nomePaciente)}
                    </p>
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] text-slate-400 font-bold uppercase">{atend.motivoAtendimento || "Consulta"}</p>
                       {atend.perfilPaciente && (
                         <span className="text-[8px] font-black px-2 py-0.5 bg-slate-500/10 text-slate-400 rounded-full uppercase">{atend.perfilPaciente}</span>
                       )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setAtendimentoSelecionado(atend)} 
                  className={`p-3 rounded-2xl transition-all ${
                    darkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white shadow-sm"
                  }`}
                >
                  <Search size={18} />
                </button>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] italic tracking-[0.3em]">
              Sem registros para hoje em {formatarParaTela(unidadeExibida)}
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-4">
        rodhon intelligence — painel operacional 2026
      </div>
    </div>
  );
};

export default HomeEnfermeiro;