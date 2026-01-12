import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout'; 
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Contexto de Autenticação
import { AuthProvider, useAuth } from './context/AuthContext';

// Importação das Páginas de Administração
import CadastrarUsuario from './pages/cadastros/CadastrarUsuario';
import GestaoUsuarios from './pages/Admin/GestaoUsuarios';
import ControleLicencas from './pages/Admin/ControleLicencas'; // Importação nova

// Componente para proteger rotas
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
        <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">Verificando...</span>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider> 
      <BrowserRouter>
        <Routes>
          {/* Rota Pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas Protegidas (Dentro do Layout com Sidebar e Header) */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            {/* Index carrega a Dashboard */}
            <Route index element={<Dashboard />} />
            
            {/* Gestão de Acessos e Funcionários */}
            <Route path="cadastrar-usuario" element={<CadastrarUsuario />} />
            <Route path="usuarios" element={<GestaoUsuarios />} />
            
            {/* Controle de Licenças (Componente Novo) */}
            <Route path="licencas" element={<ControleLicencas />} /> 
            
            {/* Rotas Administrativas Extras */}
            <Route path="admin/unidades" element={<div className="p-8 font-bold text-slate-400">Gerenciamento de Unidades em Breve</div>} />
            <Route path="admin/config" element={<div className="p-8 font-bold text-slate-400">Painel de Configurações Master</div>} />
          </Route>

          {/* Redireciona qualquer rota desconhecida para o início */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;