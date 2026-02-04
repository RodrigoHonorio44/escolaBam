import React, { useEffect, useState, useMemo } from 'react';
import { db, auth } from '../../firebase/firebaseConfig'; 
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { Brain, Search, Users, Zap, Printer, Phone, ChevronDown, Accessibility, Loader2, HeartPulse, AlertTriangle } from 'lucide-react';

const DashboardSaudeInclusiva = ({ setDadosParaEdicao, setActiveTab }) => {
  const [alunosEspeciais, setAlunosEspeciais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("todos");
  const [cardAberto, setCardAberto] = useState(null);

  useEffect(() => {
    const buscarAlunosEspeciais = async () => {
      if (!auth.currentUser) return;
      setLoading(true);
      try {
        const q = query(collection(db, "pastas_digitais"), orderBy("nome", "asc"));
        const snap = await getDocs(q);
        
        const lista = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(a => {
            const marcadorPCD = a.isPCD?.toString().toLowerCase().trim() === "sim";
            const temCategoria = (a.categoriasPCD && a.categoriasPCD.length > 0) || (a.tipoNecessidade);
            return marcadorPCD && temCategoria;
          });

        setAlunosEspeciais(lista);
      } catch (error) {
        console.error("Erro ao carregar PCDs:", error);
      } finally {
        setLoading(false);
      }
    };
    buscarAlunosEspeciais();
  }, []);

  const dadosFiltrados = useMemo(() => {
    let base = [...alunosEspeciais];

    if (abaAtiva === "tea") {
      base = base.filter(a => 
        a.categoriasPCD?.includes("tea") || 
        a.tipoNecessidade?.toLowerCase().includes("tea") || 
        a.tipoNecessidade?.toLowerCase().includes("autismo")
      );
    } else if (abaAtiva === "tdah") {
      base = base.filter(a => 
        a.categoriasPCD?.includes("tdah") || 
        a.tipoNecessidade?.toLowerCase().includes("tdah")
      );
    } else if (abaAtiva === "outros") {
      base = base.filter(a => {
        const cats = a.categoriasPCD || [];
        const n = a.tipoNecessidade?.toLowerCase() || "";
        const ehTea = cats.includes("tea") || n.includes("tea") || n.includes("autismo");
        const ehTdah = cats.includes("tdah") || n.includes("tdah");
        return !ehTea && !ehTdah; 
      });
    }

    if (filtro) {
      const termo = filtro.toLowerCase().trim();
      base = base.filter(a => a.nome?.toLowerCase().includes(termo));
    }

    return base;
  }, [alunosEspeciais, abaAtiva, filtro]);

  const formatarDiagnostico = (aluno) => {
    if (aluno.categoriasPCD && aluno.categoriasPCD.length > 0) {
      return aluno.categoriasPCD.map(c => {
        if (c === 'tea') return `tea (${aluno.detalheTEA || 'suporte não inf.'})`;
        if (c === 'tdah') return `tdah/tod (${aluno.detalheTDAH || 'não inf.'})`;
        if (c === 'intelectual') return `intelectual (${aluno.detalheIntelectual || 'não inf.'})`;
        return c;
      }).join(" + ");
    }
    return aluno.tipoNecessidade || "não especificado";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="animate-spin mb-4 text-purple-600" size={40} />
        <p className="font-black uppercase italic text-[10px] tracking-widest text-purple-600">Filtrando Diagnósticos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-2">
            <Brain size={28} className="text-purple-600" /> Saúde Inclusiva
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase italic">Monitoramento de Alunos com Diagnóstico</p>
        </div>
        <button onClick={() => window.print()} className="no-print flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-purple-700 transition-all active:scale-95">
          <Printer size={18} /> Imprimir Relatório
        </button>
      </div>

      {/* Navegação de Categorias */}
      <div className="flex flex-wrap gap-2 no-print bg-white p-2 rounded-[25px] border border-slate-100 shadow-sm">
        {[
          { id: "todos", label: "Geral PCD", icon: <Users size={14}/> },
          { id: "tea", label: "TEA / Autismo", icon: <Brain size={14}/> },
          { id: "tdah", label: "TDAH", icon: <Zap size={14}/> },
          { id: "outros", label: "Deficiências / Outros", icon: <Accessibility size={14}/> },
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => { setAbaAtiva(tab.id); setCardAberto(null); }} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[20px] text-[10px] font-black uppercase italic transition-all ${abaAtiva === tab.id ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-50"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Busca Rápida */}
      <div className="relative no-print">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
        <input 
          type="text" 
          placeholder={`Buscar aluno em ${abaAtiva}...`} 
          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-3xl font-black text-[10px] uppercase italic shadow-sm outline-none focus:ring-2 ring-purple-500 transition-all" 
          value={filtro} 
          onChange={(e) => setFiltro(e.target.value)} 
        />
      </div>

      {/* Cards de Alunos */}
      <div className="grid grid-cols-1 gap-3">
        {dadosFiltrados.length > 0 ? (
          dadosFiltrados.map(aluno => (
            <div key={aluno.id} className={`bg-white rounded-[30px] border shadow-sm overflow-hidden transition-all ${aluno.temAlergia === 'sim' ? 'border-red-200 shadow-red-50' : 'border-slate-100'}`}>
              <div 
                onClick={() => setCardAberto(cardAberto === aluno.id ? null : aluno.id)} 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border uppercase transition-colors ${aluno.temAlergia === 'sim' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                    {aluno.nome?.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase italic text-sm flex items-center gap-2">
                      {aluno.nome}
                      {aluno.temAlergia === 'sim' && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                    </h3>
                    <div className="flex gap-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TURMA: {aluno.turma || '---'}</p>
                        {aluno.tomaMedicao === 'sim' && <span className="text-[8px] font-black text-blue-500 uppercase flex items-center gap-1"><HeartPulse size={10}/> Com Medicação</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    {aluno.temAlergia === 'sim' && <span className="px-3 py-1 bg-red-500 text-white rounded-full text-[8px] font-black uppercase italic shadow-sm">Alérgico</span>}
                    <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-[8px] font-black uppercase italic">PCD</span>
                    <ChevronDown size={20} className={`text-slate-300 transition-transform ${cardAberto === aluno.id ? "rotate-180" : ""}`} />
                </div>
              </div>

              {cardAberto === aluno.id && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Diagnóstico / Detalhes</p>
                        <p className="text-[11px] font-black text-slate-800 uppercase italic">
                            {formatarDiagnostico(aluno)}
                        </p>
                      </div>

                      {/* SEÇÃO DE ALERGIA */}
                      {aluno.temAlergia === 'sim' ? (
                        <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                          <p className="text-[8px] font-black text-red-500 uppercase mb-1 flex items-center gap-1">
                            <AlertTriangle size={10}/> Alergia Confirmada
                          </p>
                          <p className="text-[11px] font-black text-red-700 uppercase">
                            {aluno.historicoMedico || "alergia não especificada"}
                          </p>
                          {aluno.observacoesAlergia && (
                            <p className="text-[9px] text-red-600 mt-1 italic leading-tight">
                              Obs: {aluno.observacoesAlergia}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-green-50 p-3 rounded-2xl border border-green-100">
                          <p className="text-[9px] font-black text-green-600 uppercase">Sem Alergias Relatadas</p>
                        </div>
                      )}

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">CID / Locomoção</p>
                        <p className="text-[11px] font-black text-slate-800 uppercase">
                            CID: {aluno.numeroCid || "n/i"} • {aluno.detalheFisico || "andante"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-3">
                      <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex items-center gap-3">
                        <Phone size={16} className="text-blue-600" />
                        <div>
                            <p className="text-[8px] font-black text-blue-400 uppercase">{aluno.contato1_parentesco || 'Responsável'}: {aluno.contato1_nome}</p>
                            <p className="text-[11px] font-black text-blue-900">{aluno.contato1_telefone || "Sem telefone"}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setDadosParaEdicao(aluno); setActiveTab("pasta_digital"); }} 
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] italic shadow-lg hover:bg-purple-600 transition-all"
                      >
                        Acessar Pasta Digital
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
            <p className="text-slate-300 font-black uppercase italic text-xs">Nenhum aluno PCD localizado nesta categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSaudeInclusiva;