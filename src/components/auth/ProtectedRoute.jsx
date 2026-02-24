import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. TELA DE CARREGAMENTO (ESTILIZADA)
  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Rodhon Security <span className="text-blue-500">· Validando...</span>
        </p>
      </div>
    );
  }

  // 2. SE NÃO ESTIVER LOGADO
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🛡️ NORMALIZAÇÃO PARA PADRÃO "R S" (Lowercase)
  const userRole = user.role?.toLowerCase().trim();
  const userStatus = user.status?.toLowerCase().trim();
  const licencaStatus = user.licencaStatus?.toLowerCase().trim() || user.statusLicenca?.toLowerCase().trim();

  // 3. IMUNIDADE ROOT (Rodrigo pula as travas de bloqueio e expiração aqui)
  const isRoot = userRole === 'root' || user.email === "rodrigohono21@gmail.com";

  if (!isRoot) {
    // 🛡️ VERIFICAÇÃO DE BLOQUEIO / EXPIRAÇÃO REFORÇADA
    const isBloqueado = 
      userStatus === 'bloqueado' || 
      licencaStatus === 'bloqueada' || 
      licencaStatus === 'expirada';

    if (isBloqueado) {
      return <Navigate to="/login" replace />;
    }

    // 🛡️ TRAVA DE PRIMEIRO ACESSO (Obriga a trocar senha)
    const rotaSeguranca = '/trocar-senha'; 
    
    if (user.primeiroAcesso === true && location.pathname !== rotaSeguranca) {
      return <Navigate to={rotaSeguranca} replace />;
    }
  }

  // 4. VERIFICAÇÃO DE PERMISSÕES (ROLES)
  // Comparamos sempre em lowercase para evitar erro de "Admin" vs "admin"
  if (allowedRoles && !isRoot) {
    const rolesPermitidas = allowedRoles.map(r => r.toLowerCase());
    if (!rolesPermitidas.includes(userRole)) {
      return <Navigate to="/" replace />; 
    }
  }

  // 5. SE PASSOU POR TUDO, LIBERA O ACESSO
  return children;
};