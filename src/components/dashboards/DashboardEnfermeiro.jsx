import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { db, auth } from "../../firebase/firebaseConfig"; 
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, UserPlus, ClipboardList, Stethoscope,
  ChevronDown, LogOut, FolderSearch, Lock, Brain, Search,
  Menu, ChevronLeft, Sun, Moon, LifeBuoy, ShieldAlert, BarChart3, 
  Contact, Heart, Phone, Zap, Accessibility, Users 
} from "lucide-react";

// Importações de páginas
import HomeEnfermeiro from "../../pages/HomeEnfermeiro"; 
import AtendimentoEnfermagem from "../../pages/atendimento/AtendimentoEnfermagem";
import HistoricoAtendimentos from "../../pages/atendimento/HistoricoAtendimentos";
import FormCadastroAluno from "../../pages/cadastros/FormCadastroAluno";
import FormCadastroFuncionario from "../../pages/cadastros/FormCadastroFuncionario";
import PastaDigital from "../PastaDigital";
import QuestionarioSaude from "../../pages/cadastros/QuestionarioSaude"; 
import RelatorioMedicoPro from "../../components/RelatorioMedicoPro"; 
import ContatoAluno from "../../components/ContatoAluno"; 

// --- 1. COMPONENTE DE SAÚDE INCLUSIVA ---
const SecaoAlunosEspeciais = memo(({ alunosRaw, setDadosParaEdicao, setActiveTab }) => {
  const [termoBusca, setTermoBusca] = useState("");

  const stats = useMemo(() => {
    const pcds = alunosRaw.filter(a => a.isPCD === 'sim' || a.isPCD === 'Sim');
    const contar = (t) => pcds.filter(a => a.tipoNecessidade?.toLowerCase().includes(t.toLowerCase())).length;

    return [
      { label: "Total PCD", qtd: pcds.length, cor: "bg-slate-900", icon: <Users size={18} /> },
      { label: "Autismo / TEA", qtd: contar("tea") + contar("autismo"), cor: "bg-blue-600", icon: <Brain size={18} /> },
      { label: "TDAH", qtd: contar("tdah"), cor: "bg-purple-600", icon: <Zap size={18} /> },
      { label: "Cadeirantes", qtd: contar("cadeira") + contar("física"), cor: "bg-emerald-600", icon: <Accessibility size={18} /> },
    ];
  }, [alunosRaw]);

  const filtrados = useMemo(() => {
    return alunosRaw.filter(aluno => 
      (aluno.isPCD === 'sim' || aluno.isPCD === 'Sim') && 
      (aluno.nome?.toLowerCase().includes(termoBusca.toLowerCase()) || 
       aluno.tipoNecessidade?.toLowerCase().includes(termoBusca.toLowerCase()))
    );
  }, [alunosRaw, termoBusca]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex flex-col gap-3">
            <div className={`w-10 h-10 ${item.cor} text-white rounded-2xl flex items-center justify-center shadow-lg`}>{item.icon}</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-3xl font-black text-slate-800 italic">{item.qtd}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[35px] border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-2">
          <Brain size={28} className="text-purple-600" /> Monitoramento
        </h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="BUSCAR NOME OU CONDIÇÃO..."
            className="pl-12 pr-6 py-4 bg-slate-100 rounded-2xl w-full md:w-80 font-black text-[10px] outline-none focus:ring-2 ring-purple-500 transition-all uppercase italic"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtrados.map(aluno => (
          <div key={aluno.id} className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-md hover:border-purple-300 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-black text-lg border border-purple-100">
                  {aluno.nome?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase italic leading-tight">{aluno.nome}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Turma: {aluno.turma || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic">CID: {aluno.numeroCid || '---'}</div>
            </div>
            <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100 flex items-center gap-3 mb-4">
              <Brain size={18} className="text-purple-600" />
              <p className="text-[11px] font-black text-purple-900 uppercase italic leading-none">{aluno.tipoNecessidade || 'Não informada'}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 font-black italic">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Phone size={14} /></div>
                <span className="text-xs text-slate-800">{aluno.contato1_telefone}</span>
              </div>
              <button onClick={() => { setDadosParaEdicao(aluno); setActiveTab("pasta_digital"); }} className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                <ChevronLeft className="rotate-180" size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// --- COMPONENTES DE TELA (BLOQUEIO E SUPORTE) ---
const TelaBloqueioLicenca = ({ darkMode, onLogout }) => (
  <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-6 backdrop-blur-md ${darkMode ? "bg-black/95" : "bg-slate-900/80"}`}>
    <div className={`max-w-md w-full p-10 rounded-[40px] text-center shadow-2xl ${darkMode ? "bg-[#020617] border border-slate-800" : "bg-white"}`}>
      <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><ShieldAlert size={40} /></div>
      <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Acesso <span className="text-rose-500">Suspenso</span></h2>
      <button onClick={onLogout} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl">Sair do Sistema</button>
    </div>
  </div>
);

const TelaSuporte = ({ darkMode }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
    <div className={`max-w-md w-full p-12 rounded-[50px] border shadow-2xl ${darkMode ? "bg-[#020617] border-slate-800" : "bg-white border-slate-200"}`}>
      <LifeBuoy size={40} className="mx-auto mb-6 text-blue-600" />
      <h2 className="text-2xl font-black uppercase italic mb-6">Suporte Técnico</h2>
      <a href="https://wa.me/5521975966330" className="block w-full bg-[#25D366] text-white font-black py-4 rounded-2xl">WhatsApp</a>
    </div>
  </div>
);

const DashboardEnfermeiro = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState("home");
  const [cadastroMode, setCadastroMode] = useState("aluno");
  const [menuAberto, setMenuAberto] = useState(null); 
  const [isExpanded, setIsExpanded] = useState(true);
  const [darkMode, setDarkMode] = useState(false); 
  const [visaoMensal, setVisaoMensal] = useState(false);
  const [dadosParaEdicao, setDadosParaEdicao] = useState(null);
  const [atendimentosRaw, setAtendimentosRaw] = useState([]);
  const [alunosRaw, setAlunosRaw] = useState([]);

  useEffect(() => {
    const userId = initialUser?.uid || initialUser?.id;
    if (!userId) return;
    const unsub = onSnapshot(doc(db, "usuarios", userId), (docSnap) => {
      if (docSnap.exists()) setUser({ id: docSnap.id, ...docSnap.data() });
    });
    return () => unsub();
  }, [initialUser]);

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const [snapAtend, snapPastas] = await Promise.all([
          getDocs(collection(db, "atendimentos_enfermagem")),
          getDocs(collection(db, "pastas_digitais"))
        ]);
        setAtendimentosRaw(snapAtend.docs.map(d => ({ id: d.id, ...d.data() })));
        setAlunosRaw(snapPastas.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error(err); }
    };
    fetchGlobalData();
  }, []);

  const handleLogoutClick = async () => {
    try { if (onLogout) await onLogout(); await signOut(auth); window.location.replace("/login"); } 
    catch (error) { console.error(error); }
  };

  const isLiberado = (itemKey) => {
    const cargoLower = user?.role?.toLowerCase() || "";
    if (cargoLower === "root" || cargoLower === "admin") return true;
    if (user?.status === 'bloqueado' || user?.statusLicenca === 'bloqueada') return false;
    // Trava específica: agora verifica se é explicitamente true
    return user?.modulosSidebar?.[itemKey] === true;
  };

  const theme = {
    sidebarBg: darkMode ? "bg-[#020617]" : "bg-white",
    sidebarText: darkMode ? "text-slate-400" : "text-slate-600",
    sidebarActive: darkMode ? "bg-blue-600 text-white shadow-lg" : "bg-blue-50 text-blue-600",
    border: darkMode ? "border-slate-800" : "border-slate-200",
    headerBg: darkMode ? "bg-[#020617]" : "bg-white",
    contentBg: "bg-slate-50"
  };

  const menuItems = [
    { id: "home", label: "Dashboard", icon: <LayoutDashboard size={20} />, key: "dashboard" },
    { id: "atendimento", label: "Atendimento", icon: <Stethoscope size={20} />, key: "atendimento" },
    { id: "alunos_especiais", label: "Saúde Inclusiva", icon: <Brain size={20} />, key: "saude_inclusiva" },
    { id: "contato", label: "Contato do Aluno", icon: <Contact size={20} />, key: "espelho" },
    { id: "pasta_digital", label: "Pasta Digital", icon: <FolderSearch size={20} />, key: "pasta_digital" },
    { 
      id: "pacientes", label: "Cadastros", icon: <UserPlus size={20} />, key: "pacientes",
      subItems: [{ id: "aluno", label: "Alunos" }, { id: "funcionario", label: "Funcionários" }, { id: "saude_escolar", label: "Ficha de Saúde" }]
    }, 
    { id: "historico", label: "BAENF Antigos", icon: <ClipboardList size={20} />, key: "relatorios" },
    { id: "auditoria", label: "Auditoria de Saúde", icon: <BarChart3 size={20} />, key: "auditoria_pro" },
  ];

  const renderContent = () => {
    const commonProps = { user, darkMode: false, onVoltar: () => { setActiveTab("home"); setDadosParaEdicao(null); } };
    const cargoLower = user?.role?.toLowerCase() || "";

    switch (activeTab) {
      case "home": return <HomeEnfermeiro {...commonProps} setActiveTab={setActiveTab} isLiberado={isLiberado} visaoMensal={visaoMensal} setVisaoMensal={setVisaoMensal} />;
      case "alunos_especiais": 
        if (cargoLower !== "root" && cargoLower !== "admin" && !isLiberado('saude_inclusiva')) {
          return <div className="p-20 text-center font-black opacity-20 uppercase italic">Acesso Restrito: Módulo Bloqueado</div>;
        }
        return <SecaoAlunosEspeciais alunosRaw={alunosRaw} setDadosParaEdicao={setDadosParaEdicao} setActiveTab={setActiveTab} />;
      case "atendimento": return <AtendimentoEnfermagem {...commonProps} />;
      case "contato": return <ContatoAluno {...commonProps} />;
      case "pasta_digital": return <PastaDigital {...commonProps} onNovoAtendimento={(p) => { setDadosParaEdicao(p.dados); setCadastroMode(p.tipo.toLowerCase()); setActiveTab("pacientes"); }} onAbrirQuestionario={(p) => { setDadosParaEdicao(p.dados); setCadastroMode("saude_escolar"); setActiveTab("pacientes"); }} />;
      case "pacientes":
        if (cadastroMode === "aluno") return <FormCadastroAluno {...commonProps} dadosEdicao={dadosParaEdicao} />;
        if (cadastroMode === "funcionario") return <FormCadastroFuncionario {...commonProps} dadosEdicao={dadosParaEdicao} />;
        if (cadastroMode === "saude_escolar") return <QuestionarioSaude {...commonProps} dadosEdicao={dadosParaEdicao} onVoltar={() => setActiveTab("pasta_digital")} />;
        return <FormCadastroAluno {...commonProps} />;
      case "historico": return <HistoricoAtendimentos {...commonProps} />;
      case "auditoria": 
        if (cargoLower !== "root" && cargoLower !== "admin" && !isLiberado('auditoria_pro')) {
          return <div className="p-20 text-center font-black opacity-20 uppercase italic">Acesso Restrito ao Módulo de Auditoria</div>;
        }
        return <RelatorioMedicoPro {...commonProps} atendimentosRaw={atendimentosRaw} alunosRaw={alunosRaw} />;
      case "suporte": return <TelaSuporte darkMode={darkMode} />;
      default: return <HomeEnfermeiro {...commonProps} setActiveTab={setActiveTab} isLiberado={isLiberado} />;
    }
  };

  return (
    <div className={`fixed inset-0 z-[999] flex h-screen w-screen overflow-hidden font-sans ${theme.contentBg}`}>
      { (user?.status === 'bloqueado' || user?.statusLicenca === 'bloqueada') && <TelaBloqueioLicenca darkMode={darkMode} onLogout={handleLogoutClick} /> }

      <aside className={`${isExpanded ? "w-64" : "w-20"} ${theme.sidebarBg} flex flex-col border-r ${theme.border} transition-all duration-300 relative`}>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-8 flex items-center gap-3">
             <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200"><Stethoscope size={20}/></div>
             {isExpanded && <h2 className={`text-xl font-black uppercase italic tracking-tighter ${darkMode ? "text-white" : "text-slate-900"}`}>BAENF</h2>}
          </div>

          {/* CARD DO USUÁRIO E COREN/CRM */}
          {isExpanded && (
            <div className={`mb-6 p-4 rounded-2xl border animate-in fade-in slide-in-from-left-2 duration-300 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
              <p className={`text-[10px] font-black uppercase italic tracking-tight ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                {user?.nome || "Usuário"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase rounded-md shadow-sm">
                  {user?.role?.toLowerCase() === "medico" ? "CRM" : "COREN"}
                </div>
                <p className="text-[9px] font-bold text-slate-400">
                  {user?.registroProfissional || "---"}
                </p>
              </div>
            </div>
          )}

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const liberado = isLiberado(item.key);
              const isActive = activeTab === item.id;
              return (
                <div key={item.id}>
                  <button 
                    onClick={() => { if(item.subItems) setMenuAberto(menuAberto === item.id ? null : item.id); else setActiveTab(item.id); }} 
                    disabled={!liberado} 
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${!liberado ? "opacity-20 grayscale cursor-not-allowed" : isActive ? theme.sidebarActive : theme.sidebarText + " hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon} {isExpanded && <span className="text-[10px] font-black uppercase italic tracking-tight">{item.label}</span>}
                    </div>
                    {isExpanded && item.subItems && <ChevronDown size={14} className={`transition-transform ${menuAberto === item.id ? "rotate-180" : ""}`}/>}
                    {!liberado && isExpanded && <Lock size={12} className="text-slate-400" />}
                  </button>
                  {isExpanded && item.subItems && menuAberto === item.id && (
                    <div className="ml-9 mt-2 space-y-2 border-l-2 pl-4 border-slate-100 animate-in slide-in-from-left-2 duration-200">
                      {item.subItems.map(sub => (
                        <button key={sub.id} onClick={() => { setActiveTab(item.id); setCadastroMode(sub.id); }} className="block text-[9px] font-black uppercase italic text-slate-500 hover:text-blue-600 transition-colors">{sub.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
        <div className={`p-6 border-t ${theme.border} space-y-4`}>
            <button onClick={() => setActiveTab("suporte")} className="flex items-center gap-3 text-slate-400 font-black uppercase italic text-[10px] hover:text-blue-600 transition-colors"><LifeBuoy size={16}/> {isExpanded && "Suporte"}</button>
            <button onClick={handleLogoutClick} className="flex items-center gap-3 text-red-500 font-black uppercase italic text-[10px] hover:text-red-700 transition-colors"><LogOut size={16}/> {isExpanded && "Sair"}</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className={`h-20 border-b flex items-center justify-between px-8 ${theme.headerBg} ${theme.border}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Menu size={20}/></button>
            <h1 className="text-sm font-black uppercase italic tracking-widest text-slate-400">
              {menuItems.find(i => i.id === activeTab)?.label || "Dashboard"}
            </h1>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all">{darkMode ? <Sun size={20} className="text-amber-500"/> : <Moon size={20} className="text-slate-600"/>}</button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default DashboardEnfermeiro;