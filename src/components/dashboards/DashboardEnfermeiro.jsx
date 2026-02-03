import React, { useState, useEffect, useMemo, memo } from "react";
import { db, auth } from "../../firebase/firebaseConfig"; 
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, UserPlus, ClipboardList, Stethoscope,
  ChevronDown, LogOut, FolderSearch, Lock, Brain, Search,
  Menu, ChevronLeft, Sun, Moon, LifeBuoy, ShieldAlert, BarChart3, 
  Contact, Phone, Zap, Accessibility, Users, Printer
} from "lucide-react";

// Importações de páginas e componentes
import HomeEnfermeiro from "../../pages/HomeEnfermeiro"; 
import AtendimentoEnfermagem from "../../pages/atendimento/AtendimentoEnfermagem";
import HistoricoAtendimentos from "../../pages/atendimento/HistoricoAtendimentos";
import FormCadastroAluno from "../../pages/cadastros/FormCadastroAluno";
import FormCadastroFuncionario from "../../pages/cadastros/FormCadastroFuncionario";
import PastaDigital from "../PastaDigital";
import QuestionarioSaude from "../../pages/cadastros/QuestionarioSaude"; 
import RelatorioMedicoPro from "../../components/RelatorioMedicoPro"; 
import ContatoAluno from "../../components/ContatoAluno";
import DashboardSaudeInclusiva from "./DashboardSaudeInclusiva"; 

// --- COMPONENTES DE SUPORTE E BLOQUEIO ---
const TelaBloqueioLicenca = ({ darkMode, onLogout }) => (
  <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-6 backdrop-blur-md ${darkMode ? "bg-black/95" : "bg-slate-900/80"}`}>
    <div className={`max-w-md w-full p-10 rounded-[40px] text-center shadow-2xl ${darkMode ? "bg-[#020617] border border-slate-800" : "bg-white"}`}>
      <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><ShieldAlert size={40} /></div>
      <h2 className="text-2xl font-black uppercase italic mb-4">Acesso <span className="text-rose-500">Suspenso</span></h2>
      <button onClick={onLogout} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl">Sair do Sistema</button>
    </div>
  </div>
);

const TelaSuporte = ({ darkMode }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
    <div className={`max-w-md w-full p-12 rounded-[50px] border shadow-2xl ${darkMode ? "bg-[#020617] border-slate-800" : "bg-white border-slate-200"}`}>
      <LifeBuoy size={40} className="mx-auto mb-6 text-blue-600" />
      <h2 className="text-2xl font-black uppercase italic mb-6">Suporte Técnico</h2>
      <a href="https://wa.me/5521975966330" className="block w-full bg-[#25D366] text-white font-black py-4 rounded-2xl text-center">WhatsApp</a>
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
    return user?.modulosSidebar?.[itemKey] === true;
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
    const commonProps = { user, darkMode, onVoltar: () => { setActiveTab("home"); setDadosParaEdicao(null); } };
    const cargoLower = user?.role?.toLowerCase() || "";

    switch (activeTab) {
      case "home": return <HomeEnfermeiro {...commonProps} setActiveTab={setActiveTab} isLiberado={isLiberado} visaoMensal={visaoMensal} setVisaoMensal={setVisaoMensal} />;
      case "alunos_especiais": 
        if (cargoLower !== "root" && cargoLower !== "admin" && !isLiberado('saude_inclusiva')) return null;
        return <DashboardSaudeInclusiva setDadosParaEdicao={setDadosParaEdicao} setActiveTab={setActiveTab} />;
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
        if (cargoLower !== "root" && cargoLower !== "admin" && !isLiberado('auditoria_pro')) return null;
        return <RelatorioMedicoPro {...commonProps} atendimentosRaw={atendimentosRaw} alunosRaw={alunosRaw} />;
      case "suporte": return <TelaSuporte darkMode={darkMode} />;
      default: return <HomeEnfermeiro {...commonProps} setActiveTab={setActiveTab} isLiberado={isLiberado} />;
    }
  };

  return (
    <div className={`fixed inset-0 z-[999] flex h-screen w-screen overflow-hidden font-sans ${darkMode ? "bg-black" : "bg-slate-50"}`}>
      { (user?.status === 'bloqueado' || user?.statusLicenca === 'bloqueada') && <TelaBloqueioLicenca darkMode={darkMode} onLogout={handleLogoutClick} /> }

      <aside className={`${isExpanded ? "w-64" : "w-20"} ${darkMode ? "bg-[#020617]" : "bg-white"} flex flex-col border-r ${darkMode ? "border-slate-800" : "border-slate-200"} transition-all duration-300 relative`}>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-8 flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg"><Stethoscope size={20}/></div>
              {isExpanded && <h2 className={`text-xl font-black uppercase italic tracking-tighter ${darkMode ? "text-white" : "text-slate-900"}`}>BAENF</h2>}
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const liberado = isLiberado(item.key);
              const isActive = activeTab === item.id;
              const isMenuOpen = menuAberto === item.id;

              return (
                <div key={item.id}>
                  <button 
                    onClick={() => { 
                      if(item.subItems) setMenuAberto(isMenuOpen ? null : item.id); 
                      else { setActiveTab(item.id); setMenuAberto(null); }
                    }} 
                    disabled={!liberado} 
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${!liberado ? "opacity-20 grayscale cursor-not-allowed" : isActive ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon} {isExpanded && <span className="text-[10px] font-black uppercase italic tracking-tight">{item.label}</span>}
                    </div>
                    {item.subItems && isExpanded && <ChevronDown size={14} className={`transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />}
                  </button>

                  {/* RENDERIZAÇÃO DOS SUB-ITENS CORRIGIDA */}
                  {item.subItems && isMenuOpen && isExpanded && (
                    <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-100 pl-4 animate-in slide-in-from-left-2 duration-200">
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setCadastroMode(sub.id);
                          }}
                          className={`w-full text-left py-2 px-3 rounded-lg text-[9px] font-black uppercase italic transition-all ${cadastroMode === sub.id && activeTab === item.id ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                        >
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
        <div className="p-6 border-t border-slate-100 space-y-4">
            <button onClick={() => setActiveTab("suporte")} className="flex items-center gap-3 text-slate-400 font-black uppercase italic text-[10px] hover:text-blue-600 transition-colors"><LifeBuoy size={16}/> {isExpanded && "Suporte"}</button>
            <button onClick={handleLogoutClick} className="flex items-center gap-3 text-red-500 font-black uppercase italic text-[10px] hover:text-red-700"><LogOut size={16}/> {isExpanded && "Sair"}</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className={`h-20 border-b flex items-center justify-between px-8 ${darkMode ? "bg-[#020617] border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-slate-100 rounded-lg"><Menu size={20}/></button>
            <h1 className="text-sm font-black uppercase italic tracking-widest text-slate-400">
              {menuItems.find(i => i.id === activeTab)?.label || "Dashboard"}
            </h1>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all">{darkMode ? <Sun size={20} className="text-amber-500"/> : <Moon size={20} className="text-slate-600"/>}</button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};

export default DashboardEnfermeiro;