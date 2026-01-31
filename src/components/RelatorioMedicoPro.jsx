import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Search, Loader2, ArrowLeft, LayoutDashboard, Scale, Repeat, FileText, ShieldAlert, History, Users } from 'lucide-react';
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
  const [tratativasExistentes, setTratativasExistentes] = useState([]);
  const [enviandoTratativa, setEnviandoTratativa] = useState(false);
  
  const [dadosLocais, setDadosLocais] = useState({ 
    atendimentos: [], 
    alunos: [] 
  });

  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });

  // 1. Hook de Auditoria (Mantido como original)
  const { estatisticas, gruposSaude, atendimentos } = useAuditoria(
    dadosLocais.atendimentos,
    dadosLocais.alunos,
    questionariosRaw,
    periodo
  );

  // 2. Lógica de Surtos com Correção de "Não Identificado"
  const surtosProcessados = useMemo(() => {
    if (!estatisticas?.porGrupo) return {};
    const resultado = {};

    Object.entries(estatisticas.porGrupo).forEach(([grupo, info]) => {
      if (info.total >= 3 && grupo.toLowerCase() !== 'nenhum') {
        const pacientes = dadosLocais.atendimentos.filter(a => {
          const termo = grupo.toLowerCase();
          const motivo = (a.motivoAtendimento || a.sintoma || "").toLowerCase();
          const gRisco = (a.grupoRisco || a.grupoSaude || "").toLowerCase();
          const noPeriodo = a.data >= periodo.inicio && a.data <= periodo.fim;
          return (motivo.includes(termo) || gRisco.includes(termo)) && noPeriodo;
        }).map(a => ({
          // Tenta todas as variações de nomes do banco para evitar "Não Identificado"
          nome: (a.nomePaciente || a.nome || a.alunoNome || "aluno não identificado").toLowerCase(),
          turma: (a.turma || "n/d").toLowerCase(),
          data: a.data,
          sintoma: (a.motivoAtendimento || a.sintoma || "").toLowerCase()
        }));
        resultado[grupo] = { ...info, pacientes };
      }
    });
    return resultado;
  }, [estatisticas, dadosLocais.atendimentos, periodo]);

  // 3. Carregamento com Limpeza de Duplicados
  const carregarDadosDoBanco = useCallback(async () => {
    setLoading(true);
    try {
      const [snapAtend, snapPastas, snapQuest, snapTrat] = await Promise.all([
        getDocs(collection(db, "atendimentos_enfermagem")),
        getDocs(collection(db, "pastas_digitais")),
        getDocs(collection(db, "questionarios_saude")),
        getDocs(collection(db, "tratativas_auditoria"))
      ]);

      // Normalização de Atendimentos
      const listaA = snapAtend.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Normalização de Alunos (Pastas Digitais) - EVITA DUPLICAÇÃO NA ABA NUTRICIONAL
      const mapaAlunosUnicos = new Map();
      snapPastas.docs.forEach(doc => {
        const data = doc.data();
        const chave = (data.nomePaciente || data.nome || doc.id).toLowerCase().trim();
        if (!mapaAlunosUnicos.has(chave)) {
          mapaAlunosUnicos.set(chave, { id: doc.id, ...data });
        }
      });

      const listaP = Array.from(mapaAlunosUnicos.values());
      const listaQ = snapQuest.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const listaT = snapTrat.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                       .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setDadosLocais({ atendimentos: listaA, alunos: listaP });
      setQuestionariosRaw(listaQ);
      setTratativasExistentes(listaT);
      
      toast.success("BANCO SINCRONIZADO");
    } catch (error) {
      toast.error("FALHA NA SINCRONIZAÇÃO");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosDoBanco();
  }, [carregarDadosDoBanco]);

  const handleSalvarTratativa = async (e, grupo) => {
    e.preventDefault();
    setEnviandoTratativa(true);
    const formData = new FormData(e.target);
    try {
      await addDoc(collection(db, "tratativas_auditoria"), {
        grupo: grupo.toLowerCase(),
        medida: formData.get('medida').toLowerCase(),
        observacao: formData.get('observacao').toLowerCase(),
        usuarioNome: 'r s',
        periodoInicio: periodo.inicio,
        periodoFim: periodo.fim,
        createdAt: serverTimestamp()
      });
      toast.success("AÇÃO REGISTRADA");
      carregarDadosDoBanco();
    } catch (err) { toast.error("ERRO AO SALVAR"); }
    finally { setEnviandoTratativa(false); }
  };

  const theme = {
    bg: darkMode ? 'bg-[#050B18]' : 'bg-slate-50',
    card: darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200 shadow-sm',
    text: darkMode ? 'text-white' : 'text-slate-900'
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${theme.bg} ${theme.text}`}>
      <Toaster position="top-right" />

      {/* HEADER */}
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

      {/* NAVEGAÇÃO */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className={`flex flex-wrap gap-2 p-2 rounded-[30px] border ${theme.card}`}>
          <TabButton active={activeTab === 'geral'} onClick={() => setActiveTab('geral')} icon={<LayoutDashboard size={16}/>} label="Geral" />
          <TabButton active={activeTab === 'tratativa'} onClick={() => setActiveTab('tratativa')} icon={<ShieldAlert size={16}/>} label="Tratativas" />
          <TabButton active={activeTab === 'fichas'} onClick={() => setActiveTab('fichas')} icon={<FileText size={16}/>} label="Fichas Médicas" />
          <TabButton active={activeTab === 'nutricional'} onClick={() => setActiveTab('nutricional')} icon={<Scale size={16}/>} label="Nutricional" />
          <TabButton active={activeTab === 'reincidencia'} onClick={() => setActiveTab('reincidencia')} icon={<Repeat size={16}/>} label="Reincidência" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-20 text-center opacity-40">
            <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={40} />
            <p className="text-[10px] font-black uppercase">Sincronizando Inteligência...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">   
            {activeTab === 'geral' && <AbaGeral dados={{ estatisticas, gruposSaude }} darkMode={darkMode} />}
            
            {activeTab === 'tratativa' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {Object.entries(surtosProcessados).map(([grupo, dados]) => (
                    <div key={grupo} className={`p-8 rounded-[40px] border-2 border-rose-500/20 ${theme.card}`}>
                      <div className="flex justify-between items-start mb-6">
                        <h4 className="text-3xl font-black uppercase italic text-rose-500">{grupo}</h4>
                        <span className="text-xl font-black bg-rose-500 text-white px-5 py-2 rounded-2xl">{dados.total} casos</span>
                      </div>
                      
                      <div className="mb-6 space-y-2">
                        {dados.pacientes.map((p, idx) => (
                          <div key={idx} className="flex justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase italic">
                            <span>{p.nome}</span>
                            <span className="opacity-40">{p.data}</span>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={(e) => handleSalvarTratativa(e, grupo)} className="space-y-4">
                        <select name="medida" required className={`w-full p-4 rounded-2xl text-[10px] font-black uppercase ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                          <option value="">selecione a medida técnica...</option>
                          <option value="notificacao aos responsaveis">notificação aos responsáveis</option>
                          <option value="isolamento de turma">isolamento de turma</option>
                          <option value="reforco de higienizacao">reforço de higienização</option>
                        </select>
                        <textarea name="observacao" required placeholder="Relatório de conduta técnica..." className={`w-full p-4 rounded-2xl text-[10px] font-bold min-h-[100px] ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                        <button disabled={enviandoTratativa} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl">
                          {enviandoTratativa ? 'GRAVANDO...' : 'REGISTRAR TRATATIVA'}
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase opacity-50 flex items-center gap-2"><History size={14}/> histórico de ações</h3>
                  {tratativasExistentes.map((t, i) => (
                    <div key={i} className={`p-5 rounded-3xl border ${theme.card}`}>
                      <p className="text-[10px] font-black uppercase text-blue-500">{t.grupo}</p>
                      <p className="text-[10px] opacity-70 italic mt-1">"{t.observacao}"</p>
                      <p className="text-[8px] font-black mt-4 opacity-30 uppercase">Validação: {t.usuarioNome}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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