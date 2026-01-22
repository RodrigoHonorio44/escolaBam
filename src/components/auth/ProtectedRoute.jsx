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

  // 3. IMUNIDADE ROOT (Rodrigo pula as travas de bloqueio e expiração aqui)
  const isRoot = user.role === 'root' || user.email === "rodrigohono21@gmail.com";

  if (!isRoot) {
    // 🛡️ VERIFICAÇÃO DE BLOQUEIO / EXPIRAÇÃO REFORÇADA
    const isBloqueado = 
      user.status === 'bloqueado' || 
      user.licencaStatus === 'bloqueada' || 
      user.statusLicenca === 'bloqueada';

    if (isBloqueado) {
      return <Navigate to="/login" replace />;
    }

    // 🛡️ TRAVA DE PRIMEIRO ACESSO (Obriga a trocar senha)
    // Importante: Verifique se a rota no seu App.js é '/trocar-senha' ou '/alterar-senha'
    const rotaSeguranca = '/trocar-senha'; 
    
    if (user.primeiroAcesso === true && location.pathname !== rotaSeguranca) {
      return <Navigate to={rotaSeguranca} replace />;
    }
  }

  // 4. VERIFICAÇÃO DE PERMISSÕES (ROLES)
  if (allowedRoles && !isRoot && !allowedRoles.includes(user.role)) {
    // Se não tiver permissão, volta para a home
    return <Navigate to="/" replace />; 
  }

  // 5. SE PASSOU POR TUDO, LIBERA O ACESSO
  return children;
};