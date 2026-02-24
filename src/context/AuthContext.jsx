import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { auth, db } from "../firebase/firebaseConfig"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("current_session_id");
    signOut(auth);
    setUserData(null);
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);

  // ✅ Função para carimbar novos documentos com a unidade do usuário logado
  // Ajustada para usar escolaId e escola (conforme seu Firestore)
  const getContextoUnidade = useCallback(() => {
    if (!userData) return null;
    return {
      escolaId: (userData.escolaId || 'sem-unidade').toLowerCase().trim(),
      escola: (userData.escola || 'não atribuída').toLowerCase().trim(),
      unidade: (userData.unidade || userData.escola || 'não atribuída').toLowerCase().trim(),
      atendenteNome: (userData.nome || 'desconhecido').toLowerCase().trim(),
      atendenteUid: userData.uid
    };
  }, [userData]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (currentUser) {
        try {
          const userRef = doc(db, "usuarios", currentUser.uid);
          
          unsubscribeDoc = onSnapshot(userRef, {
            next: (docSnap) => {
              if (!isMounted) return;

              if (docSnap.exists()) {
                const data = docSnap.data();
                const localSession = localStorage.getItem("current_session_id");

                // --- 1. VERIFICAÇÃO DE SESSÃO ÚNICA ---
                const sessaoInvalida = 
                  data.currentSessionId && 
                  localSession && 
                  data.currentSessionId !== localSession;

                // --- 2. VERIFICAÇÃO DE BLOQUEIO INSTANTÂNEO ---
                const contaBloqueada = 
                  data.status === 'bloqueado' || 
                  data.statusLicenca === 'bloqueada' || 
                  data.licencaStatus === 'bloqueada';

                // Root (você) imune
                const isRoot = currentUser.email === "rodrigohono21@gmail.com";

                if (!isRoot && (sessaoInvalida || contaBloqueada)) {
                  handleLogout();
                  return;
                }

                // ✅ Seta os dados normalizados
                setUserData({ 
                  uid: currentUser.uid, 
                  email: currentUser.email, 
                  ...data 
                });
              } else {
                setUserData({ 
                  uid: currentUser.uid, 
                  email: currentUser.email, 
                  role: 'visitante' 
                });
              }
              setLoading(false);
            },
            error: (error) => {
              console.error("Erro no Firestore Snapshot:", error);
              if (isMounted) setLoading(false);
            }
          });
        } catch (err) {
          console.error("Erro ao configurar snapshot:", err);
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setUserData(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [handleLogout]);

  // Memoize o valor para evitar re-renderizações desnecessárias
  const value = useMemo(() => ({
    user: userData,
    loading,
    handleLogout,
    getContextoUnidade, // ✅ Agora retorna escolaId e escola em lowercase
    isAtivo: userData?.status === 'ativo' && userData?.statusLicenca === 'ativa'
  }), [userData, loading, handleLogout, getContextoUnidade]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};