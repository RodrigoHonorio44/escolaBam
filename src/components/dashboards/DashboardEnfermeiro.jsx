import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebase/firebaseConfig"; 
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, UserPlus, ClipboardList, Stethoscope,
  ChevronDown, LogOut, FolderSearch, Lock,
  Settings, Bell, FileBarChart, Menu, ChevronLeft, 
  Sun, Moon, LifeBuoy, ArrowUpRight, MessageSquare, Mail, AlertTriangle, ShieldAlert
} from "lucide-react";

// Importações de páginas
import HomeEnfermeiro from "../../pages/HomeEnfermeiro"; 
import AtendimentoEnfermagem from "../../pages/atendimento/AtendimentoEnfermagem";
import HistoricoAtendimentos from "../../pages/atendimento/HistoricoAtendimentos";
import FormCadastroAluno from "../../pages/cadastros/FormCadastroAluno";
import FormCadastroFuncionario from "../../pages/cadastros/FormCadastroFuncionario";
import PastaDigital from "../PastaDigital";
import QuestionarioSaude from "../../pages/cadastros/QuestionarioSaude"; 

// --- TELA DE BLOQUEIO DE LICENÇA (OVERLAY CRÍTICO) ---
const TelaBloqueioLicenca = ({ darkMode, onLogout }) => (
  <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-6 backdrop-blur-md ${darkMode ? "bg-black/90" : "bg-slate-900/80"}`}>
    <div className={`max-w-md w-full p-10 rounded-[40px] text-center shadow-2xl animate-in zoom-in duration-300 ${darkMode ? "bg-[#0F1C2E] border border-white/10" : "bg-white"}`}>
      <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <ShieldAlert size={40} />
      </div>
      <h2 className={`text-2xl font-black uppercase italic tracking-tighter mb-4 ${darkMode ? "text-white" : "text-slate-900"}`}>
        Acesso <span className="text-rose-500">Suspenso</span>
      </h2>
      <p className={`text-sm leading-relaxed mb-8 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        Sua licença no <span className="font-bold italic text-blue-500">Rodhon BAENF</span> expirou ou foi desativada pela administração. Entre em contato com o suporte para regularizar.
      </p>
      <div className="space-y-3">
        <a 
          href="https://wa.me/5521975966330?text=Olá!%20Meu%20acesso%20ao%20BAENF%20aparece%20como%20suspenso." 
          target="_blank" rel="noreferrer"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic text-[11px] tracking-widest py-5 rounded-2xl transition-all"
        >
          Falar com Suporte
        </a>
        <button onClick={onLogout} className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-rose-500 transition-colors">
          Sair do Sistema
        </button>
      </div>
    </div>
  </div>
);

// --- TELA DE SUPORTE ---
const TelaSuporte = ({ darkMode }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 animate-in fade-in zoom-in duration-500">
    <div className={`max-w-md w-full p-12 rounded-[50px] border transition-all duration-500 relative overflow-hidden ${
      darkMode ? "bg-[#0F1C2E] border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-xl"
    }`}>
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
      <div className="flex flex-col items-center text-center relative z-10">
        <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mb-8 rotate-3 shadow-2xl ${darkMode ? "bg-blue-600 text-white" : "bg-[#0F172A] text-white"}`}>
          <LifeBuoy size={40} strokeWidth={1.5} />
        </div>
        <h2 className={`text-3xl font-black uppercase italic tracking-tighter leading-none mb-4 ${darkMode ? "text-white" : "text-slate-900"}`}>
          Suporte <br/> <span className="text-blue-600">Técnico</span>
        </h2>
        <p className={`text-sm font-medium leading-relaxed mb-10 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Olá! Eu sou o desenvolvedor do <span className="font-bold italic text-blue-500">Rodhon BAENF</span>. Escolha um canal abaixo para falar diretamente comigo.
        </p>
        <div className="w-full space-y-4">
          <a href="https://wa.me/5521975966330" target="_blank" rel="noreferrer" className="flex items-center justify-between w-full bg-[#25D366] text-white font-black uppercase italic text-[11px] tracking-widest px-8 py-6 rounded-[24px] shadow-lg group">
            <div className="flex items-center gap-4"><MessageSquare size={18} fill="currentColor" /><span>WhatsApp Direto</span></div>
            <ArrowUpRight size={18} />
          </a>
          <a href="mailto:rodrigohono21@gmail.com" className={`flex items-center justify-between w-full font-black uppercase italic text-[11px] tracking-widest px-8 py-6 rounded-[24px] border ${darkMode ? "border-white/10 text-white" : "border-slate-200 text-slate-700"}`}>
            <div className="flex items-center gap-4"><Mail size={18} /><span>E-mail</span></div>
            <span className="text-[9px] opacity-50 lowercase font-medium italic">rodrigohono21@gmail.com</span>
          </a>
        </div>
      </div>
    </div>
  </div>
);

const DashboardEnfermeiro = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState("home");
  const [cadastroMode, setCadastroMode] = useState("aluno");
  const [menuAberto, setMenuAberto] = useState(null); 
  const [isExpanded, setIsExpanded] = useState(true);
  const [darkMode, setDarkMode] = useState(true); 
  
  // ✅ NOVO ESTADO PARA RECEBER DADOS DA PASTA DIGITAL
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
    if (user?.status === 'bloqueado') return false;
    if (user?.statusLicenca === 'bloqueada') return false;
    if (!user?.modulosSidebar) return true;
    return user.modulosSidebar[itemKey] !== false;
  };

  const isUsuarioBloqueado = user?.status === 'bloqueado' || user?.statusLicenca === 'bloqueada';

  // ✅ NOVA FUNÇÃO PARA TRATAR O CLIQUE NA PASTA DIGITAL
  const handleNovoAtendimentoDaPasta = (payload) => {
    // payload é { tipo: 'ALUNO' ou 'FUNCIONARIO', dados: { ... } }
    setDadosParaEdicao(payload.dados);
    setCadastroMode(payload.tipo.toLowerCase()); // 'aluno' ou 'funcionario'
    setActiveTab("pacientes"); // Muda para a aba de cadastros
  };

  const menuItems = [
    { id: "home", label: "Dashboard", icon: <LayoutDashboard size={20} />, key: "dashboard" },
    { id: "atendimento", label: "Atendimento", icon: <Stethoscope size={20} />, key: "atendimento" },
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
    { id: "relatorio_geral", label: "Relatório Geral", icon: <FileBarChart size={20} />, key: "dashboard" },
  ];

  const theme = {
    sidebarBg: darkMode ? "bg-[#0A1629]" : "bg-white",
    sidebarText: darkMode ? "text-slate-400" : "text-slate-600",
    sidebarActive: darkMode ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-blue-50 text-blue-600",
    contentBg: darkMode ? "bg-[#050B18]" : "bg-slate-50",
    border: darkMode ? "border-white/5" : "border-slate-200"
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home": return <HomeEnfermeiro user={user} setActiveTab={setActiveTab} isLiberado={isLiberado} darkMode={darkMode} />;
      case "atendimento": return <AtendimentoEnfermagem user={user} onVoltar={() => setActiveTab("home")} />;
      
      // ✅ ATUALIZADO: PASSA A NOVA FUNÇÃO PARA A PASTA DIGITAL
      case "pasta_digital": return <PastaDigital onVoltar={() => setActiveTab("home")} onNovoAtendimento={handleNovoAtendimentoDaPasta} />;
      
      case "historico": return <HistoricoAtendimentos user={user} onVoltar={() => setActiveTab("home")} />;
      case "suporte": return <TelaSuporte darkMode={darkMode} />;
      
      case "pacientes":
        // Limpamos os dados de edição ao sair ou cancelamos? 
        // Passamos 'dadosIniciais' para os formulários
        if (cadastroMode === "aluno") return <FormCadastroAluno dadosIniciais={dadosParaEdicao} onVoltar={() => { setActiveTab("home"); setDadosParaEdicao(null); }} />;
        if (cadastroMode === "funcionario") return <FormCadastroFuncionario dadosIniciais={dadosParaEdicao} onVoltar={() => { setActiveTab("home"); setDadosParaEdicao(null); }} />;
        if (cadastroMode === "saude_escolar") return <QuestionarioSaude onVoltar={() => { setActiveTab("home"); setDadosParaEdicao(null); }} />;
        return <FormCadastroAluno onVoltar={() => setActiveTab("home")} />;
      
      case "relatorio_geral": return <div className={`p-10 font-black uppercase italic ${theme.sidebarText}`}>Relatórios Consolidados</div>;
      default: return <HomeEnfermeiro user={user} darkMode={darkMode} />;
    }
  };

  return (
    <div className={`fixed inset-0 z-[999] flex h-screen w-screen overflow-hidden font-sans transition-colors duration-500 ${theme.contentBg}`}>
      {isUsuarioBloqueado && <TelaBloqueioLicenca darkMode={darkMode} onLogout={handleLogoutClick} />}

      {/* SIDEBAR SLIM */}
      <div className={`w-16 flex flex-col items-center py-8 gap-8 border-r shrink-0 z-50 ${darkMode ? "bg-[#050B18] border-white/5" : "bg-slate-100 border-slate-200"}`}>
          <div className="text-blue-500"><Stethoscope size={24} /></div>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl transition-all ${darkMode ? "text-yellow-400 hover:bg-white/5" : "text-slate-600 hover:bg-slate-200"}`}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className={`${darkMode ? "text-slate-600 hover:text-white" : "text-slate-400 hover:text-slate-900"}`}><Bell size={20} /></button>
          <button className={`${darkMode ? "text-slate-600 hover:text-white" : "text-slate-400 hover:text-slate-900"}`}><Settings size={20} /></button>
          <button onClick={() => setActiveTab("suporte")} className={`mt-auto mb-4 p-2 rounded-xl transition-all ${activeTab === "suporte" ? "bg-blue-600 text-white" : "text-emerald-500/50 hover:bg-white/5"}`}>
             <LifeBuoy size={20} />
          </button>
      </div>

      {/* SIDEBAR PRINCIPAL */}
      <aside className={`${isExpanded ? "w-64" : "w-0 overflow-hidden"} ${theme.sidebarBg} flex flex-col shrink-0 transition-all duration-300 relative border-r ${theme.border} shadow-2xl`}>
        <button onClick={() => setIsExpanded(!isExpanded)} className={`absolute -right-3 top-24 rounded-full p-1 border z-50 ${darkMode ? "bg-[#0A1629] border-white/10 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}>
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
                      else { 
                        setActiveTab(item.id); 
                        setMenuAberto(null); 
                        setDadosParaEdicao(null); // Limpa dados ao trocar manualmente de aba
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                      !liberado ? "opacity-30 cursor-not-allowed grayscale" : 
                      isActive ? theme.sidebarActive : `${theme.sidebarText} hover:bg-blue-500/5 hover:text-blue-500`
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
                    <div className={`ml-9 mt-2 space-y-2 border-l pl-4 ${darkMode ? "border-white/10" : "border-slate-200"}`}>
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

        <div className={`p-6 border-t ${theme.border} ${darkMode ? "bg-black/20" : "bg-slate-50"}`}>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-lg uppercase">
              {user?.nome?.substring(0, 2) || "EN"}
            </div>
            <div className="flex flex-col overflow-hidden uppercase font-black italic">
              <span className={`text-[10px] truncate ${darkMode ? "text-white" : "text-slate-900"}`}>{user?.nome || "Usuário"}</span>
              <span className="text-blue-500 text-[7px] tracking-widest">Enfermagem</span>
            </div>
          </div>
          <button onClick={handleLogoutClick} className="flex items-center gap-3 text-red-500/80 hover:text-red-500 px-2 transition-all">
            <LogOut size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className={`h-20 border-b flex items-center justify-between px-8 shrink-0 ${darkMode ? "bg-[#0A1629] border-white/5" : "bg-white border-slate-200"}`}>
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

        <main className="flex-1 overflow-y-auto p-8 md:p-12 max-w-7xl mx-auto w-full">
            {renderContent()}
        </main>

        <footer className={`p-6 border-t flex justify-between items-center ${darkMode ? "bg-[#0A1629]/50 border-white/5 text-slate-500" : "bg-white border-slate-200 text-slate-400"}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest">Rodhon BAENF v2.5</span>
          <span className="text-[9px] font-black italic">© 2026</span>
        </footer>
      </div>
    </div>
  );
};

export default DashboardEnfermeiro;