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

// Páginas de Negócio
import Dashboard from './pages/Dashboard';
import CadastrarUsuario from './pages/cadastros/CadastrarUsuario';
import GestaoUsuarios from './pages/Admin/GestaoUsuarios';
import ControleLicencas from './pages/Admin/ControleLicencas';

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
  
  // 1. Não logado
  if (!user) return <Navigate to="/login" replace />;

  // 2. Trava de Primeiro Acesso (🚨 CORRIGIDO AQUI)
  // Se o campo primeiroAcesso for true, ele não deixa ver nada e manda pra TrocarSenha
  if (user?.primeiroAcesso === true) {
    return <TrocarSenha />;
  }

  // 3. Trava de Bloqueio
  const estaBloqueado = 
    user?.status === "bloqueado" || 
    user?.licencaStatus === "bloqueado" || 
    user?.statusLicenca === "bloqueada";

  if (estaBloqueado && user?.role !== 'root') {
    return <Navigate to="/bloqueado" replace />;
  }

  // 4. Trava de Expiração de Tempo
  if (user?.role !== 'root' && user?.dataExpiracao) {
    const hoje = new Date();
    const dataExp = new Date(user.dataExpiracao);
    
    if (dataExp < hoje) {
      return <Navigate to="/expirado" replace />;
    }
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider> 
      <BrowserRouter>
        <Routes>
          {/* ROTAS PÚBLICAS */}
          <Route path="/login" element={<Login />} />
          <Route path="/bloqueado" element={<Bloqueado />} />
          <Route path="/expirado" element={<Expirado />} />
          
          {/* 🚨 NOVA ROTA: Adicionada explicitamente caso queira navegar via URL */}
          <Route path="/trocar-senha" element={<TrocarSenha />} />
          
          {/* ROTAS PROTEGIDAS */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <GuardiaoSessao />
              </PrivateRoute>
            }
          >
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="cadastrar-usuario" element={<CadastrarUsuario />} />
              <Route path="usuarios" element={<GestaoUsuarios />} />
              <Route path="licencas" element={<ControleLicencas />} /> 
              
              <Route path="admin/unidades" element={<div className="p-20 font-black uppercase italic text-slate-300 text-3xl tracking-tighter opacity-20">Unidades Escolares</div>} />
              <Route path="admin/config" element={<div className="p-20 font-black uppercase italic text-slate-300 text-3xl tracking-tighter opacity-20">Configurações Master</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;