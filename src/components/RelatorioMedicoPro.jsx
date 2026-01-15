import React, { useState } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { 
  ClipboardPlus, Activity, Users, AlertTriangle, 
  Printer, Search, Loader2, Thermometer, ChevronRight
} from 'lucide-react';

const RelatorioMedicoPro = () => {
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

      // --- DICIONÁRIOS PARA CONTAGEM ---
      const contagemAlunos = {};
      const contagemDoencas = {};
      let alergicosAtendidos = 0;

      lista.forEach(item => {
        // 1. Contagem por Aluno
        const nome = item.alunoNome.toUpperCase();
        contagemAlunos[nome] = (contagemAlunos[nome] || 0) + 1;

        // 2. Contagem por Doença/Sintoma (Baseado no campo motivo ou queixa)
        const motivo = item.motivoAtendimento || "Outros";
        contagemDoencas[motivo] = (contagemDoencas[motivo] || 0) + 1;

        // 3. Verificação de Alergias
        if (item.alunoPossuiAlergia === "Sim") alergicosAtendidos++;
      });

      // Ordenar Rankings
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

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
      
      {/* SELEÇÃO DE PERÍODO (Esconde na impressão) */}
      <div className="print:hidden mb-10 p-6 bg-slate-900 rounded-[30px] flex flex-wrap items-end gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Inicial</label>
          <input type="date" value={periodo.inicio} onChange={e => setPeriodo({...periodo, inicio: e.target.value})} className="block w-full bg-slate-800 text-white p-3 rounded-xl border-none font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Final</label>
          <input type="date" value={periodo.fim} onChange={e => setPeriodo({...periodo, fim: e.target.value})} className="block w-full bg-slate-800 text-white p-3 rounded-xl border-none font-bold" />
        </div>
        <button onClick={processarRelatorio} disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-blue-700 transition-all">
          {loading ? <Loader2 className="animate-spin" /> : <><Search size={16}/> Gerar Auditoria Médica</>}
        </button>
      </div>

      {/* CABEÇALHO PARA IMPRESSÃO */}
      <div className="mb-10 flex justify-between items-start border-b-4 border-slate-900 pb-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">Relatório de Saúde Escolar</h1>
          <p className="text-slate-500 font-bold uppercase text-xs">Período de Análise: {new Date(periodo.inicio).toLocaleDateString()} a {new Date(periodo.fim).toLocaleDateString()}</p>
        </div>
        <button onClick={() => window.print()} className="print:hidden bg-slate-100 p-4 rounded-2xl hover:bg-slate-200 transition-all">
          <Printer size={20} />
        </button>
      </div>

      {/* GRID DE RESUMO EPIDEMIOLÓGICO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-50 p-6 rounded-[35px] border-2 border-slate-100">
          <div className="flex items-center gap-3 text-blue-600 mb-4">
            <Activity size={24} />
            <span className="font-black uppercase text-[10px] tracking-widest">Total de Atendimentos</span>
          </div>
          <h2 className="text-5xl font-black text-slate-900 italic">{dados.atendimentos.length}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Casos registrados no sistema</p>
        </div>

        <div className="bg-orange-50 p-6 rounded-[35px] border-2 border-orange-100 text-orange-700">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={24} />
            <span className="font-black uppercase text-[10px] tracking-widest">Alergias Detectadas</span>
          </div>
          <h2 className="text-5xl font-black italic">{dados.totalAlergicos}</h2>
          <p className="text-[10px] font-bold opacity-70 uppercase mt-2">Alunos de risco atendidos</p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-[35px] border-2 border-emerald-100 text-emerald-700">
          <div className="flex items-center gap-3 mb-4">
            <Thermometer size={24} />
            <span className="font-black uppercase text-[10px] tracking-widest">Principal Queixa</span>
          </div>
          <h2 className="text-2xl font-black uppercase italic truncate">{dados.rankingDoencas[0]?.nome || "-"}</h2>
          <p className="text-[10px] font-bold opacity-70 uppercase mt-2">Doença mais frequente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* RANKING DE ALUNOS (QUEM MAIS VEIO) */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
             <Users size={16} /> Recorrência por Aluno
          </h3>
          <div className="space-y-3">
            {dados.rankingAlunos.slice(0, 5).map((aluno, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                <span className="text-xs font-black text-slate-700 uppercase italic">{aluno.nome}</span>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black ${aluno.qtd > 3 ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {aluno.qtd} ATENDIMENTOS
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RANKING DE DOENÇAS/SINTOMAS (QUADRO CLÍNICO) */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
             <ClipboardPlus size={16} /> Principais Doenças/Sintomas
          </h3>
          <div className="space-y-3">
            {dados.rankingDoencas.map((doenca, idx) => (
              <div key={idx} className="relative overflow-hidden bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div 
                  className="absolute left-0 top-0 h-full bg-blue-100 opacity-30 transition-all" 
                  style={{ width: `${(doenca.qtd / dados.atendimentos.length) * 100}%` }}
                ></div>
                <div className="relative flex justify-between items-center">
                  <span className="text-xs font-black text-slate-700 uppercase">{doenca.nome}</span>
                  <span className="text-xs font-black text-blue-600">{doenca.qtd} CASOS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RODAPÉ TÉCNICO */}
      <div className="mt-20 pt-10 border-t text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
        Relatório Gerado por Sistema de Gestão de Saúde Escolar • Documento para Auditoria Interna
      </div>
    </div>
  );
};

export default RelatorioMedicoPro;