import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Search, Loader2, ArrowLeft, LayoutDashboard, Scale, Repeat, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import useAuditoria from '../hooks/useAuditoria'; 
import AbaGeral from './AbaGeral';
import AbaNutricional from './AbaNutricional';
import AbaRecidiva from './AbaRecidiva';
import AbaFichasMedicas from './AbaFichasMedicas';

const RelatorioMedicoPro = ({ onVoltar, darkMode, user, atendimentosRaw = [], alunosRaw = [] }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [questionariosRaw, setQuestionariosRaw] = useState([]);
  
  const [dadosLocais, setDadosLocais] = useState({ 
    atendimentos: [], 
    alunos: [] 
  });

  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });

  // 1. Hook de Auditoria
  const { estatisticas, gruposSaude } = useAuditoria(
    dadosLocais.atendimentos,
    dadosLocais.alunos,
    questionariosRaw,
    periodo
  );

  // 2. Carregamento de Dados
  const carregarDadosDoBanco = useCallback(async () => {
    setLoading(true);
    try {
      const [snapAtend, snapPastas, snapQuest] = await Promise.all([
        getDocs(collection(db, "atendimentos_enfermagem")),
        getDocs(collection(db, "pastas_digitais")),
        getDocs(collection(db, "questionarios_saude"))
      ]);

      setDadosLocais({ 
        atendimentos: snapAtend.docs.map(doc => ({ id: doc.id, ...doc.data() })), 
        alunos: snapPastas.docs.map(doc => ({ id: doc.id, ...doc.data() })) 
      });
      setQuestionariosRaw(snapQuest.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
    } catch (error) {
      toast.error("FALHA NA SINCRONIZAÇÃO");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosDoBanco();
  }, [carregarDadosDoBanco]);

  const theme = {
    bg: darkMode ? 'bg-[#050B18]' : 'bg-slate-50',
    card: darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200 shadow-sm',
    text: darkMode ? 'text-white' : 'text-slate-900'
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${theme.bg} ${theme.text}`}>
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <button onClick={onVoltar} className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase mb-4">
            <ArrowLeft size={16} /> Painel Principal
          </button>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Auditoria <span className="text-blue-600">Intelligence</span>
          </h1>
        </div>
        <div className="flex gap-3">
            <input type="date" value={periodo.inicio} onChange={e => setPeriodo({...periodo, inicio: e.target.value})} className={`p-3 rounded-xl text-[10px] font-black border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`} />
            <input type="date" value={periodo.fim} onChange={e => setPeriodo({...periodo, fim: e.target.value})} className={`p-3 rounded-xl text-[10px] font-black border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`} />
            <button onClick={carregarDadosDoBanco} className="p-4 bg-blue-600 text-white rounded-xl">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-10">
        <div className={`flex flex-wrap gap-2 p-2 rounded-[30px] border ${theme.card}`}>
          <TabButton active={activeTab === 'geral'} onClick={() => setActiveTab('geral')} icon={<LayoutDashboard size={16}/>} label="Geral" />
          <TabButton active={activeTab === 'fichas'} onClick={() => setActiveTab('fichas')} icon={<FileText size={16}/>} label="Fichas Médicas" />
          <TabButton active={activeTab === 'nutricional'} onClick={() => setActiveTab('nutricional')} icon={<Scale size={16}/>} label="Nutricional" />
          <TabButton active={activeTab === 'reincidencia'} onClick={() => setActiveTab('reincidencia')} icon={<Repeat size={16}/>} label="Reincidência" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-20 text-center opacity-40">
            <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={40} />
            <p className="text-[10px] font-black uppercase">Sincronizando...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">   
            {activeTab === 'geral' && <AbaGeral dados={{ estatisticas, gruposSaude }} darkMode={darkMode} />}
            {activeTab === 'fichas' && <AbaFichasMedicas grupos={gruposSaude} darkMode={darkMode} />}
            {activeTab === 'nutricional' && <AbaNutricional pastas={dadosLocais.alunos} darkMode={darkMode} />}
            {activeTab === 'reincidencia' && <AbaRecidiva dados={estatisticas} darkMode={darkMode} />}
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${active ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:bg-blue-500/5'}`}>
    {icon} {label}
  </button>
);

export default RelatorioMedicoPro;