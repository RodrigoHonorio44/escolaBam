import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, query, where, getDocs, orderBy 
} from 'firebase/firestore';
import { 
  ClipboardPlus, Activity, Users, AlertTriangle, 
  Printer, Search, Loader2, Thermometer, ArrowLeft, 
  HeartPulse, Clock, Scale, Repeat, LayoutDashboard,
  ChevronLeft, ChevronRight, Baby, Stethoscope 
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
  const [paginaDesenvolvimento, setPaginaDesenvolvimento] = useState(1);
  const [paginaAlertas, setPaginaAlertas] = useState(1);
  
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
      restricaoAlimentar: [],
      atrasoDesenvolvimento: [],
      emTratamento: [],
      lacunaTratamento: []
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
        
        const tempo = parseInt(item.tempoDuracao) || 0;
        somaMinutos += tempo;
        if (parseFloat(item.temperatura) >= 37.5) febre++;
      });

      const grupos = {
        acessibilidade: listaPastas.filter(p => p.pcd === "Sim" || p.acessibilidade === "Sim"),
        alergias: listaPastas.filter(p => p.alergia === "Sim"),
        cronicos: listaPastas.filter(p => p.doencaCronica === "Sim"),
        restricaoAlimentar: listaPastas.filter(p => p.restricaoAlimentar === "Sim"),
        atrasoDesenvolvimento: listaPastas.filter(p => p.atrasoDesenvolvimento?.possui === "Sim"),
        emTratamento: listaPastas.filter(p => p.tratamentoEspecializado?.possui === "Sim"),
        lacunaTratamento: listaPastas.filter(p => 
          (p.atrasoDesenvolvimento?.possui === "Sim" || p.diagnosticoNeuro?.possui === "Sim") && 
          p.tratamentoEspecializado?.possui === "Não"
        )
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

  // --- FUNÇÕES DE EXTRAÇÃO E IMPRESSÃO ---

  const imprimirFichaIndividual = (aluno) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Ficha - ${aluno.nome}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #2563eb; margin-bottom: 20px; padding-bottom: 10px; }
            .section { margin-bottom: 15px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .label { font-weight: bold; font-size: 10px; color: #64748b; text-transform: uppercase; }
            .value { font-size: 14px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="header"><h1>Ficha Médica: ${aluno.nome}</h1><p>Turma: ${aluno.turma || 'N/I'}</p></div>
          <div class="section">
            <div class="label">Condições Gerais</div>
            <div class="value">PCD: ${aluno.pcd || 'Não'} | Alergia: ${aluno.alergia || 'Não'}</div>
            <div class="value">Crônico: ${aluno.doencaCronica || 'Não'} | Restrição: ${aluno.restricaoAlimentar || 'Não'}</div>
          </div>
          <div class="section">
            <div class="label">Desenvolvimento</div>
            <div class="value">Atraso: ${aluno.atrasoDesenvolvimento?.possui || 'Não'}</div>
            <div class="value">Tratamento: ${aluno.tratamentoEspecializado?.possui || 'Não'}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const imprimirRelatorioSobrepeso = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head><title>Relatório Biométrico</title><style>
          body { font-family: sans-serif; padding: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f97316; color: white; }
        </style></head>
        <body>
          <h2>Alunos com Sobrepeso (Auditado)</h2>
          <table>
            <thead><tr><th>Aluno</th><th>Turma</th><th>Peso</th><th>Altura</th></tr></thead>
            <tbody>${dados.alunosSobrepeso.map(a => `<tr><td>${a.nome}</td><td>${a.turma}</td><td>${a.peso}kg</td><td>${a.altura}m</td></tr>`).join('')}</tbody>
          </table>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const gerarRelatorioGeral = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head><title>Relatório Geral Auditoria</title><style>
          body { font-family: sans-serif; padding: 20px; line-height: 1.4; }
          .summary { display: flex; gap: 20px; margin-bottom: 20px; }
          .card { border: 1px solid #ccc; padding: 10px; flex: 1; text-align: center; }
          h2 { background: #2563eb; color: white; padding: 5px 10px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #eee; padding: 6px; }
        </style></head>
        <body>
          <h1>Resumo de Auditoria Intelligence</h1>
          <div class="summary">
            <div class="card"><strong>Atendimentos</strong><br/>${dados.atendimentos.length}</div>
            <div class="card"><strong>Alertas Críticos</strong><br/>${dados.gruposSaude.lacunaTratamento.length}</div>
            <div class="card"><strong>Sobrepeso</strong><br/>${dados.alunosSobrepeso.length}</div>
          </div>
          <h2>Alertas de Lacuna Terapêutica (Crítico)</h2>
          <table>
            <thead><tr><th>Aluno</th><th>Turma</th><th>Status</th></tr></thead>
            <tbody>${dados.gruposSaude.lacunaTratamento.map(a => `<tr><td>${a.nome}</td><td>${a.turma}</td><td>Sem Terapia Registrada</td></tr>`).join('')}</tbody>
          </table>
          <h2>Alergias e Restrições</h2>
          <table>
            <thead><tr><th>Aluno</th><th>Turma</th><th>Tipo</th></tr></thead>
            <tbody>
              ${dados.gruposSaude.alergias.map(a => `<tr><td>${a.nome}</td><td>${a.turma}</td><td>Alergia</td></tr>`).join('')}
              ${dados.gruposSaude.restricaoAlimentar.map(a => `<tr><td>${a.nome}</td><td>${a.turma}</td><td>Alimentar</td></tr>`).join('')}
            </tbody>
          </table>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const exportarRelatorioAlertas = () => {
    const casosCriticos = dados.gruposSaude.lacunaTratamento;
    if (casosCriticos.length === 0) return toast.error("NENHUM ALERTA NO MOMENTO");
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head><title>Relatório de Alertas</title><style>
          body { font-family: sans-serif; padding: 40px; }
          .card { border: 2px solid #e11d48; padding: 20px; border-radius: 15px; margin-bottom: 15px; }
          h1 { color: #e11d48; text-transform: uppercase; }
          .tag { background: #ffe4e6; color: #e11d48; padding: 4px 8px; border-radius: 5px; font-size: 10px; font-weight: bold; }
        </style></head>
        <body>
          <h1>Alertas de Lacuna Terapêutica</h1>
          ${casosCriticos.map(a => `
            <div class="card">
              <span class="tag">NECESSITA ATENÇÃO</span>
              <p><strong>ALUNO:</strong> ${a.nome}</p>
              <p><strong>TURMA:</strong> ${a.turma}</p>
              <p><strong>MOTIVO:</strong> Registro de atraso ou diagnóstico neuro divergente sem suporte de terapia informado.</p>
            </div>
          `).join('')}
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const filtrarPorNome = (lista) => lista.filter(a => a.nome?.toLowerCase().includes(buscaSaude.toLowerCase()));

  const theme = {
    card: darkMode ? "bg-[#0A1221] border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900",
    input: darkMode ? "bg-[#050B18] text-white border-slate-700" : "bg-slate-50 text-slate-900 border-slate-200",
    tabActive: "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]",
    tabInactive: darkMode ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-slate-100",
    subCard: darkMode ? "bg-[#0F172A] border-slate-800/50" : "bg-slate-50 border-slate-100"
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
        <div className="flex flex-wrap gap-3">
          <button onClick={gerarRelatorioGeral} className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] hover:bg-blue-600 transition-all shadow-xl">
            <ClipboardPlus size={18} /> Relatório Geral
          </button>
          <button onClick={exportarRelatorioAlertas} className="flex items-center gap-3 px-6 py-4 bg-rose-600 text-white rounded-3xl font-black uppercase text-[10px] hover:scale-105 transition-all shadow-lg shadow-rose-500/20">
            <AlertTriangle size={18} /> Alertas
          </button>
          <button onClick={() => window.print()} className="p-5 bg-white border border-slate-200 text-slate-900 rounded-3xl hover:bg-slate-50 transition-all shadow-sm print:hidden">
            <Printer size={20} />
          </button>
        </div>
      </div>

      <div className={`print:hidden mb-8 p-6 rounded-[40px] border shadow-2xl ${theme.card}`}>
        <div className="flex flex-wrap items-end gap-6 mb-8">
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className={`text-[9px] font-black uppercase tracking-widest ml-2 ${darkMode ? 'text-slate-500' : 'opacity-40'}`}>Início</label>
            <input type="date" value={periodo.inicio} onChange={e => setPeriodo({...periodo, inicio: e.target.value})} className={`w-full p-4 rounded-2xl font-bold outline-none border transition-all ${theme.input}`} />
          </div>
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className={`text-[9px] font-black uppercase tracking-widest ml-2 ${darkMode ? 'text-slate-500' : 'opacity-40'}`}>Fim</label>
            <input type="date" value={periodo.fim} onChange={e => setPeriodo({...periodo, fim: e.target.value})} className={`w-full p-4 rounded-2xl font-bold outline-none border transition-all ${theme.input}`} />
          </div>
          <button onClick={processarRelatorio} disabled={loading} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-blue-500/20">
            {loading ? <Loader2 className="animate-spin" /> : <><Search size={18}/> Analisar</>}
          </button>
        </div>

        <div className={`flex flex-wrap gap-2 p-1.5 rounded-2xl ${darkMode ? 'bg-black/40' : 'bg-black/5'}`}>
          <TabBtn id="geral" label="Visão Geral" icon={<LayoutDashboard size={14}/>} active={activeTab} setActive={setActiveTab} theme={theme} />
          <TabBtn id="saude" label="Triagem de Saúde" icon={<Users size={14}/>} active={activeTab} setActive={setActiveTab} theme={theme} />
          <TabBtn id="desenvolvimento" label="Desenvolvimento" icon={<Baby size={14}/>} active={activeTab} setActive={setActiveTab} theme={theme} />
          <TabBtn id="biometria" label="Biometria" icon={<Scale size={14}/>} active={activeTab} setActive={setActiveTab} theme={theme} />
          <TabBtn id="reincidencia" label="Reincidência" icon={<Repeat size={14}/>} active={activeTab} setActive={setActiveTab} theme={theme} />
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'geral' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Atendimentos" value={dados.atendimentos.length} icon={<Activity />} color="blue" darkMode={darkMode} />
              <StatCard title="Atraso Desenv." value={dados.gruposSaude.atrasoDesenvolvimento.length} icon={<Baby />} color="orange" darkMode={darkMode} />
              <StatCard title="Casos Febre" value={dados.totalFebre} icon={<Thermometer />} color="emerald" darkMode={darkMode} />
              <StatCard title="Alertas Lacuna" value={dados.gruposSaude.lacunaTratamento.length} icon={<AlertTriangle />} color="rose" darkMode={darkMode} />
              <StatCard title="Tempo Médio" value={`${dados.tempoMedio}m`} icon={<Clock />} color="blue" darkMode={darkMode} />
            </div>
            
            <div className={`mt-8 p-8 rounded-[45px] border ${theme.card}`}>
                <h3 className={`text-xs font-black uppercase mb-8 flex items-center gap-3 italic ${darkMode ? 'text-slate-500' : 'opacity-40'}`}>
                   <Users size={18} className="text-blue-500" /> Frequência de Alunos no Período
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dados.rankingAlunos.slice(0, 6).map((aluno, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-5 rounded-3xl border transition-all hover:border-blue-500/50 ${theme.subCard}`}>
                        <span className="text-[11px] font-black uppercase italic">{aluno.nome}</span>
                        <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">{aluno.qtd} ATENDIMENTOS</span>
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
                placeholder="Buscar aluno..." 
                className="bg-transparent border-none outline-none font-bold text-xs w-full uppercase"
                value={buscaSaude}
                onChange={(e) => setBuscaSaude(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SaudeTable title="Acessibilidade / PCD" data={filtrarPorNome(dados.gruposSaude.acessibilidade)} darkMode={darkMode} pagina={paginaPcd} setPagina={setPaginaPcd} itensPorPagina={itensPorPagina} color="blue" onImprimir={imprimirFichaIndividual} />
              <SaudeTable title="Alunos com Alergia" data={filtrarPorNome(dados.gruposSaude.alergias)} darkMode={darkMode} pagina={paginaAlergia} setPagina={setPaginaAlergia} itensPorPagina={itensPorPagina} color="rose" onImprimir={imprimirFichaIndividual} />
              <SaudeTable title="Doenças Crônicas" data={filtrarPorNome(dados.gruposSaude.cronicos)} darkMode={darkMode} pagina={paginaCronico} setPagina={setPaginaCronico} itensPorPagina={itensPorPagina} color="orange" onImprimir={imprimirFichaIndividual} />
              <SaudeTable title="Restrição Alimentar" data={filtrarPorNome(dados.gruposSaude.restricaoAlimentar)} darkMode={darkMode} pagina={paginaRestricao} setPagina={setPaginaRestricao} itensPorPagina={itensPorPagina} color="emerald" onImprimir={imprimirFichaIndividual} />
            </div>
          </div>
        )}

        {activeTab === 'desenvolvimento' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
              <SaudeTable title="Atraso de Desenvolvimento" data={filtrarPorNome(dados.gruposSaude.atrasoDesenvolvimento)} darkMode={darkMode} pagina={paginaDesenvolvimento} setPagina={setPaginaDesenvolvimento} itensPorPagina={itensPorPagina} color="orange" onImprimir={imprimirFichaIndividual} />
              <SaudeTable title="Lacunas de Tratamento (Crítico)" data={filtrarPorNome(dados.gruposSaude.lacunaTratamento)} darkMode={darkMode} pagina={paginaAlertas} setPagina={setPaginaAlertas} itensPorPagina={itensPorPagina} color="rose" onImprimir={imprimirFichaIndividual} />
           </div>
        )}

        {activeTab === 'biometria' && (
          <div className={`p-8 rounded-[45px] border ${theme.card} animate-in zoom-in-95`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className={`text-xs font-black uppercase ${darkMode ? 'text-slate-500' : 'opacity-40'}`}>Monitoramento Biométrico (Sobrepeso)</h3>
              <button onClick={imprimirRelatorioSobrepeso} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">Imprimir Lista Sobrepeso</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dados.alunosSobrepeso.map((aluno, idx) => (
                <div key={idx} className={`p-5 rounded-3xl border flex justify-between items-center ${darkMode ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-500/5 border-orange-500/10'}`}>
                  <div>
                    <p className="text-[10px] font-black uppercase italic">{aluno.nome}</p>
                    <p className={`text-[8px] uppercase ${darkMode ? 'text-slate-500' : 'opacity-50'}`}>Turma {aluno.turma}</p>
                  </div>
                  <div className="text-right font-black text-orange-600 text-[10px]">{aluno.peso}kg</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reincidencia' && (
          <div className={`p-8 rounded-[45px] border ${theme.card} animate-in slide-in-from-right-4`}>
             <h3 className={`text-xs font-black uppercase mb-8 italic ${darkMode ? 'text-slate-500' : 'opacity-40'}`}>Fluxo de Reincidência de Atendimentos</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {dados.reincidentes.map((aluno, idx) => (
                  <div key={idx} className={`p-5 rounded-3xl border ${darkMode ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-500/5 border-rose-500/10'}`}>
                    <div className="flex justify-between items-center mb-2">
                       <span className={`text-[8px] font-black uppercase ${darkMode ? 'text-slate-600' : 'opacity-40'}`}>T. {aluno.turma}</span>
                       <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg shadow-rose-500/20">{aluno.qtd}x</span>
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

// Componentes Auxiliares
const SaudeTable = ({ title, data, darkMode, pagina, setPagina, itensPorPagina, color, onImprimir }) => {
  const totalPaginas = Math.ceil(data.length / itensPorPagina);
  const inicio = (pagina - 1) * itensPorPagina;
  const exibidos = data.slice(inicio, inicio + itensPorPagina);
  const colors = { blue: "text-blue-500", rose: "text-rose-500", orange: "text-orange-500", emerald: "text-emerald-500" };

  return (
    <div className={`p-6 rounded-[40px] border flex flex-col min-h-[450px] transition-all ${darkMode ? 'bg-[#0A1221] border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-[10px] font-black uppercase tracking-widest italic ${colors[color]}`}>{title} ({data.length})</h3>
        <div className="flex gap-1">
          <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="p-2 rounded-xl bg-black/5 disabled:opacity-10"><ChevronLeft size={14} /></button>
          <button disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)} className="p-2 rounded-xl bg-black/5 disabled:opacity-10"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        {exibidos.map((aluno, i) => (
          <div key={i} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${darkMode ? 'border-slate-800 bg-white/5' : 'border-slate-50 bg-slate-50'}`}>
            <div>
              <p className="text-[10px] font-black uppercase italic truncate max-w-[150px]">{aluno.nome}</p>
              <p className="text-[8px] font-bold opacity-50 uppercase tracking-tighter">Turma: {aluno.turma || 'N/I'}</p>
            </div>
            <button 
              onClick={() => onImprimir(aluno)}
              className={`text-[8px] font-black px-2 py-1 rounded-md bg-opacity-10 hover:bg-opacity-100 hover:text-white transition-all ${colors[color]} bg-current`}
            >
              FICHA
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, darkMode }) => {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
  };
  return (
    <div className={`p-6 rounded-[40px] border shadow-sm transition-all hover:scale-105 ${darkMode ? "bg-[#0A1221] border-slate-800" : "bg-white border-slate-100"}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>{icon}</div>
      <h2 className="text-2xl font-black italic mb-2 leading-none">{value}</h2>
      <p className="text-[8px] font-black uppercase tracking-widest opacity-40">{title}</p>
    </div>
  );
};

const TabBtn = ({ id, label, icon, active, setActive, theme }) => (
  <button onClick={() => setActive(id)} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active === id ? theme.tabActive : theme.tabInactive}`}>
    {icon} {label}
  </button>
);

export default RelatorioMedicoPro;