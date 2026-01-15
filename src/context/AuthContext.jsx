import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { auth, db } from "../firebase/firebaseConfig"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("current_session_id");
    signOut(auth);
    setUserData(null); // Limpa o estado local imediatamente
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

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

                // Root (você) é imune à sessão única para poder testar em várias abas
                const isRoot = currentUser.email === "rodrigohono21@gmail.com";

                if (!isRoot && (sessaoInvalida || contaBloqueada)) {
                  handleLogout();
                  return;
                }

                setUserData({ 
                  uid: currentUser.uid, 
                  email: currentUser.email, 
                  ...data 
                });
              } else {
                // Caso o documento do usuário seja deletado do banco
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
  }, []);

  const value = useMemo(() => ({
    user: userData,
    loading,
    handleLogout
  }), [userData, loading]);

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