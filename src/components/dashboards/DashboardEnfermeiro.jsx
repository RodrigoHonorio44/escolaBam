import React, { useState } from "react";
import { 
  LayoutDashboard, 
  UserPlus, 
  ClipboardList, 
  Stethoscope,
  Users
} from "lucide-react";

// 🏠 Importação da Home (Métricas e Cards)
import HomeEnfermeiro from "../../pages/HomeEnfermeiro";

// 🏥 Importações da pasta ATENDIMENTO
import AtendimentoEnfermagem from "../../pages/atendimento/AtendimentoEnfermagem";
import HistoricoAtendimentos from "../../pages/atendimento/HistoricoAtendimentos";

// 📝 Importações da pasta CADASTROS (🚨 CORRIGIDO: Agora com "s")
import CadastroPaciente from "../../pages/cadastros/CadastroPaciente";
import FormCadastroAluno from "../../pages/cadastros/FormCadastroAluno";
import FormCadastroFuncionario from "../../pages/cadastros/FormCadastroFuncionario";

const DashboardEnfermeiro = ({ user }) => {
  // Estado para controlar qual tela o enfermeiro está vendo
  const [activeTab, setActiveTab] = useState("home");

  // Função para renderizar o conteúdo dinamicamente
  const renderContent = () => {
    switch (activeTab) {
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
        return (
          <HomeEnfermeiro 
            user={user} 
            onIniciarAtendimento={() => setActiveTab("atendimento")} 
            onAbrirHistorico={() => setActiveTab("historico")}
            onAbrirCadastros={() => setActiveTab("cadastro_paciente")} // Função para o botão de cadastros
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="p-4 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DashboardEnfermeiro;