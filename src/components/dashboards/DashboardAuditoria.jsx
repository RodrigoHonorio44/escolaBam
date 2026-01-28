import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { 
  LayoutDashboard, Scale, Repeat, Search, Loader2, 
  ArrowLeft, Users, History, X, Briefcase, User, Phone, Pill, Activity 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Custom Hook
import useAuditoria from '../hooks/useAuditoria';

// Sub-componentes
import AbaGeral from './AbaGeral';
import AbaNutricional from './AbaNutricional';
import AbaRecidiva from './AbaRecidiva';

// --- COMPONENTE ABA FICHAS MÉDICAS ---
const AbaFichasMedicas = ({ grupos, dadosGerais, darkMode }) => {
  const [subAba, setSubAba] = useState('alergias');
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const itensPorPagina = 8;

  const formatarParaTela = (str) => {
    if (!str || str === "n/i") return "n/i";
    return str.toString().toLowerCase().trim().split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const obterVinculo = (aluno) => {
    const turmaStr = (aluno?.turma || "").toLowerCase();
    const nome = (aluno?.nome || "").toLowerCase();
    if (!turmaStr || turmaStr === "n/i" || turmaStr === "funcionario" || nome.includes("fred barbosa")) {
      return { label: "colaborador", isFunc: true };
    }
    return { label: `turma: ${turmaStr}`, isFunc: false };
  };

  const extrairCondicoes = (aluno) => {
    const tags = [];
    if (aluno?.alergias?.possui === "sim") tags.push(`alergia: ${aluno.alergias.detalhes}`);
    if (aluno?.asma?.possui === "sim") tags.push(`asma: ${aluno.asma.detalhes || 'ativa'}`);
    if (aluno?.diabetes?.possui === "sim") tags.push(`diabetes: ${aluno.diabetes.tipo || ''}`);
    if (aluno?.diagnosticoNeuro?.detalhes) tags.push(`neuro: ${aluno.diagnosticoNeuro.detalhes}`);
    if (aluno?.pcdStatus?.detalhes) tags.push(`pcd: ${aluno.pcdStatus.detalhes}`);
    if (aluno?.problemaVisao === "sim") tags.push("usa óculos");
    if (aluno?.restricoesAlimentares?.possui === "sim") tags.push(`dieta: ${aluno.restricoesAlimentares.detalhes}`);
    return tags.length > 0 ? tags : ["sem observações"];
  };

  const categorias = [
    { id: 'alergias', label: 'Alergias', dados: grupos?.alergias || [] },
    { id: 'acessibilidade', label: 'PCD / Neuro', dados: grupos?.acessibilidade || [] },
    { id: 'cronicos', label: 'Crônicos', dados: grupos?.cronicos || [] },
    { id: 'restricao', label: 'Alimentar', dados: grupos?.restricaoAlimentar || [] },
  ];

  const categoriaAtual = categorias.find(c => c.id === subAba);
  const dadosFiltrados = (categoriaAtual?.dados || []).filter(aluno => 
    (aluno.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
    (aluno.turma || "").toLowerCase().includes(busca.toLowerCase())
  );

  const dadosExibidos = dadosFiltrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  return (
    <div className="space-y-6">
      {/* MODAL HISTÓRICO (Omitido para brevidade, mas mantido no seu código original) */}
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {categorias.map(cat => (
            <button key={cat.id} onClick={() => { setSubAba(cat.id); setPagina(1); }}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                subAba === cat.id ? 'bg-rose-600 text-white shadow-lg' : darkMode ? 'bg-white/5 text-slate-400' : 'bg-white text-slate-600 border'
              }`}>
              {cat.label} [{cat.dados.length}]
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-2xl text-xs font-bold border outline-none ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-200'}`} />
        </div>
      </div>

      <div className={`rounded-[40px] border overflow-hidden ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200'}`}>
        <table className="w-full text-left">
          <thead>
            <tr className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
              <th className="p-8">identificação</th>
              <th className="p-8">condições clínicas</th>
              <th className="p-8 text-right">ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {dadosExibidos.map((aluno, idx) => (
              <tr key={idx} className="hover:bg-blue-600/5 transition-all">
                <td className="p-8">
                  <div className={`font-black italic text-base mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{formatarParaTela(aluno.nome)}</div>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[9px] font-black uppercase border border-blue-500/10">
                    {obterVinculo(aluno).label}
                  </span>
                </td>
                <td className="p-8">
                  <div className="flex flex-wrap gap-2 max-w-sm">
                    {extrairCondicoes(aluno).map((tag, i) => (
                      <span key={i} className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${darkMode ? 'bg-white/5 text-slate-400 border-white/5' : 'bg-slate-50 text-slate-500'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-8 text-right">
                   <button onClick={() => setAlunoSelecionado(aluno)} className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                    <History size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- COMPONENTE DASHBOARD PRINCIPAL ---
const DashboardAuditoria = ({ onVoltar, darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [rawData, setRawData] = useState({ atendimentos: [], alunos: [] });
  const [periodo, setPeriodo] = useState({
    inicio: new Date().toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });

  const dados = useAuditoria(rawData.atendimentos, rawData.alunos, periodo);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [snapQuest, snapAtend, snapPastas] = await Promise.all([
        getDocs(collection(db, "questionarios_saude")),
        getDocs(collection(db, "atendimentos_enfermagem")),
        getDocs(collection(db, "pastas_digitais"))
      ]);

      const mapaAlunos = {};
      
      // Padronização dos alunos para o Hook processar
      [...snapQuest.docs, ...snapPastas.docs].forEach(doc => {
        const d = doc.data();
        const id = d.pacienteId || d.uid || doc.id;
        mapaAlunos[id] = { 
          ...mapaAlunos[id], 
          ...d, 
          pacienteId: id,
          nome: (d.alunoNome || d.nome || "").toLowerCase().trim(),
          turma: (d.turma || "n/i").toLowerCase().trim()
        };
      });

      // Padronização dos atendimentos (importante para o useAuditoria)
      const atendimentos = snapAtend.docs.map(doc => {
        const d = doc.data();
        return {
          ...d,
          id: doc.id,
          // Garante campos que o hook usa para contar
          alunoNome: (d.alunoNome || d.nomePaciente || "").toLowerCase().trim(),
          // Garante que a data esteja legível para o filtro
          data: d.data || new Date().toISOString().split('T')[0]
        };
      });

      setRawData({ atendimentos, alunos: Object.values(mapaAlunos) });
      toast.success("Dados Sincronizados");
    } catch (error) {
      console.error(error);
      toast.error("Erro na carga de dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  return (
    <div className={`min-h-screen p-6 transition-all ${darkMode ? 'bg-[#050B18] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-right" />
      <div className="mb-8 flex justify-between items-start">
        <div>
          <button onClick={onVoltar} className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase mb-2">
            <ArrowLeft size={14}/> Voltar
          </button>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Audit <span className="text-blue-600">AlertaSaúde</span></h1>
        </div>
      </div>

      <div className="flex gap-2 mb-10 overflow-x-auto">
        <Tab icon={<LayoutDashboard size={14}/>} label="Indicadores" active={activeTab === 'geral'} onClick={() => setActiveTab('geral')} />
        <Tab icon={<Users size={14}/>} label="Fichas Médicas" active={activeTab === 'fichas'} onClick={() => setActiveTab('fichas')} />
        <Tab icon={<Scale size={14}/>} label="IMC Nutri" active={activeTab === 'nutri'} onClick={() => setActiveTab('nutri')} />
        <Tab icon={<Repeat size={14}/>} label="Recidiva" active={activeTab === 'recidiva'} onClick={() => setActiveTab('recidiva')} />
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4">
          {activeTab === 'geral' && <AbaGeral dados={dados} darkMode={darkMode} />}
          {activeTab === 'fichas' && <AbaFichasMedicas grupos={dados?.gruposSaude} dadosGerais={dados} darkMode={darkMode} />}
          {activeTab === 'nutri' && <AbaNutricional dados={dados} darkMode={darkMode} />}
          {activeTab === 'recidiva' && <AbaRecidiva dados={dados} darkMode={darkMode} />}
        </div>
      )}
    </div>
  );
};

const Tab = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-500/10 text-slate-400'}`}>
    {icon} {label}
  </button>
);

export default DashboardAuditoria;