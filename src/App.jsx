import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout e Guardião
import Layout from './components/Layout/Layout'; 
import GuardiaoSessao from './components/GuardiaoSessao';

// Páginas de Acesso e Segurança
import Login from './pages/Login';
import TrocarSenha from './components/auth/TrocarSenha';
import Bloqueado from './pages/Bloqueado'; 
import Expirado from './pages/Expirado';

// Dashboard e Negócio
import DashboardMain from './components/dashboards/DashboardMain';
import CadastrarUsuario from './pages/cadastros/CadastrarUsuario';
import GestaoUsuarios from './pages/Admin/GestaoUsuarios';
import ControleLicencas from './pages/Admin/ControleLicencas';

// Formulários de Negócio
import FormCadastroAluno from './pages/cadastros/FormCadastroAluno'; 
import FormCadastroFuncionario from './pages/cadastros/FormCadastroFuncionario';
import PastaDigital from './components/PastaDigital';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4 shadow-lg shadow-blue-100"></div>
        <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest animate-pulse italic">
          Sincronizando Segurança Rodhon...
        </p>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;

  // 🛡️ DEFINIÇÃO DE ROOT (IMUNIDADE TOTAL)
  const isRoot = user?.role === 'root' || user?.email === "rodrigohono21@gmail.com";

  if (!isRoot) {
    // 1. TRAVA DE TROCA DE SENHA
    const precisaTrocar = user?.primeiroAcesso === true || !user?.dataUltimaTroca;
    if (precisaTrocar) {
      return <Navigate to="/trocar-senha" replace />;
    }

    // 2. TRAVA DE BLOQUEIO
    const estaBloqueado = 
      user?.status === "bloqueado" || 
      user?.licencaStatus === "bloqueada" || 
      user?.statusLicenca === "bloqueada";

    if (estaBloqueado) {
      return <Navigate to="/bloqueado" replace />;
    }

    // 3. TRAVA DE EXPIRAÇÃO
    if (user?.dataExpiracao) {
      const hoje = new Date();
      const dataExp = new Date(user.dataExpiracao);
      if (dataExp < hoje) {
        return <Navigate to="/expirado" replace />;
      }
    }
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider> 
      <BrowserRouter>
        <Routes>
          {/* ROTAS PÚBLICAS / INDEPENDENTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/bloqueado" element={<Bloqueado />} />
          <Route path="/expirado" element={<Expirado />} />
          
          {/* A rota de troca de senha deve ficar FORA do PrivateRoute para evitar o loop de redirecionamento */}
          <Route path="/trocar-senha" element={<TrocarSenha />} />
          
          {/* BLOCO DE ROTAS PROTEGIDAS */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <GuardiaoSessao />
              </PrivateRoute>
            }
          >
            {/* O Layout só renderiza se o PrivateRoute e o Guardiao permitirem */}
            <Route element={<Layout />}>
              <Route index element={<DashboardMain />} />
              <Route path="cadastrar-usuario" element={<CadastrarUsuario />} />
              <Route path="usuarios" element={<GestaoUsuarios />} />
              <Route path="licencas" element={<ControleLicencas />} /> 
              
              <Route path="cadastro-aluno" element={<FormCadastroAluno onVoltar={() => window.history.back()} />} />
              <Route path="cadastro-funcionario" element={<FormCadastroFuncionario onVoltar={() => window.history.back()} />} />
              <Route path="pasta-digital" element={<PastaDigital onVoltar={() => window.history.back()} />} />

              {/* Placeholders para Admin */}
              <Route path="admin/unidades" element={<div className="p-20 font-black uppercase italic text-slate-300 text-3xl tracking-tighter opacity-20">Unidades Escolares</div>} />
              <Route path="admin/config" element={<div className="p-20 font-black uppercase italic text-slate-300 text-3xl tracking-tighter opacity-20">Configurações Master</div>} />
            </Route>
          </Route>

          {/* CATCH ALL */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;