import React, { useState } from "react";
import { 
  LayoutDashboard, 
  UserPlus, 
  ClipboardList, 
  Stethoscope,
  ChevronRight,
  LogOut,
  Users,
  Briefcase,
  FolderSearch // Novo ícone para a Pasta Digital
} from "lucide-react";

// 🏠 Importações das páginas
import HomeEnfermeiro from "../../pages/HomeEnfermeiro"; 
import AtendimentoEnfermagem from "../../pages/atendimento/AtendimentoEnfermagem";
import HistoricoAtendimentos from "../../pages/atendimento/HistoricoAtendimentos";
import FormCadastroAluno from "../../pages/cadastros/FormCadastroAluno";
import FormCadastroFuncionario from "../../pages/cadastros/FormCadastroFuncionario";
import PastaDigital from "../PastaDigital"; // Certifique-se de que o caminho está correto

const DashboardEnfermeiro = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [cadastroMode, setCadastroMode] = useState("aluno"); 

  const menuItems = [
    { id: "home", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "atendimento", label: "Atendimento", icon: <Stethoscope size={18} /> },
    { id: "pasta_digital", label: "Pasta Digital", icon: <FolderSearch size={18} /> }, // Nova aba
    { id: "pacientes", label: "Cadastros", icon: <UserPlus size={18} /> }, 
    { id: "historico", label: "BAMs Antigos", icon: <ClipboardList size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeEnfermeiro 
            user={user} 
            onIniciarAtendimento={() => setActiveTab("atendimento")} 
            onAbrirHistorico={() => setActiveTab("historico")}
            onAbrirCadastros={() => setActiveTab("pacientes")}
            onAbrirPastaDigital={() => setActiveTab("pasta_digital")} // Link para a nova função
          />
        );
      
      case "atendimento":
        return <AtendimentoEnfermagem user={user} onVoltar={() => setActiveTab("home")} />;
      
      case "pasta_digital":
        return <PastaDigital onVoltar={() => setActiveTab("home")} />;
      
      case "historico":
        return <HistoricoAtendimentos user={user} onVoltar={() => setActiveTab("home")} />;
      
      case "pacientes":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Seletor Dinâmico de Formulário */}
            <div className="flex bg-slate-200/50 p-1.5 rounded-[20px] max-w-[400px] mx-auto mb-8 shadow-inner">
              <button 
                onClick={() => setCadastroMode("aluno")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[15px] font-black text-[10px] uppercase tracking-widest transition-all ${
                  cadastroMode === "aluno" 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Users size={14} /> Aluno
              </button>
              <button 
                onClick={() => setCadastroMode("funcionario")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[15px] font-black text-[10px] uppercase tracking-widest transition-all ${
                  cadastroMode === "funcionario" 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Briefcase size={14} /> Funcionário
              </button>
            </div>

            {/* Renderização Condicional do Form */}
            {cadastroMode === "aluno" ? (
              <FormCadastroAluno onVoltar={() => setActiveTab("home")} />
            ) : (
              <FormCadastroFuncionario onVoltar={() => setActiveTab("home")} />
            )}
          </div>
        );
      
      default:
        return <HomeEnfermeiro user={user} onIniciarAtendimento={() => setActiveTab("atendimento")} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* SIDEBAR LATERA */}
      <aside className="w-64 bg-[#0A1629] text-white flex flex-col shrink-0 shadow-2xl border-r border-white/5">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-bold tracking-[0.3em] text-blue-400 uppercase leading-none">Rodhon</span>
               <h2 className="text-xl font-black tracking-tighter uppercase italic">Med<span className="text-blue-500">Sys</span></h2>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${
                  activeTab === item.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={activeTab === item.id ? "text-white" : "group-hover:text-blue-400"}>
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-widest italic">{item.label}</span>
                </div>
                {activeTab === item.id && <ChevronRight size={14} className="opacity-50" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Rodapé do Usuário */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs italic shadow-inner shrink-0">
              {user?.displayName?.substring(0, 2).toUpperCase() || "EF"}
            </div>
            <div className="flex flex-col overflow-hidden text-white uppercase italic font-black text-[10px]">
              <span className="truncate">{user?.displayName || "Enfermeiro"}</span>
              <span className="text-[8px] text-blue-400 tracking-widest not-italic">Módulo Enfermagem</span>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sair</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative scroll-smooth">
        <div className="p-8 md:p-12 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DashboardEnfermeiro;