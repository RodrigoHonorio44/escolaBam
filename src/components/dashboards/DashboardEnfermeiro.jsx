import React, { useState } from "react";
import { 
  LayoutDashboard, 
  UserPlus, 
  ClipboardList, 
  Stethoscope,
  ChevronRight,
  LogOut
} from "lucide-react";

// 🏠 Importações das páginas
import HomeEnfermeiro from "../../pages/HomeEnfermeiro"; 
import AtendimentoEnfermagem from "../../pages/atendimento/AtendimentoEnfermagem";
import HistoricoAtendimentos from "../../pages/atendimento/HistoricoAtendimentos";
import CadastroPaciente from "../../pages/cadastros/CadastroPaciente";
import FormCadastroAluno from "../../pages/cadastros/FormCadastroAluno";
import FormCadastroFuncionario from "../../pages/cadastros/FormCadastroFuncionario";

const DashboardEnfermeiro = ({ user, onLogout }) => {
  // Estado que controla qual tela aparece
  const [activeTab, setActiveTab] = useState("home");

  // Itens do Menu Lateral
  const menuItems = [
    { id: "home", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "atendimento", label: "Atendimento", icon: <Stethoscope size={18} /> },
    { id: "cadastro_paciente", label: "Pacientes", icon: <UserPlus size={18} /> },
    { id: "historico", label: "Histórico", icon: <ClipboardList size={18} /> },
  ];

  // Gerenciador de Roteamento Interno
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeEnfermeiro 
            user={user} 
            onIniciarAtendimento={() => setActiveTab("atendimento")} 
            onAbrirHistorico={() => setActiveTab("historico")}
            onAbrirCadastros={() => setActiveTab("cadastro_paciente")}
          />
        );
      case "atendimento":
        return <AtendimentoEnfermagem user={user} onVoltar={() => setActiveTab("home")} />;
      
      case "historico":
        return <HistoricoAtendimentos user={user} onVoltar={() => setActiveTab("home")} />;
      
      case "cadastro_paciente":
        return (
          <CadastroPaciente 
            onVoltar={() => setActiveTab("home")} 
            onNovoAluno={() => setActiveTab("novo_aluno")}
            onNovoFuncionario={() => setActiveTab("novo_funcionario")}
          />
        );
      
      case "novo_aluno":
        return <FormCadastroAluno onVoltar={() => setActiveTab("cadastro_paciente")} />;
      
      case "novo_funcionario":
        return <FormCadastroFuncionario onVoltar={() => setActiveTab("cadastro_paciente")} />;
      
      default:
        // Caso ocorra erro de ID, volta para a home em vez de dar tela branca
        return <HomeEnfermeiro user={user} onIniciarAtendimento={() => setActiveTab("atendimento")} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-900">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#0A1629] text-white flex flex-col shrink-0 shadow-2xl border-r border-white/5">
        <div className="p-6 flex-1">
          {/* Logo RodhonMedSys */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-bold tracking-[0.3em] text-blue-400 uppercase leading-none">Rodhon</span>
               <h2 className="text-xl font-black tracking-tighter uppercase italic">
                Med<span className="text-blue-500">Sys</span>
              </h2>
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

        {/* Rodapé: Usuário e Sair */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs italic shadow-inner shrink-0">
              {user?.displayName?.substring(0, 2).toUpperCase() || "EF"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-black uppercase italic truncate text-white">
                {user?.displayName || "Enfermeiro"}
              </span>
              <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">Módulo Enfermagem</span>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* --- ÁREA DE CONTEÚDO --- */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        <div className="p-8 md:p-12 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DashboardEnfermeiro;