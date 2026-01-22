import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, query, where, getDocs, orderBy 
} from 'firebase/firestore';
import { 
  ClipboardPlus, Activity, Users, AlertTriangle, 
  Printer, Search, Loader2, Thermometer, ArrowLeft, 
  HeartPulse, Clock, Scale, Repeat, LayoutDashboard,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const RelatorioMedicoPro = ({ onVoltar, darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [buscaSaude, setBuscaSaude] = useState("");
  const [paginaPcd, setPaginaPcd] = useState(1);
  const [paginaAlergia, setPaginaAlergia] = useState(1);
  const [paginaCronico, setPaginaCronico] = useState(1);
  const [paginaRestricao, setPaginaRestricao] = useState(1);
  
  const itensPorPagina = 6;

  const [dados, setDados] = useState({
    atendimentos: [],
    rankingAlunos: [],
    rankingQueixas: [],
    totalFebre: 0,
    tempoMedio: 0,
    reincidentes: [],
    alunosSobrepeso: [],
    gruposSaude: {
      acessibilidade: [],
      alergias: [],
      cronicos: [],
      restricaoAlimentar: []
    }
  });

  const [periodo, setPeriodo] = useState({
    inicio: new Date().toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });

  const processarRelatorio = async () => {
    setLoading(true);
    try {
      const qAtend = query(
        collection(db, "atendimentos_enfermagem"), 
        where("dataAtendimento", ">=", periodo.inicio),
        where("dataAtendimento", "<=", periodo.fim),
        orderBy("dataAtendimento", "desc")
      );

      const qPastas = query(collection(db, "pastas_digitais"));
      const [snapAtend, snapPastas] = await Promise.all([getDocs(qAtend), getDocs(qPastas)]);

      const listaAtendimentos = snapAtend.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const listaPastas = snapPastas.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let somaMinutos = 0;
      let febre = 0;
      const contagemAlunos = {};
      const contagemQueixas = {};

      listaAtendimentos.forEach(item => {
        const nome = (item.nomePaciente || "NÃO INFORMADO").toUpperCase();
        const id = item.pacienteId || nome;
        if (!contagemAlunos[id]) {
          contagemAlunos[id] = { nome, qtd: 0, queixas: [], turma: item.turma };
        }
        contagemAlunos[id].qtd += 1;
        contagemAlunos[id].queixas.push(item.queixaPrincipal || "Outros");
        contagemQueixas[item.queixaPrincipal || "OUTROS"] = (contagemQueixas[item.queixaPrincipal || "OUTROS"] || 0) + 1;
        
        // Cálculo do tempo
        const tempo = parseInt(item.tempoDuracao) || 0;
        somaMinutos += tempo;
        
        if (parseFloat(item.temperatura) >= 37.5) febre++;
      });

      const grupos = {
        acessibilidade: listaPastas.filter(p => p.pcd === "Sim" || p.acessibilidade === "Sim"),
        alergias: listaPastas.filter(p => p.alergia === "Sim"),
        cronicos: listaPastas.filter(p => p.doencaCronica === "Sim"),
        restricaoAlimentar: listaPastas.filter(p => p.restricaoAlimentar === "Sim")
      };

      const sobrepeso = listaPastas.filter(p => {
        const peso = parseFloat(p.peso);
        const altura = parseFloat(p.altura);
        if (peso > 0 && altura > 0) {
          const h = altura > 3 ? altura / 100 : altura;
          return (peso / (h * h)) >= 25; 
        }
        return false;
      });

      setDados({
        atendimentos: listaAtendimentos,
        rankingAlunos: Object.values(contagemAlunos).sort((a, b) => b.qtd - a.qtd),
        rankingQueixas: Object.entries(contagemQueixas).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd),
        totalFebre: febre,
        tempoMedio: listaAtendimentos.length > 0 ? (somaMinutos / listaAtendimentos.length).toFixed(1) : 0,
        reincidentes: Object.values(contagemAlunos).filter(a => a.qtd > 1).sort((a,b) => b.qtd - a.qtd),
        alunosSobrepeso: sobrepeso,
        gruposSaude: grupos
      });

      toast.success("DADOS SINCRONIZADOS");
    } catch (error) {
      console.error(error);
      toast.error("ERRO NA CONSULTA");
    } finally {
      setLoading(false);
    }
  };

  const filtrarPorNome = (lista) => lista.filter(a => a.nome?.toLowerCase().includes(buscaSaude.toLowerCase()));

  const theme = {
    card: darkMode ? "bg-[#0A1629] border-white/5 text-white" : "bg-white border-slate-100 text-slate-900",
    input: darkMode ? "bg-[#050B18] text-white border-white/10" : "bg-slate-50 text-slate-900 border-slate-200",
    tabActive: "bg-blue-600 text-white shadow-lg shadow-blue-600/20",
    tabInactive: darkMode ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-slate-100"
  };

  return (
    <div className="w-full min-h-screen p-4 md:p-8 animate-in fade-in duration-700">
      <Toaster position="top-right" />
      
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
        <div>
          <button onClick={onVoltar} className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest mb-4 hover:gap-4 transition-all">
            <ArrowLeft size={16} /> Voltar ao Sistema
          </button>
          <h1 className={`text-4xl font-black uppercase italic tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Auditoria <span className="text-blue-600">Intelligence</span>
          </h1>
        </div>
        <button onClick={() => window.print()} className="p-5 bg-slate-900 text-white rounded-3xl hover:bg-blue-600 transition-all shadow-xl print:hidden">
          <Printer size={20} />
        </button>
      </div>

      <div className={`print:hidden mb-8 p-6 rounded-[40px] border shadow-2xl shadow-black/5 ${theme.card}`}>
        <div className="flex flex-wrap items-end gap-6 mb-8">
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-[9px] font-black opacity-40 uppercase tracking-widest ml-2">Início</label>
            <input type="date" value={periodo.inicio} onChange={e => setPeriodo({...periodo, inicio: e.target.value})} className={`w-full p-4 rounded-2xl font-bold outline-none border transition-all ${theme.input}`} />
          </div>
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-[9px] font-black opacity-40 uppercase tracking-widest ml-2">Fim</label>
            <input type="date" value={periodo.fim} onChange={e => setPeriodo({...periodo, fim: e.target.value})} className={`w-full p-4 rounded-2xl font-bold outline-none border transition-all ${theme.input}`} />
          </div>
          <button onClick={processarRelatorio} disabled={loading} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-blue-500/20">
            {loading ? <Loader2 className="animate-spin" /> : <><Search size={18}/> Analisar</>}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl">
          <TabBtn id="geral" label="Visão Geral" icon={<LayoutDashboard size={14}/>} active={activeTab} setActive={setActiveTab} theme={theme} />
          <TabBtn id="saude" label="Triagem de Saúde" icon={<Users size={14}/>} active={activeTab} setActive={setActiveTab} theme={theme} />
          <TabBtn id="biometria" label="Biometria" icon={<Scale size={14}/>} active={activeTab} setActive={setActiveTab} theme={theme} />
          <TabBtn id="reincidencia" label="Reincidência" icon={<Repeat size={14}/>} active={activeTab} setActive={setActiveTab} theme={theme} />
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'geral' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {/* GRID DE CARDS ATUALIZADO COM TEMPO MÉDIO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Atendimentos" value={dados.atendimentos.length} icon={<Activity />} color="blue" darkMode={darkMode} />
              <StatCard title="Sobrepeso" value={dados.alunosSobrepeso.length} icon={<Scale />} color="orange" darkMode={darkMode} />
              <StatCard title="Casos Febre" value={dados.totalFebre} icon={<Thermometer />} color="emerald" darkMode={darkMode} />
              <StatCard title="Alérgicos" value={dados.gruposSaude.alergias.length} icon={<AlertTriangle />} color="rose" darkMode={darkMode} />
              <StatCard title="Tempo Médio" value={`${dados.tempoMedio}m`} icon={<Clock />} color="blue" darkMode={darkMode} />
            </div>
            
            <div className={`mt-8 p-8 rounded-[45px] border ${theme.card}`}>
                <h3 className="text-xs font-black uppercase mb-8 flex items-center gap-3 italic opacity-40">
                   <Users size={18} className="text-blue-500" /> Frequência de Alunos no Período
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dados.rankingAlunos.slice(0, 6).map((aluno, idx) => (
                      <div key={idx} className="flex justify-between items-center p-5 rounded-3xl bg-slate-400/5 border border-transparent hover:border-blue-500/30 transition-all">
                        <span className="text-[11px] font-black uppercase italic">{aluno.nome}</span>
                        <span className="text-[10px] font-black text-blue-500">{aluno.qtd} ATENDIMENTOS</span>
                      </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'saude' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className={`p-4 rounded-3xl border flex items-center gap-4 ${theme.card}`}>
              <Search className="text-blue-500" size={20} />
              <input 
                type="text" 
                placeholder="Buscar aluno por nome em todas as listas..." 
                className="bg-transparent border-none outline-none font-bold text-xs w-full uppercase"
                value={buscaSaude}
                onChange={(e) => { setBuscaSaude(e.target.value); setPaginaPcd(1); setPaginaAlergia(1); setPaginaCronico(1); setPaginaRestricao(1); }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SaudeTable title="Acessibilidade / PCD" data={filtrarPorNome(dados.gruposSaude.acessibilidade)} darkMode={darkMode} pagina={paginaPcd} setPagina={setPaginaPcd} itensPorPagina={itensPorPagina} color="blue" />
              <SaudeTable title="Alunos com Alergia" data={filtrarPorNome(dados.gruposSaude.alergias)} darkMode={darkMode} pagina={paginaAlergia} setPagina={setPaginaAlergia} itensPorPagina={itensPorPagina} color="rose" />
              <SaudeTable title="Doenças Crônicas" data={filtrarPorNome(dados.gruposSaude.cronicos)} darkMode={darkMode} pagina={paginaCronico} setPagina={setPaginaCronico} itensPorPagina={itensPorPagina} color="orange" />
              <SaudeTable title="Restrição Alimentar" data={filtrarPorNome(dados.gruposSaude.restricaoAlimentar)} darkMode={darkMode} pagina={paginaRestricao} setPagina={setPaginaRestricao} itensPorPagina={itensPorPagina} color="emerald" />
            </div>
          </div>
        )}

        {activeTab === 'biometria' && (
          <div className={`p-8 rounded-[45px] border ${theme.card} animate-in zoom-in-95`}>
            <h3 className="text-xs font-black uppercase mb-8 opacity-40">Monitoramento Biométrico (Sobrepeso)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dados.alunosSobrepeso.map((aluno, idx) => (
                <div key={idx} className="p-5 rounded-3xl bg-orange-500/5 border border-orange-500/10 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase italic">{aluno.nome}</p>
                    <p className="text-[8px] opacity-50 uppercase">Turma {aluno.turma}</p>
                  </div>
                  <div className="text-right font-black text-orange-600 text-[10px]">{aluno.peso}kg</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reincidencia' && (
          <div className={`p-8 rounded-[45px] border ${theme.card} animate-in slide-in-from-right-4`}>
             <h3 className="text-xs font-black uppercase mb-8 opacity-40 italic">Fluxo de Reincidência de Atendimentos</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {dados.reincidentes.map((aluno, idx) => (
                  <div key={idx} className="p-5 rounded-3xl bg-rose-500/5 border border-rose-500/10">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[8px] font-black opacity-40 uppercase">T. {aluno.turma}</span>
                       <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg">{aluno.qtd}x</span>
                    </div>
                    <p className="text-[10px] font-black uppercase italic truncate">{aluno.nome}</p>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SaudeTable = ({ title, data, darkMode, pagina, setPagina, itensPorPagina, color }) => {
  const totalPaginas = Math.ceil(data.length / itensPorPagina);
  const inicio = (pagina - 1) * itensPorPagina;
  const exibidos = data.slice(inicio, inicio + itensPorPagina);

  const colors = {
    blue: "text-blue-500",
    rose: "text-rose-500",
    orange: "text-orange-500",
    emerald: "text-emerald-500"
  };

  return (
    <div className={`p-6 rounded-[40px] border flex flex-col min-h-[450px] ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-[10px] font-black uppercase tracking-widest italic ${colors[color]}`}>{title} ({data.length})</h3>
        <div className="flex gap-1">
          <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="p-2 rounded-xl bg-black/5 hover:bg-blue-600 hover:text-white disabled:opacity-10"><ChevronLeft size={14} /></button>
          <button disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)} className="p-2 rounded-xl bg-black/5 hover:bg-blue-600 hover:text-white disabled:opacity-10"><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {exibidos.length > 0 ? exibidos.map((aluno, i) => (
          <div key={i} className={`p-4 rounded-2xl border transition-all hover:bg-blue-600/5 ${darkMode ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50'}`}>
            <div className="flex justify-between items-center">
              <div className="max-w-[70%]">
                <p className="text-[10px] font-black uppercase italic truncate">{aluno.nome}</p>
                <p className="text-[8px] font-bold opacity-50 uppercase tracking-tighter">Idade: {aluno.idade || '--'} • Turma: {aluno.turma || 'N/I'}</p>
              </div>
              <span className={`text-[8px] font-black px-2 py-1 rounded-md bg-white/10 ${colors[color]}`}>INFO</span>
            </div>
          </div>
        )) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic">
            <Users size={40} className="mb-2" />
            <p className="text-[9px] font-black uppercase">Nenhum Registro</p>
          </div>
        )}
      </div>
      
      {totalPaginas > 1 && (
        <div className="mt-4 pt-4 border-t border-white/5 text-[8px] font-black opacity-30 text-right uppercase">
          Página {pagina} de {totalPaginas}
        </div>
      )}
    </div>
  );
};

const TabBtn = ({ id, label, icon, active, setActive, theme }) => (
  <button
    onClick={() => setActive(id)}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
      active === id ? theme.tabActive : theme.tabInactive
    }`}
  >
    {icon} {label}
  </button>
);

const StatCard = ({ title, value, icon, color, darkMode }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20",
    orange: "text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20",
    rose: "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"
  };

  return (
    <div className={`p-6 rounded-[40px] border shadow-sm transition-all hover:scale-105 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100"}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <h2 className={`text-2xl font-black italic leading-none mb-2 truncate ${darkMode ? "text-white" : "text-slate-900"}`}>
        {value}
      </h2>
      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{title}</p>
    </div>
  );
};

export default RelatorioMedicoPro;