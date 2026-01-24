import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ClipboardPlus, Search, Loader2, ArrowLeft, LayoutDashboard, Scale, Repeat, Users, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Importação das Abas
import AbaGeral from './AbaGeral';
import AbaNutricional from './AbaNutricional';
import AbaRecidiva from './AbaRecidiva';
import AbaFichasMedicas from './AbaFichasMedicas';

const RelatorioMedicoPro = ({ onVoltar, darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [periodo, setPeriodo] = useState({
    inicio: new Date().toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });

  const [dados, setDados] = useState({
    atendimentos: [],
    rankingQueixas: [],
    reincidentes: [],
    totalFebre: 0,
    totalAlergicos: 0,
    tempoMedio: 0
  });

  const [pastasGeral, setPastasGeral] = useState([]);

  // --- Lógica de Normalização de Comparação ---
  const checkStatus = (val) => {
    if (!val) return false;
    const clean = val.toString().toLowerCase().trim();
    return clean === 'sim' || clean === 's';
  };

  // --- Agrupamento de Fichas Médicas (Sincronismo Circular) ---
  const gruposFichas = useMemo(() => {
    return {
      alergias: pastasGeral.filter(p => 
        checkStatus(p.alergia) || checkStatus(p.alunoPossuiAlergia) || (p.qualAlergia && p.qualAlergia !== 'nenhuma')
      ),
      acessibilidade: pastasGeral.filter(p => 
        checkStatus(p.pcd) || p.tipoDeficiencia || p.necessidadesEspeciais?.possui === 'sim'
      ),
      cronicos: pastasGeral.filter(p => 
        checkStatus(p.doencaCronica) || p.diabetes?.possui === 'sim' || p.epilepsia?.possui === 'sim'
      ),
      restricaoAlimentar: pastasGeral.filter(p => 
        checkStatus(p.restricaoAlimentar) || p.restricoesAlimentares?.possui === 'sim'
      ),
    };
  }, [pastasGeral]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Query de atendimentos no período
      const qAtend = query(
        collection(db, "atendimentos_enfermagem"),
        where("dataAtendimento", ">=", periodo.inicio),
        where("dataAtendimento", "<=", periodo.fim)
      );
      
      const qPastas = query(collection(db, "pastas_digitais"));
      
      const [snapAtend, snapPastas] = await Promise.all([getDocs(qAtend), getDocs(qPastas)]);

      const listaAtendimentos = snapAtend.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const listaPastas = snapPastas.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const contagemQueixas = {};
      const contagemReincidentes = {};
      let febre = 0;
      let somaTempo = 0;

      listaAtendimentos.forEach(atend => {
        // Normalização das queixas para o ranking (Padrão Caio Giromba)
        const queixaNorm = (atend.queixaPrincipal || "não informada").toLowerCase().trim();
        contagemQueixas[queixaNorm] = (contagemQueixas[queixaNorm] || 0) + 1;
        
        // Chave única por paciente para evitar conflito de nomes
        const pId = atend.pacienteId || atend.nomePaciente.toLowerCase().trim();
        
        if (!contagemReincidentes[pId]) {
          contagemReincidentes[pId] = { 
            nome: atend.nomePaciente.toLowerCase(), 
            turma: (atend.turma || "n/a").toLowerCase(), 
            qtd: 0, 
            queixas: [] 
          };
        }
        contagemReincidentes[pId].qtd++;
        contagemReincidentes[pId].queixas.push(atend.queixaPrincipal);

        if (parseFloat(atend.temperatura) >= 37.5) febre++;
        somaTempo += parseInt(atend.tempoDuracao) || 0;
      });

      setPastasGeral(listaPastas);
      setDados({
        atendimentos: listaAtendimentos,
        rankingQueixas: Object.entries(contagemQueixas).sort((a, b) => b[1] - a[1]),
        reincidentes: Object.values(contagemReincidentes).filter(a => a.qtd > 1).sort((a,b) => b.qtd - a.qtd),
        totalFebre: febre,
        totalAlergicos: listaPastas.filter(p => checkStatus(p.alunoPossuiAlergia) || checkStatus(p.alergia)).length,
        tempoMedio: listaAtendimentos.length > 0 ? (somaTempo / listaAtendimentos.length).toFixed(0) : 0
      });

      toast.success("DADOS SINCRONIZADOS");
    } catch (error) {
      console.error(error);
      toast.error("FALHA NA SINCRONIZAÇÃO");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const theme = {
    bg: darkMode ? 'bg-[#050B18]' : 'bg-slate-50',
    card: darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200 shadow-sm',
    text: darkMode ? 'text-white' : 'text-slate-900'
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <button onClick={onVoltar} className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest mb-4 hover:gap-4 transition-all">
            <ArrowLeft size={16} /> Painel Principal
          </button>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Auditoria <span className="text-blue-600 underline">Intelligence</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={periodo.inicio} 
              onChange={e => setPeriodo({...periodo, inicio: e.target.value})}
              className={`p-3 rounded-xl text-[10px] font-black border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`}
            />
            <input 
              type="date" 
              value={periodo.fim} 
              onChange={e => setPeriodo({...periodo, fim: e.target.value})}
              className={`p-3 rounded-xl text-[10px] font-black border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`}
            />
            <button onClick={carregarDados} className="p-4 bg-blue-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            </button>
        </div>
      </div>

      {/* Abas */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className={`flex flex-wrap gap-2 p-2 rounded-[30px] border ${theme.card}`}>
          <TabButton active={activeTab === 'geral'} onClick={() => setActiveTab('geral')} icon={<LayoutDashboard size={16}/>} label="Dashboard" />
          <TabButton active={activeTab === 'fichas'} onClick={() => setActiveTab('fichas')} icon={<FileText size={16}/>} label="Fichas Médicas" />
          <TabButton active={activeTab === 'nutricional'} onClick={() => setActiveTab('nutricional')} icon={<Scale size={16}/>} label="Nutricional" />
          <TabButton active={activeTab === 'reincidencia'} onClick={() => setActiveTab('reincidencia')} icon={<Repeat size={16}/>} label="Reincidência" />
        </div>
      </div>

      {/* Conteúdo dinâmico */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-32 text-center">
             <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={40} />
             <p className="opacity-30 font-black uppercase italic tracking-[5px] text-xs">Mapeando Prontuários...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === 'geral' && <AbaGeral dados={dados} darkMode={darkMode} />}
            {activeTab === 'fichas' && <AbaFichasMedicas grupos={gruposFichas} darkMode={darkMode} />}
            {activeTab === 'nutricional' && <AbaNutricional pastas={pastasGeral} darkMode={darkMode} />}
            {activeTab === 'reincidencia' && <AbaRecidiva dados={dados} darkMode={darkMode} />}
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
      ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-105' : 'text-slate-500 hover:bg-blue-500/5'}`}
  >
    {icon} {label}
  </button>
);

export default RelatorioMedicoPro;