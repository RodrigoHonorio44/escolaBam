import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db, auth } from "../../firebase/firebaseConfig"; 
import { doc, onSnapshot, collection, getDocs, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, UserPlus, ClipboardList, Stethoscope,
  ChevronDown, LogOut, FolderSearch, Brain, 
  Menu, Sun, Moon, LifeBuoy, ShieldAlert, BarChart3, 
  Contact, Zap
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

  // Memoização de permissões
  const cargoLower = useMemo(() => user?.role?.toLowerCase() || "", [user]);
  const isRoot = useMemo(() => cargoLower === 'root' || user?.email === "rodrigohono21@gmail.com", [cargoLower, user]);

  // Lógica de Unidade Ativa
  const inspecaoId = localStorage.getItem('inspecao_unidade_id'); 
  const inspecaoNome = localStorage.getItem('inspecao_unidade_nome'); 
  const modoInspecao = localStorage.getItem('modo_inspecao') === 'true';

  const userComUnidadeInspecionada = useMemo(() => {
    if (!user) return null;
    if (modoInspecao && inspecaoId && isRoot) {
      return { 
        ...user, 
        escolaId: inspecaoId.toLowerCase().trim(),
        escola: inspecaoNome 
      };
    }
    return user;
  }, [user, inspecaoId, inspecaoNome, modoInspecao, isRoot]);

  // Snapshot do usuário para atualizações em tempo real
  useEffect(() => {
    const userId = initialUser?.uid || initialUser?.id;
    if (!userId) return;
    const unsub = onSnapshot(doc(db, "usuarios", userId), (docSnap) => {
      if (docSnap.exists()) setUser({ id: docSnap.id, ...docSnap.data() });
    });
    return () => unsub();
  }, [initialUser?.uid, initialUser?.id]);

  // ✅ BUSCA GLOBAL (Alimenta Home, Histórico e Auditoria)
  useEffect(() => {
    const fetchGlobalData = async () => {
      if (!user) return; 

      try {
        let qAtend = collection(db, "atendimentos_enfermagem");
        let qAlunos = collection(db, "pastas_digitais");

        if (!isRoot || modoInspecao) {
          const idParaFiltro = modoInspecao ? inspecaoId : user?.escolaId;
          
          if (idParaFiltro) {
            const normalizedId = idParaFiltro.toLowerCase().trim();
            qAtend = query(qAtend, where("escolaId", "==", normalizedId));
            qAlunos = query(qAlunos, where("escolaId", "==", normalizedId));
          } else if (!isRoot) {
            return;
          }
        }

        const [snapAtend, snapPastas] = await Promise.all([
          getDocs(qAtend),
          getDocs(qAlunos)
        ]);

        setAtendimentosRaw(snapAtend.docs.map(d => ({ id: d.id, ...d.data() })));
        setAlunosRaw(snapPastas.docs.map(d => ({ id: d.id, ...d.data() })));
        
      } catch (err) { 
        console.error("Erro na busca global:", err); 
      }
    };

    fetchGlobalData();
  }, [user, isRoot, modoInspecao, inspecaoId]);

  const handleLogoutClick = async () => {
    try { 
      localStorage.removeItem('inspecao_unidade_id');
      localStorage.removeItem('modo_inspecao');
      if (onLogout) await onLogout(); 
      await signOut(auth); 
      window.location.replace("/login"); 
    } catch (error) { console.error(error); }
  };

  const isLiberado = (itemKey) => {
    if (isRoot || cargoLower === "admin") return true;
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
    const commonProps = { 
        user: userComUnidadeInspecionada, 
        darkMode, 
        onVoltar: () => { setActiveTab("home"); setDadosParaEdicao(null); } 
    };

    switch (activeTab) {
      case "home": 
        return (
          <HomeEnfermeiro 
            {...commonProps} 
            setActiveTab={setActiveTab} 
            isLiberado={isLiberado} 
            visaoMensal={visaoMensal} 
            setVisaoMensal={setVisaoMensal}
            atendimentos={atendimentosRaw} // ✅ Passando atendimentos para as bolinhas da Home
          />
        );
      case "atendimento": return <AtendimentoEnfermagem {...commonProps} />;
      case "contato": return <ContatoAluno {...commonProps} />;
      case "pasta_digital": return <PastaDigital {...commonProps} onNovoAtendimento={(p) => { setDadosParaEdicao(p.dados); setCadastroMode(p.tipo.toLowerCase()); setActiveTab("pacientes"); }} onAbrirQuestionario={(p) => { setDadosParaEdicao(p.dados); setCadastroMode("saude_escolar"); setActiveTab("pacientes"); }} />;
      case "pacientes":
        if (cadastroMode === "aluno") return <FormCadastroAluno {...commonProps} dadosEdicao={dadosParaEdicao} />;
        if (cadastroMode === "funcionario") return <FormCadastroFuncionario {...commonProps} dadosEdicao={dadosParaEdicao} />;
        if (cadastroMode === "saude_escolar") return <QuestionarioSaude {...commonProps} dadosEdicao={dadosParaEdicao} onVoltar={() => setActiveTab("pasta_digital")} />;
        return <FormCadastroAluno {...commonProps} />;
      
      // ✅ CORREÇÃO: Passando atendimentosRaw para o Histórico para habilitar bolinhas e fluxo clínico
      case "historico": 
        return <HistoricoAtendimentos {...commonProps} atendimentosRaw={atendimentosRaw} />;
      
      case "auditoria": return <RelatorioMedicoPro {...commonProps} atendimentosRaw={atendimentosRaw} alunosRaw={alunosRaw} />;
      case "alunos_especiais": return <DashboardSaudeInclusiva {...commonProps} setDadosParaEdicao={setDadosParaEdicao} setActiveTab={setActiveTab} />;
      default: return <HomeEnfermeiro {...commonProps} setActiveTab={setActiveTab} isLiberado={isLiberado} atendimentos={atendimentosRaw} />;
    }
  };

  return (
    <div className={`fixed inset-0 z-[999] flex h-screen w-screen overflow-hidden font-sans ${darkMode ? "bg-black" : "bg-slate-50"}`}>
      
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
                  {item.subItems && isMenuOpen && isExpanded && (
                    <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-100 pl-4">
                      {item.subItems.map((sub) => (
                        <button key={sub.id} onClick={() => { setActiveTab(item.id); setCadastroMode(sub.id); }} className={`w-full text-left py-2 px-3 rounded-lg text-[9px] font-black uppercase italic transition-all ${cadastroMode === sub.id && activeTab === item.id ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}>{sub.label}</button>
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
            <div className="flex flex-col">
                <h1 className="text-sm font-black uppercase italic tracking-widest text-slate-400 leading-none">
                  {menuItems.find(i => i.id === activeTab)?.label || "Dashboard"}
                </h1>
                
                {isRoot && (
                  <div className="flex items-center gap-2 mt-1">
                    <select 
                      value={modoInspecao ? inspecaoId : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          localStorage.removeItem('inspecao_unidade_id');
                          localStorage.removeItem('inspecao_unidade_nome');
                          localStorage.setItem('modo_inspecao', 'false');
                        } else {
                          localStorage.setItem('inspecao_unidade_id', val.toLowerCase());
                          localStorage.setItem('inspecao_unidade_nome', e.target.options[e.target.selectedIndex].text);
                          localStorage.setItem('modo_inspecao', 'true');
                        }
                        window.location.reload();
                      }}
                      className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase italic px-2 py-0.5 rounded-md outline-none border border-blue-100 cursor-pointer"
                    >
                      <option value="">🚀 Visão Global (Root)</option>
                      <option value="joana benedicta">Joana Benedicta</option>
                      <option value="caio giromba">Caio Giromba</option>
                      <option value="rogeria dos santos silva">Rogeria Silva</option>
                    </select>
                  </div>
                )}

                {!isRoot && (
                   <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase italic">
                    {user?.escola || "Unidade não identificada"}
                   </span>
                )}
            </div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all">{darkMode ? <Sun size={20} className="text-amber-500"/> : <Moon size={20} className="text-slate-600"/>}</button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};

export default DashboardEnfermeiro;