import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  // 1. Se não estiver logado, manda para o login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. VERIFICAÇÃO DE BLOQUEIO (Adicione isto aqui!)
  // Se o status for bloqueado, ele não pode ver NADA dentro das rotas protegidas
  if (user.licencaStatus === 'bloqueado') {
    return <Navigate to="/bloqueio" replace />;
  }

  // 3. Se o usuário precisa trocar a senha (Primeiro Acesso)
  if (user.primeiroAcesso === true) {
    // Se você tiver uma rota de troca de senha, mande para lá. 
    // Caso contrário, o componente TrocarSenha será renderizado pelo App.jsx
  }

  // 4. Verificação de Papéis (Roles)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};