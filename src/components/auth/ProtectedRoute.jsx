import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900 mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verificando Credenciais...</p>
      </div>
    );
  }

  // 1. Se não estiver logado, manda para o login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. VERIFICAÇÃO DE BLOQUEIO REFORÇADA
  // Checamos todas as variantes de campos de status para garantir o bloqueio
  const isBloqueado = 
    user.status === 'bloqueado' || 
    user.licencaStatus === 'bloqueada' || 
    user.statusLicenca === 'bloqueada';

  if (isBloqueado) {
    // Redireciona para uma tela de aviso ou de volta para o login
    // Se você não tiver a rota "/bloqueio", pode usar "/login"
    return <Navigate to="/login" replace />;
  }

  // 3. Verificação de Primeiro Acesso
  // Se ele for um usuário comum e for o primeiro acesso, obriga a troca de senha
  if (user.primeiroAcesso === true && location.pathname !== '/alterar-senha') {
    return <Navigate to="/alterar-senha" replace />;
  }

  // 4. Verificação de Papéis (Roles)
  // O root sempre tem acesso, os demais verificamos o array de permissões
  if (allowedRoles && user.role !== 'root' && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Ou uma página de "Sem permissão"
  }

  return children;
};