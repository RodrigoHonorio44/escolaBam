import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  LayoutDashboard, Scale, Repeat, Search, Loader2, 
  ArrowLeft, Users, ChevronLeft, ChevronRight, History, X 
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

  // Mapeamento dinâmico baseado no retorno do Hook
  const categorias = [
    { id: 'alergias', label: 'Alergias', dados: grupos?.alergias || [] },
    { id: 'acessibilidade', label: 'Acessibilidade / PCD', dados: grupos?.acessibilidade || [] },
    { id: 'cronicos', label: 'Doenças Crônicas', dados: grupos?.cronicos || [] },
    { id: 'restricao', label: 'Restrição Alimentar', dados: grupos?.restricaoAlimentar || [] },
  ];

  const formatarParaTela = (str) => {
    if (!str) return "n/i";
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const categoriaAtual = categorias.find(c => c.id === subAba);
  const dadosFiltrados = (categoriaAtual?.dados || []).filter(aluno => 
    (aluno.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
    (aluno.turma || "").toLowerCase().includes(busca.toLowerCase())
  );

  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  const dadosExibidos = dadosFiltrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  const historicoAluno = alunoSelecionado 
    ? (dadosGerais?.atendimentos || []).filter(a => 
        (a.pacienteId === alunoSelecionado.pacienteId) || 
        (a.alunoNome?.toLowerCase() === (alunoSelecionado.nome || "").toLowerCase())
      )
    : [];

  const renderDetalhesTecnicos = (aluno) => {
    if (subAba === 'alergias') return aluno.detalheAlergia || aluno.alergias?.detalhes || "sim";
    if (subAba === 'restricao') return aluno.restricoesAlimentares?.detalhes || "restrição registrada";
    if (subAba === 'acessibilidade') return aluno.pcdStatus?.detalhes || aluno.pcdStatus?.qual || "pcd";
    if (subAba === 'cronicos') return aluno.medicacaoContinua || "monitoramento ativo";
    return "--";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* MODAL DE HISTÓRICO */}
      {alunoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border ${darkMode ? 'bg-[#0A1629] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="p-8 flex justify-between items-center border-b border-white/5 bg-rose-600">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Histórico de Atendimentos</p>
                <h3 className="text-xl font-black text-white italic">{formatarParaTela(alunoSelecionado.nome)}</h3>
              </div>
              <button onClick={() => setAlunoSelecionado(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {historicoAluno.length > 0 ? historicoAluno.map((atend, i) => (
                <div key={i} className={`p-5 rounded-3xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase text-rose-500">{atend.data}</span>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[9px] font-bold uppercase">{atend.motivoAtendimento}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{atend.procedimentos || "Sem detalhes registrados"}</p>
                </div>
              )) : (
                <div className="py-10 text-center opacity-30">
                  <History className="mx-auto mb-3" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-[3px]">Nenhum atendimento neste período</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CABEÇALHO DA TABELA (BUSCA E ABAS) */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSubAba(cat.id); setPagina(1); }}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                subAba === cat.id 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                  : darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-white text-slate-600 border border-slate-200'
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
            placeholder="Buscar aluno..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            className={`w-full pl-12 pr-4 py-3 rounded-xl text-xs font-bold border outline-none transition-all ${
              darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'
            }`}
          />
        </div>
      </div>

      {/* TABELA DE ALUNOS */}
      <div className={`rounded-[35px] border overflow-hidden ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                <th className="p-6">Aluno</th>
                <th className="p-6 text-center">Turma</th>
                <th className="p-6">Detalhes</th>
                <th className="p-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dadosExibidos.map((aluno, idx) => (
                <tr key={idx} className={`hover:bg-blue-600/5 transition-colors ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                  <td className="p-6">
                    <div className="font-bold italic text-sm">{formatarParaTela(aluno.nome)}</div>
                    <div className="text-[10px] opacity-40">{aluno.idade} anos | {aluno.sexo || "n/i"}</div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[9px] font-black uppercase">
                      {aluno.turma}
                    </span>
                  </td>
                  <td className="p-6 text-[10px] opacity-70 max-w-[200px] truncate">
                    {renderDetalhesTecnicos(aluno)}
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => setAlunoSelecionado(aluno)}
                      className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <History size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      // Busca em todas as coleções relevantes enviadas no log
      const [snapQuest, snapAtend, snapPastas] = await Promise.all([
        getDocs(collection(db, "questionarios_saude")),
        getDocs(collection(db, "atendimentos_enfermagem")),
        getDocs(collection(db, "pastas_digitais"))
      ]);

      // Consolida dados dos alunos (Questionários + Pastas Digitais)
      const mapaAlunos = {};

      [...snapQuest.docs, ...snapPastas.docs].forEach(doc => {
        const d = doc.data();
        const id = d.pacienteId || d.id || doc.id;
        
        mapaAlunos[id] = {
          ...mapaAlunos[id],
          ...d,
          pacienteId: id,
          nome: (d.alunoNome || d.nome || "").toLowerCase().trim(),
          turma: (d.turma || "").toLowerCase().trim()
        };
      });

      const atendimentos = snapAtend.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        alunoNome: (doc.data().alunoNome || doc.data().nomePaciente || "").toLowerCase().trim()
      }));

      setRawData({ 
        atendimentos, 
        alunos: Object.values(mapaAlunos) 
      });

      toast.success("Banco de Dados Sincronizado");
    } catch (error) {
      console.error(error);
      toast.error("Erro na conexão com Firebase");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? 'bg-[#050B18] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <button onClick={onVoltar} className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase mb-2 hover:translate-x-[-4px] transition-all">
            <ArrowLeft size={14}/> Voltar ao Sistema
          </button>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Audit <span className="text-blue-600">AlertaSaúde</span>
          </h1>
        </div>
      </div>

      {/* FILTROS */}
      <div className={`p-6 rounded-[30px] border mb-8 ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase opacity-40 ml-2">Início</label>
              <input type="date" value={periodo.inicio} onChange={e => setPeriodo({...periodo, inicio: e.target.value})} className={`p-3 block rounded-xl font-bold border outline-none ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-200'}`} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase opacity-40 ml-2">Fim</label>
              <input type="date" value={periodo.fim} onChange={e => setPeriodo({...periodo, fim: e.target.value})} className={`p-3 block rounded-xl font-bold border outline-none ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-200'}`} />
            </div>
          </div>
          <button onClick={carregarDados} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all">
            {loading ? <Loader2 className="animate-spin" size={18}/> : "Atualizar Dados"}
          </button>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
        <Tab icon={<LayoutDashboard size={14}/>} label="Indicadores" active={activeTab === 'geral'} onClick={() => setActiveTab('geral')} />
        <Tab icon={<Users size={14}/>} label="Fichas Médicas" active={activeTab === 'fichas'} onClick={() => setActiveTab('fichas')} />
        <Tab icon={<Scale size={14}/>} label="IMC Nutri" active={activeTab === 'nutri'} onClick={() => setActiveTab('nutri')} />
        <Tab icon={<Repeat size={14}/>} label="Recidiva" active={activeTab === 'recidiva'} onClick={() => setActiveTab('recidiva')} />
      </div>

      {/* CONTEÚDO */}
      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
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
  <button onClick={onClick} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'}`}>
    {icon} {label}
  </button>
);

export default DashboardAuditoria;