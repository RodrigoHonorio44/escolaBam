import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, getDocs } from 'firebase/firestore';
import { 
  LayoutDashboard, Scale, Repeat, Search, Loader2, 
  ArrowLeft, Users, ChevronLeft, ChevronRight 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Importação dos Sub-componentes
import AbaGeral from './AbaGeral';
import AbaNutricional from './AbaNutricional';
import AbaRecidiva from './AbaRecidiva';

const AbaFichasMedicas = ({ grupos, darkMode }) => {
  const [subAba, setSubAba] = useState('alergias');
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const itensPorPagina = 8;

  const categorias = [
    { id: 'alergias', label: 'Alergias', dados: grupos.alergias || [] },
    { id: 'acessibilidade', label: 'Acessibilidade / PCD', dados: grupos.acessibilidade || [] },
    { id: 'cronicos', label: 'Doenças Crônicas', dados: grupos.cronicos || [] },
    { id: 'restricao', label: 'Restrição Alimentar', dados: grupos.restricaoAlimentar || [] },
  ];

  const categoriaAtual = categorias.find(c => c.id === subAba);
  const dadosOriginais = categoriaAtual ? categoriaAtual.dados : [];
  
  const dadosFiltrados = dadosOriginais.filter(aluno => 
    aluno.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  const inicio = (pagina - 1) * itensPorPagina;
  const dadosExibidos = dadosFiltrados.slice(inicio, inicio + itensPorPagina);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSubAba(cat.id); setPagina(1); }}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                subAba === cat.id 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                  : darkMode ? 'bg-white/5 text-slate-400' : 'bg-white text-slate-600 border'
              }`}
            >
              {cat.label} ({cat.dados.length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            className={`w-full pl-12 pr-4 py-3 rounded-xl text-xs font-bold border ${
              darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-200'
            }`}
          />
        </div>
      </div>

      <div className={`rounded-[35px] border overflow-hidden ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                <th className="p-6">Nome do Aluno</th>
                <th className="p-6">Idade</th>
                <th className="p-6">Turma</th>
                <th className="p-6">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dadosExibidos.length > 0 ? dadosExibidos.map((aluno, idx) => (
                <tr key={idx} className={`hover:bg-blue-600/5 transition-colors ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                  <td className="p-6 font-bold italic">{aluno.nome?.toLowerCase()}</td>
                  <td className="p-6 text-xs">{aluno.idade || '--'} anos</td>
                  <td className="p-6 text-[9px] font-black uppercase">{aluno.turma || "n/i"}</td>
                  <td className="p-6 text-[10px] opacity-70 max-w-[200px] truncate">
                    {subAba === 'alergias' && (aluno.detalhesAlergia || aluno.alergias || "registrado")}
                    {subAba === 'cronicos' && (aluno.detalhesDoenca || "registrado")}
                    {subAba === 'restricao' && (aluno.detalhesRestricao || "registrado")}
                    {subAba === 'acessibilidade' && (aluno.tipoDeficiencia || "registrado")}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="p-10 text-center opacity-30 text-[10px] font-black uppercase">Nenhum registro encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DashboardAuditoria = ({ onVoltar, darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [dados, setDados] = useState({
    atendimentos: [],
    rankingQueixas: [],
    totalFebre: 0,
    totalAlergicos: 0,
    tempoMedio: 0,
    reincidentes: [],
    alunosSobrepeso: [],
    gruposSaude: { acessibilidade: [], alergias: [], cronicos: [], restricaoAlimentar: [] }
  });

  const [periodo, setPeriodo] = useState({
    inicio: new Date().toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });

  const normalizarBool = (val) => {
    if (!val) return false;
    const v = val.toString().toLowerCase().trim();
    return v === 'sim' || v === 's' || v === 'true';
  };

  const processarMetricas = (atendimentos, alunos) => {
    let somaMin = 0, febre = 0;
    const contAlunos = {}, contQueixas = {};

    atendimentos.forEach(a => {
      const id = (a.pacienteId || a.nomePaciente || "ni").toLowerCase().trim();
      if (!contAlunos[id]) {
        contAlunos[id] = { 
          nome: (a.nomePaciente || "n/i").toLowerCase(), 
          qtd: 0, 
          turma: a.turma || "n/i" 
        };
      }
      contAlunos[id].qtd++;
      
      const queixa = (a.motivoAtendimento || a.queixaPrincipal || a.motivo || "outros").toLowerCase().trim();
      contQueixas[queixa] = (contQueixas[queixa] || 0) + 1;
      
      if (a.horario && a.horarioSaida) {
          const [h1, m1] = a.horario.split(':').map(Number);
          const [h2, m2] = a.horarioSaida.split(':').map(Number);
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          somaMin += diff > 0 ? diff : 1;
      } else {
          somaMin += (parseInt(a.tempoDuracao) || 1);
      }

      if (parseFloat(a.temperatura) >= 37.5 || queixa.includes("febre")) febre++;
    });

    return {
      atendimentos,
      rankingQueixas: Object.entries(contQueixas).sort((a, b) => b[1] - a[1]),
      totalFebre: febre,
      totalAlergicos: alunos.filter(p => normalizarBool(p.alunoPossuiAlergia || p.alergia)).length,
      tempoMedio: atendimentos.length > 0 ? (somaMin / atendimentos.length).toFixed(1) : 0,
      reincidentes: Object.values(contAlunos).filter(a => a.qtd > 1).sort((a, b) => b.qtd - a.qtd),
      gruposSaude: {
        acessibilidade: alunos.filter(p => normalizarBool(p.pcd || p.acessibilidade)),
        alergias: alunos.filter(p => normalizarBool(p.alunoPossuiAlergia || p.alergia)),
        cronicos: alunos.filter(p => normalizarBool(p.doencaCronica)),
        restricaoAlimentar: alunos.filter(p => normalizarBool(p.restricaoAlimentar))
      }
    };
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Removido o 'where' do Firebase para evitar problemas de formato de string
      // Buscamos a coleção completa e filtramos no JS para máxima precisão
      const colecoesAtendimento = ["atendimentos_enfermagem", "questionarios_saude"];
      const promessasAtend = colecoesAtendimento.map(col => getDocs(collection(db, col)));
      const snapAlunos = await getDocs(collection(db, "alunos"));
      const resultadosAtend = await Promise.all(promessasAtend);

      let atendimentosConsolidados = [];
      resultadosAtend.forEach(snap => {
        snap.docs.forEach(doc => {
          const dataDoc = doc.data();
          // Filtro de data via JavaScript (mais resiliente)
          if (dataDoc.data >= periodo.inicio && dataDoc.data <= periodo.fim) {
            atendimentosConsolidados.push({ id: doc.id, ...dataDoc });
          }
        });
      });

      const listaAlunos = snapAlunos.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        nome: (doc.data().nome || "").toLowerCase()
      }));

      setDados(processarMetricas(atendimentosConsolidados, listaAlunos));
      
      if(atendimentosConsolidados.length === 0) {
        toast("Nenhum atendimento neste período", { icon: '📅' });
      } else {
        toast.success(`${atendimentosConsolidados.length} registros sincronizados`);
      }
      
    } catch (error) {
      console.error("Erro na carga:", error);
      toast.error("Erro ao conectar com o banco");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, [periodo.inicio, periodo.fim]);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? 'bg-[#050B18] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-right" />
      
      <div className="mb-8 flex justify-between items-start">
        <div>
          <button onClick={onVoltar} className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase mb-2 hover:translate-x-[-4px] transition-transform">
            <ArrowLeft size={14}/> Painel Principal
          </button>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Dashboard <span className="text-blue-600">Audit</span>
          </h1>
        </div>
      </div>

      <div className={`p-6 rounded-[30px] border mb-8 ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex gap-3 items-center">
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase opacity-40 ml-2">Data Inicial</label>
               <input type="date" value={periodo.inicio} onChange={e => setPeriodo({...periodo, inicio: e.target.value})} className={`p-3 block rounded-xl font-bold border ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase opacity-40 ml-2">Data Final</label>
               <input type="date" value={periodo.fim} onChange={e => setPeriodo({...periodo, fim: e.target.value})} className={`p-3 block rounded-xl font-bold border ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
            </div>
          </div>
          <button onClick={carregarDados} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-lg shadow-blue-600/20">
            {loading ? <Loader2 className="animate-spin" size={18}/> : "Sincronizar Rede"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        <Tab icon={<LayoutDashboard size={14}/>} label="Indicadores" active={activeTab === 'geral'} onClick={() => setActiveTab('geral')} />
        <Tab icon={<Users size={14}/>} label="Fichas Médicas" active={activeTab === 'fichas'} onClick={() => setActiveTab('fichas')} />
        <Tab icon={<Scale size={14}/>} label="Nutricional" active={activeTab === 'nutri'} onClick={() => setActiveTab('nutri')} />
        <Tab icon={<Repeat size={14}/>} label="Recidiva" active={activeTab === 'recidiva'} onClick={() => setActiveTab('recidiva')} />
      </div>

      <div className="pb-10">
        {activeTab === 'geral' && <AbaGeral dados={dados} darkMode={darkMode} />}
        {activeTab === 'fichas' && <AbaFichasMedicas grupos={dados.gruposSaude} darkMode={darkMode} />}
        {activeTab === 'nutri' && <AbaNutricional dados={dados} darkMode={darkMode} />}
        {activeTab === 'recidiva' && <AbaRecidiva dados={dados} darkMode={darkMode} />}
      </div>
    </div>
  );
};

const Tab = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'}`}>
    {icon} {label}
  </button>
);

export default DashboardAuditoria;