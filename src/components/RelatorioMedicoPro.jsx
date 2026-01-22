import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, query, where, getDocs, orderBy 
} from 'firebase/firestore';
import { 
  ClipboardPlus, Activity, Users, AlertTriangle, 
  Printer, Search, Loader2, Thermometer, ArrowLeft
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const RelatorioMedicoPro = ({ onVoltar, darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    atendimentos: [],
    rankingAlunos: [],
    rankingDoencas: [],
    totalAlergicos: 0
  });

  const [periodo, setPeriodo] = useState({
    inicio: new Date().toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });

  const processarRelatorio = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "atendimentos"),
        where("dataAtendimento", ">=", periodo.inicio),
        where("dataAtendimento", "<=", periodo.fim),
        orderBy("dataAtendimento", "desc")
      );

      const snap = await getDocs(q);
      const lista = snap.docs.map(doc => doc.data());

      const contagemAlunos = {};
      const contagemDoencas = {};
      let alergicosAtendidos = 0;

      lista.forEach(item => {
        const nome = (item.alunoNome || "Não Informado").toUpperCase();
        contagemAlunos[nome] = (contagemAlunos[nome] || 0) + 1;

        const motivo = item.motivoAtendimento || "Outros";
        contagemDoencas[motivo] = (contagemDoencas[motivo] || 0) + 1;

        if (item.alunoPossuiAlergia === "Sim") alergicosAtendidos++;
      });

      const rankAlunos = Object.entries(contagemAlunos)
        .map(([nome, qtd]) => ({ nome, qtd }))
        .sort((a, b) => b.qtd - a.qtd);

      const rankDoencas = Object.entries(contagemDoencas)
        .map(([nome, qtd]) => ({ nome, qtd }))
        .sort((a, b) => b.qtd - a.qtd);

      setDados({
        atendimentos: lista,
        rankingAlunos: rankAlunos,
        rankingDoencas: rankDoencas,
        totalAlergicos: alergicosAtendidos
      });

      toast.success(`${lista.length} ATENDIMENTOS ANALISADOS`);
    } catch (error) {
      console.error(error);
      toast.error("ERRO AO BUSCAR DADOS");
    } finally {
      setLoading(false);
    }
  };

  // Cores dinâmicas baseadas no Dark Mode do seu Dashboard
  const theme = {
    card: darkMode ? "bg-[#0A1629] border-white/5 text-white" : "bg-white border-slate-100 text-slate-900",
    text: darkMode ? "text-slate-400" : "text-slate-500",
    title: darkMode ? "text-white" : "text-slate-900",
    input: darkMode ? "bg-[#050B18] text-white border-white/10" : "bg-slate-50 text-slate-900 border-slate-200"
  };

  return (
    <div className={`w-full min-h-screen p-2 md:p-4 animate-in fade-in duration-500`}>
      <Toaster position="top-right" />
      
      {/* HEADER DO RELATÓRIO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <button onClick={onVoltar} className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest mb-2 hover:gap-4 transition-all">
            <ArrowLeft size={14} /> Voltar ao Início
          </button>
          <h1 className={`text-3xl font-black uppercase italic tracking-tighter ${theme.title}`}>
            Auditoria <span className="text-blue-600">Médica</span>
          </h1>
        </div>

        <div className={`flex items-center gap-3 p-2 rounded-2xl border ${theme.card}`}>
          <div className="flex flex-col px-4">
             <span className="text-[9px] font-black uppercase opacity-50">Análise de Dados</span>
             <span className="text-xs font-bold text-blue-500 italic">Enterprise Intelligence</span>
          </div>
          <button onClick={() => window.print()} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* FILTROS (Esconde na impressão) */}
      <div className={`print:hidden mb-8 p-6 rounded-[30px] border flex flex-wrap items-end gap-6 shadow-xl ${theme.card}`}>
        <div className="space-y-2">
          <label className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] ml-2">Data Inicial</label>
          <input type="date" value={periodo.inicio} onChange={e => setPeriodo({...periodo, inicio: e.target.value})} className={`block w-full p-3 rounded-xl font-bold outline-none border ${theme.input}`} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] ml-2">Data Final</label>
          <input type="date" value={periodo.fim} onChange={e => setPeriodo({...periodo, fim: e.target.value})} className={`block w-full p-3 rounded-xl font-bold outline-none border ${theme.input}`} />
        </div>
        <button onClick={processarRelatorio} disabled={loading} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-blue-700 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" /> : <><Search size={16}/> Gerar Auditoria</>}
        </button>
      </div>

      {/* CARDS DE INDICADORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-8 rounded-[40px] border ${theme.card}`}>
          <Activity className="text-blue-600 mb-4" size={32} />
          <h2 className="text-6xl font-black italic leading-none mb-2">{dados.atendimentos.length}</h2>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-50 italic">Total de Atendimentos</p>
        </div>

        <div className={`p-8 rounded-[40px] border ${darkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-100"} text-orange-600`}>
          <AlertTriangle className="mb-4" size={32} />
          <h2 className="text-6xl font-black italic leading-none mb-2">{dados.totalAlergicos}</h2>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 italic">Alunos Alérgicos</p>
        </div>

        <div className={`p-8 rounded-[40px] border ${darkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"} text-emerald-600`}>
          <Thermometer className="mb-4" size={32} />
          <h2 className="text-2xl font-black uppercase italic leading-tight truncate">{dados.rankingDoencas[0]?.nome || "Nenhuma"}</h2>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 italic">Maior Incidência</p>
        </div>
      </div>

      {/* RANKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`p-8 rounded-[40px] border ${theme.card}`}>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-8 flex items-center gap-2 italic">
             <Users size={16} /> Fluxo por Aluno
          </h3>
          <div className="space-y-4">
            {dados.rankingAlunos.slice(0, 5).map((aluno, idx) => (
              <div key={idx} className={`flex items-center justify-between p-5 rounded-2xl border ${darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                <span className="text-xs font-black uppercase italic">{aluno.nome}</span>
                <span className={`px-4 py-2 rounded-xl text-[9px] font-black ${aluno.qtd >= 3 ? "bg-red-600 text-white" : "bg-blue-600/10 text-blue-500"}`}>
                  {aluno.qtd} CASOS
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-8 rounded-[40px] border ${theme.card}`}>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-8 flex items-center gap-2 italic">
             <ClipboardPlus size={16} /> Mapa de Sintomas
          </h3>
          <div className="space-y-4">
            {dados.rankingDoencas.map((doenca, idx) => (
              <div key={idx} className="relative overflow-hidden p-5 rounded-2xl bg-black/5 dark:bg-white/5">
                <div 
                  className="absolute left-0 top-0 h-full bg-blue-600/10 transition-all duration-1000" 
                  style={{ width: `${(doenca.qtd / (dados.atendimentos.length || 1)) * 100}%` }}
                ></div>
                <div className="relative flex justify-between items-center">
                  <span className="text-xs font-black uppercase italic">{doenca.nome}</span>
                  <span className="text-[10px] font-black text-blue-500">{doenca.qtd} OCORRÊNCIAS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatorioMedicoPro;