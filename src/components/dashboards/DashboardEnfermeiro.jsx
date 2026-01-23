import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebase/firebaseConfig"; 
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, UserPlus, ClipboardList, Stethoscope,
  ChevronDown, LogOut, FolderSearch, Lock,
  Settings, Bell, FileBarChart, Menu, ChevronLeft, 
  Sun, Moon, LifeBuoy, ShieldAlert, BarChart3, Contact
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

// --- COMPONENTES AUXILIARES ---
const TelaBloqueioLicenca = ({ darkMode, onLogout }) => (
  <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-6 backdrop-blur-md ${darkMode ? "bg-black/95" : "bg-slate-900/80"}`}>
    <div className={`max-w-md w-full p-10 rounded-[40px] text-center shadow-2xl animate-in zoom-in duration-300 ${darkMode ? "bg-[#020617] border border-slate-800" : "bg-white"}`}>
      <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <ShieldAlert size={40} />
      </div>
      <h2 className={`text-2xl font-black uppercase italic tracking-tighter mb-4 ${darkMode ? "text-white" : "text-slate-900"}`}>
        Acesso <span className="text-rose-500">Suspenso</span>
      </h2>
      <p className={`text-sm leading-relaxed mb-8 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        Sua licença expirou ou foi desativada. Entre em contato com o suporte.
      </p>
      <div className="space-y-3">
        <a href="https://wa.me/5521975966330" target="_blank" rel="noreferrer" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic text-[11px] tracking-widest py-5 rounded-2xl transition-all">Falar com Suporte</a>
        <button onClick={onLogout} className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-rose-500 transition-colors">Sair do Sistema</button>
      </div>
    </div>
  </div>
);

const TelaSuporte = ({ darkMode }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 animate-in fade-in zoom-in duration-500 text-center">
      <div className={`max-w-md w-full p-12 rounded-[50px] border shadow-2xl ${darkMode ? "bg-[#020617] border-slate-800" : "bg-white border-slate-200"}`}>
        <LifeBuoy size={40} className="mx-auto mb-6 text-blue-600" />
        <h2 className={`text-2xl font-black uppercase italic mb-6 ${darkMode ? "text-white" : "text-slate-900"}`}>Suporte Técnico</h2>
        <a href="https://wa.me/5521975966330" className="block w-full bg-[#25D366] text-white font-black py-4 rounded-2xl mb-4 hover:scale-105 transition-transform shadow-lg shadow-green-500/20">WhatsApp</a>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">rodrigohono21@gmail.com</p>
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
  const [dadosParaEdicao, setDadosParaEdicao] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const userId = initialUser?.uid || initialUser?.id;
    if (!userId) return;
    unsubscribeRef.current = onSnapshot(doc(db, "usuarios", userId), (docSnap) => {
      if (docSnap.exists()) setUser({ id: docSnap.id, ...docSnap.data() });
    });
    return () => unsubscribeRef.current?.();
  }, [initialUser]);

  const handleLogoutClick = async () => {
    try {
      unsubscribeRef.current?.();
      if (onLogout) await onLogout();
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) { console.error(error); }
  };

  const isLiberado = (itemKey) => {
    if (user?.status === 'bloqueado' || user?.statusLicenca === 'bloqueada') return false;
    return user?.modulosSidebar?.[itemKey] !== false;
  };

  const handleEdicaoDaPasta = (payload) => {
    setDadosParaEdicao(payload.dados);
    setCadastroMode(payload.tipo.toLowerCase()); 
    setActiveTab("pacientes"); 
  };

  const handleAbrirQuestionarioPelaPasta = (payload) => {
    setDadosParaEdicao(payload.dados); 
    setCadastroMode("saude_escolar");
    setActiveTab("pacientes");
  };

  const handleSucessoQuestionario = (aluno) => {
    setDadosParaEdicao(aluno); 
    setActiveTab("pasta_digital");
  };

  const theme = {
    sidebarBg: darkMode ? "bg-[#020617]" : "bg-white",
    sidebarText: darkMode ? "text-slate-400" : "text-slate-600",
    sidebarActive: darkMode ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-blue-50 text-blue-600",
    border: darkMode ? "border-slate-800" : "border-slate-200",
    headerBg: darkMode ? "bg-[#020617]" : "bg-white",
    contentBg: "bg-slate-50" // Fundo do conteúdo agora é sempre claro
  };

  const renderContent = () => {
    // Props forçadas para Modo Claro nos componentes internos
    const forcedLightProps = { 
        user, 
        darkMode: false, 
        onVoltar: () => { setActiveTab("home"); setDadosParaEdicao(null); } 
    };

    switch (activeTab) {
      case "home": return <HomeEnfermeiro {...forcedLightProps} setActiveTab={setActiveTab} isLiberado={isLiberado} />;
      case "atendimento": return <AtendimentoEnfermagem {...forcedLightProps} />;
      case "contato": return <ContatoAluno {...forcedLightProps} />;
      case "pasta_digital": 
        return (
          <PastaDigital 
            {...forcedLightProps}
            onNovoAtendimento={handleEdicaoDaPasta} 
            onAbrirQuestionario={handleAbrirQuestionarioPelaPasta}
            alunoParaReabrir={forcedLightProps.alunoParaReabrir} 
          />
        );
      case "pacientes":
        if (cadastroMode === "aluno") return <FormCadastroAluno {...forcedLightProps} dadosEdicao={dadosParaEdicao} onVoltar={() => setActiveTab(dadosParaEdicao ? "pasta_digital" : "home")} />;
        if (cadastroMode === "funcionario") return <FormCadastroFuncionario {...forcedLightProps} dadosEdicao={dadosParaEdicao} onVoltar={() => setActiveTab(dadosParaEdicao ? "pasta_digital" : "home")} />;
        if (cadastroMode === "saude_escolar") return <QuestionarioSaude {...forcedLightProps} dadosEdicao={dadosParaEdicao} onVoltar={() => setActiveTab("pasta_digital")} onSucesso={handleSucessoQuestionario} />;
        return <FormCadastroAluno {...forcedLightProps} />;
      case "historico": return <HistoricoAtendimentos {...forcedLightProps} />;
      case "auditoria": return <RelatorioMedicoPro {...forcedLightProps} />;
      case "suporte": return <TelaSuporte darkMode={darkMode} />;
      default: return <HomeEnfermeiro {...forcedLightProps} setActiveTab={setActiveTab} isLiberado={isLiberado} />;
    }
  };

  const menuItems = [
    { id: "home", label: "Dashboard", icon: <LayoutDashboard size={20} />, key: "dashboard" },
    { id: "atendimento", label: "Atendimento", icon: <Stethoscope size={20} />, key: "atendimento" },
    { id: "contato", label: "Contato do Aluno", icon: <Contact size={20} />, key: "espelho" },
    { id: "pasta_digital", label: "Pasta Digital", icon: <FolderSearch size={20} />, key: "pasta_digital" },
    { 
      id: "pacientes", 
      label: "Cadastros", 
      icon: <UserPlus size={20} />, 
      key: "pacientes",
      subItems: [
        { id: "aluno", label: "Alunos" }, 
        { id: "funcionario", label: "Funcionários" },
        { id: "saude_escolar", label: "Ficha de Saúde" } 
      ]
    }, 
    { id: "historico", label: "BAENF Antigos", icon: <ClipboardList size={20} />, key: "relatorios" },
    { id: "auditoria", label: "Auditoria de Saúde", icon: <BarChart3 size={20} />, key: "dashboard" },
  ];

  return (
    <div className={`fixed inset-0 z-[999] flex h-screen w-screen overflow-hidden font-sans transition-colors duration-500 ${theme.contentBg}`}>
      { (user?.status === 'bloqueado' || user?.statusLicenca === 'bloqueada') && <TelaBloqueioLicenca darkMode={darkMode} onLogout={handleLogoutClick} />}

      {/* MINI BAR ESQUERDA (Responde ao Dark Mode) */}
      <div className={`w-16 flex flex-col items-center py-8 gap-8 border-r shrink-0 z-50 transition-colors duration-500 ${darkMode ? "bg-[#020617] border-slate-800" : "bg-slate-100 border-slate-200"}`}>
          <div className="text-blue-500"><Stethoscope size={24} /></div>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl transition-all ${darkMode ? "text-yellow-400 bg-white/5 hover:bg-white/10" : "text-slate-600 hover:bg-slate-200"}`}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setActiveTab("suporte")} className={`mt-auto mb-4 p-2 rounded-xl transition-all ${activeTab === "suporte" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-blue-500"}`}>
              <LifeBuoy size={20} />
          </button>
      </div>

      {/* SIDEBAR PRINCIPAL (Responde ao Dark Mode) */}
      <aside className={`${isExpanded ? "w-64" : "w-0 overflow-hidden"} ${theme.sidebarBg} flex flex-col shrink-0 transition-all duration-300 relative border-r ${theme.border} shadow-2xl`}>
        <button onClick={() => setIsExpanded(!isExpanded)} className={`absolute -right-3 top-24 rounded-full p-1 border z-50 ${darkMode ? "bg-[#020617] border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}>
          <ChevronLeft size={16} className={`${!isExpanded && "rotate-180"}`} />
        </button>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-10 px-2">
            <span className="text-[10px] font-bold tracking-[0.3em] text-blue-500 uppercase">Rodhon</span>
            <h2 className={`text-xl font-black tracking-tighter uppercase italic leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>BAENF</h2>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const liberado = isLiberado(item.key);
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="flex flex-col">
                  <button
                    disabled={!liberado}
                    onClick={() => {
                      if (item.subItems) setMenuAberto(menuAberto === item.id ? null : item.id);
                      else { setActiveTab(item.id); setMenuAberto(null); setDadosParaEdicao(null); }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                      !liberado ? "opacity-20 cursor-not-allowed grayscale" : 
                      isActive ? theme.sidebarActive : `${theme.sidebarText} hover:bg-blue-500/10 hover:text-blue-500`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "" : "opacity-50"}>
                        {liberado ? item.icon : <Lock size={16} className="text-rose-500" />}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest italic">{item.label}</span>
                    </div>
                    {item.subItems && liberado && <ChevronDown size={14} className={`${menuAberto === item.id ? "rotate-180" : ""}`} />}
                  </button>
                  {item.subItems && liberado && menuAberto === item.id && (
                    <div className={`ml-9 mt-2 space-y-2 border-l pl-4 ${theme.border}`}>
                      {item.subItems.map(sub => (
                        <button key={sub.id} onClick={() => { setActiveTab(item.id); setCadastroMode(sub.id); setDadosParaEdicao(null); }} className={`w-full text-left text-[9px] font-black uppercase tracking-widest ${cadastroMode === sub.id && isActive ? "text-blue-500" : "text-slate-500 hover:text-blue-500"}`}>
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className={`p-6 border-t ${theme.border} ${darkMode ? "bg-black/40" : "bg-slate-50"}`}>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs uppercase shadow-lg shadow-blue-500/30">
              {user?.nome?.substring(0, 2) || "EN"}
            </div>
            <div className="flex flex-col overflow-hidden uppercase font-black italic">
              <span className={`text-[10px] truncate ${darkMode ? "text-white" : "text-slate-900"}`}>{user?.nome || "Usuário"}</span>
              <span className="text-blue-500 text-[7px] tracking-widest">Enfermagem</span>
            </div>
          </div>
          <button onClick={handleLogoutClick} className="flex items-center gap-3 text-red-500/80 hover:text-red-500 px-2 transition-all group">
            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" /> 
            <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* HEADER (Responde ao Dark Mode) */}
        <header className={`h-20 border-b flex items-center justify-between px-8 shrink-0 transition-colors duration-500 ${theme.headerBg} ${theme.border}`}>
          <div className="flex items-center gap-4">
              {!isExpanded && (
                <button onClick={() => setIsExpanded(true)} className={`p-2 rounded-lg ${darkMode ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
                   <Menu size={18} />
                </button>
              )}
              <h1 className={`text-sm font-black uppercase tracking-widest italic ${darkMode ? "text-white" : "text-slate-800"}`}>
                 {activeTab === "suporte" ? "Suporte Técnico" : menuItems.find(i => i.id === activeTab)?.label}
              </h1>
          </div>
          <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border ${darkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
              Unidade: {user?.escolaId || 'Sede'}
          </div>
        </header>

        {/* CONTEÚDO (Sempre com fundo Claro para as páginas) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full animate-in fade-in duration-500 bg-slate-50">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default DashboardEnfermeiro;