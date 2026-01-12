import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ShieldAlert, LogOut, Clock, AlertTriangle } from 'lucide-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- LÓGICA 1: LOGOUT POR INATIVIDADE (40 MINUTOS) ---
  useEffect(() => {
    if (!user) return;
    let timer;
    const INACTIVITY_TIME = 40 * 60 * 1000; 

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => handleLogout(), INACTIVITY_TIME);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [user]);

  // --- LÓGICA 2: MONITORAMENTO DE ACESSO, SESSÃO E LICENÇA ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", currentUser.uid);
      
      const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const localSessionId = localStorage.getItem('sessionId');
          const hoje = new Date();
          const dataExp = userData.dataExpiracao ? new Date(userData.dataExpiracao) : null;

          // Cálculo de dias restantes
          let diasRestantes = null;
          if (dataExp) {
            const diffTempo = dataExp.getTime() - hoje.getTime();
            diasRestantes = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
          }

          // 🛡️ ADMIN SAAS: Acesso total irrestrito
          if (userData.role === 'admin_saas') {
            setUser({ uid: currentUser.uid, ...userData, statusAcesso: 'ativo' });
            setLoading(false);
            return;
          }

          // 1. Verificação de Bloqueio Manual
          if (userData.licencaStatus === 'bloqueado') {
            setUser({ ...userData, statusAcesso: 'bloqueado' });
            setLoading(false);
            return;
          }

          // 2. Verificação de Expiração de Prazo
          if (diasRestantes !== null && diasRestantes <= 0) {
            setUser({ ...userData, statusAcesso: 'expirado' });
            setLoading(false);
            return;
          }

          // 3. Kickout de Sessão Única
          if (localSessionId && userData.currentSessionId && userData.currentSessionId !== localSessionId) {
            alert("Sua conta foi conectada em outro dispositivo.");
            handleLogout();
            return;
          }

          // 4. Primeiro Acesso
          if (userData.primeiroAcesso === true) {
            setUser({ uid: currentUser.uid, ...userData, statusAcesso: 'primeiro_acesso' });
            setLoading(false);
            return;
          }

          // Se chegou aqui, está ativo. 
          // Adicionamos um alerta se faltar 7 dias ou menos.
          setUser({ 
            uid: currentUser.uid, 
            ...userData, 
            statusAcesso: 'ativo',
            diasParaVencer: diasRestantes,
            exibirAlertaVencimento: diasRestantes <= 7
          });
        } else {
          handleLogout();
        }
        setLoading(false);
      }, (error) => {
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('sessionId');
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- INTERFACE DE BLOQUEIO TOTAL (MANUAL OU EXPIRADO) ---
  const BlockedScreen = ({ motivo }) => (
    <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl text-center border-t-[10px] border-red-500">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <ShieldAlert size={48} strokeWidth={2.5} className={motivo === 'bloqueado' ? 'animate-pulse' : ''} />
        </div>
        
        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter uppercase italic">
          {motivo === 'bloqueado' ? 'Acesso Suspenso' : 'Licença Expirada'}
        </h2>
        
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          {motivo === 'expirado' 
            ? "O prazo de utilização do Rodhon System terminou. Entre em contato com Rodrigo Honório para renovação imediata."
            : "Este acesso foi bloqueado manualmente pela administração por questões contratuais ou de segurança."}
        </p>

        <div className="bg-slate-50 p-5 rounded-3xl mb-8 border border-slate-100 flex items-center gap-4 text-left">
          <div className="bg-white p-3 rounded-2xl shadow-sm text-slate-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status do Sistema</p>
            <p className="text-slate-700 font-bold">{motivo === 'bloqueado' ? 'Bloqueio Administrativo' : 'Aguardando Pagamento'}</p>
          </div>
        </div>

        <button onClick={handleLogout} className="group w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2">
          <LogOut size={16} /> Sair da Conta
        </button>
      </div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, handleLogout }}>
      {loading ? (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Validando Segurança...</p>
        </div>
      ) : (
        user && (user.statusAcesso === 'bloqueado' || user.statusAcesso === 'expirado') 
          ? <BlockedScreen motivo={user.statusAcesso} /> 
          : children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);