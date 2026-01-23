import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { 
  LayoutDashboard, Scale, Repeat, Search, Loader2, 
  ArrowLeft, Users, ChevronLeft, ChevronRight 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Importação dos Sub-componentes
import AbaGeral from './AbaGeral';
import AbaNutricional from './AbaNutricional';
import AbaRecidiva from './AbaRecidiva';

// --- SUB-COMPONENTE FICHAS MÉDICAS ---
const AbaFichasMedicas = ({ grupos, darkMode }) => {
  const [subAba, setSubAba] = useState('alergias');
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const itensPorPagina = 8;

  const categorias = [
    { id: 'alergias', label: 'Alergias', dados: grupos.alergias },
    { id: 'acessibilidade', label: 'Acessibilidade / PCD', dados: grupos.acessibilidade },
    { id: 'cronicos', label: 'Doenças Crônicas', dados: grupos.cronicos },
    { id: 'restricao', label: 'Restrição Alimentar', dados: grupos.restricaoAlimentar },
  ];

  const dadosOriginais = categorias.find(c => c.id === subAba).dados;
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
                  <td className="p-6 font-bold italic">{aluno.nome?.toUpperCase()}</td>
                  <td className="p-6 text-xs">{aluno.idade || '--'} anos</td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[9px] font-black uppercase">
                      {aluno.turma || "N/I"}
                    </span>
                  </td>
                  <td className="p-6 text-[10px] opacity-70 max-w-[200px] truncate">
                    {subAba === 'alergias' && (aluno.detalhesAlergia || aluno.alergias || "Sim")}
                    {subAba === 'cronicos' && (aluno.detalhesDoenca || "Sim")}
                    {subAba === 'restricao' && (aluno.detalhesRestricao || "Sim")}
                    {subAba === 'acessibilidade' && (aluno.tipoDeficiencia || "Sim")}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="p-10 text-center opacity-30 text-[10px] font-black uppercase">Nenhum registro encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={`p-6 flex items-center justify-between border-t ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <span className="text-[10px] font-black uppercase opacity-40">Total: {dadosFiltrados.length} registros</span>
          <div className="flex gap-2">
            <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="p-2 rounded-lg bg-slate-500/10 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-20"><ChevronLeft size={16} /></button>
            <div className="flex items-center px-4 text-[9px] font-black tracking-widest">{pagina} / {totalPaginas || 1}</div>
            <button disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)} className="p-2 rounded-lg bg-slate-500/10 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-20"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DASHBOARD ---
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

  const processarMetricas = (atendimentos, pastas) => {
    let somaMin = 0, febre = 0;
    const contAlunos = {}, contQueixas = {};

    atendimentos.forEach(a => {
      const id = a.pacienteId || a.nomePaciente;
      if (!contAlunos[id]) {
        contAlunos[id] = { nome: (a.nomePaciente || "N/I").toUpperCase(), qtd: 0, turma: a.turma || "N/I" };
      }
      contAlunos[id].qtd++;
      const queixa = a.queixaPrincipal || "Outros";
      contQueixas[queixa] = (contQueixas[queixa] || 0) + 1;
      somaMin += (parseInt(a.tempoDuracao) || 0);
      if (parseFloat(a.temperatura) >= 37.5) febre++;
    });

    // ATUALIZAÇÃO DA LÓGICA NUTRICIONAL (SEMÁFORO)
    const alertasNutricionais = pastas.map(p => {
      const peso = parseFloat(p.peso?.toString().replace(',', '.')) || 0;
      let h = parseFloat(p.altura?.toString().replace(',', '.')) || 0;
      if (h > 3) h = h / 100; // Converte 160cm para 1.60m

      const imc = (peso > 0 && h > 0) ? (peso / (h * h)).toFixed(1) : 0;
      return { ...p, imcCalculado: imc };
    }).filter(p => {
      const n = parseFloat(p.imcCalculado);
      // Captura Baixo Peso (<18.5) OU Sobrepeso/Obesidade (>=25)
      return n > 0 && (n < 18.5 || n >= 25);
    });

    return {
      atendimentos,
      rankingQueixas: Object.entries(contQueixas).sort((a, b) => b[1] - a[1]),
      totalFebre: febre,
      totalAlergicos: pastas.filter(p => p.alergia === "Sim").length,
      tempoMedio: atendimentos.length > 0 ? (somaMin / atendimentos.length).toFixed(1) : 0,
      reincidentes: Object.values(contAlunos).filter(a => a.qtd > 1).sort((a, b) => b.qtd - a.qtd),
      alunosSobrepeso: alertasNutricionais,
      gruposSaude: {
        acessibilidade: pastas.filter(p => p.pcd === "Sim" || p.acessibilidade === "Sim"),
        alergias: pastas.filter(p => p.alergia === "Sim"),
        cronicos: pastas.filter(p => p.doencaCronica === "Sim"),
        restricaoAlimentar: pastas.filter(p => p.restricaoAlimentar === "Sim")
      }
    };
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const qAtend = query(collection(db, "atendimentos_enfermagem"), where("dataAtendimento", ">=", periodo.inicio), where("dataAtendimento", "<=", periodo.fim));
      const qPastas = query(collection(db, "pastas_digitais"));
      const [snapAtend, snapPastas] = await Promise.all([getDocs(qAtend), getDocs(qPastas)]);
      
      const listaAtend = snapAtend.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const listaPastas = snapPastas.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setDados(processarMetricas(listaAtend, listaPastas));
      toast.success("Dados sincronizados");
    } catch (error) {
      toast.error("Erro na busca");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? 'bg-[#050B18] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-right" />
      <div className="mb-8 flex justify-between items-start">
        <div>
          <button onClick={onVoltar} className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase mb-2 hover:translate-x-[-4px] transition-transform">
            <ArrowLeft size={14}/> Voltar ao Início
          </button>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Dashboard <span className="text-blue-600">Auditoria</span>
          </h1>
        </div>
      </div>

      <div className={`p-6 rounded-[30px] border mb-8 ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex gap-3 items-center">
            <input type="date" value={periodo.inicio} onChange={e => setPeriodo({...periodo, inicio: e.target.value})} className={`p-3 rounded-xl font-bold border ${darkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
            <input type="date" value={periodo.fim} onChange={e => setPeriodo({...periodo, fim: e.target.value})} className={`p-3 rounded-xl font-bold border ${darkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
          </div>
          <button onClick={carregarDados} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3">
            {loading ? <Loader2 className="animate-spin" size={18}/> : "Sincronizar"}
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
        {activeTab === 'nutri' && <AbaNutricional alunos={dados.alunosSobrepeso} darkMode={darkMode} />}
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