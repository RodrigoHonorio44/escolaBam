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
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeDoc) unsubscribeDoc();

      if (currentUser) {
        const userRef = doc(db, "usuarios", currentUser.uid);
        
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 🚨 1. VALIDAÇÃO DE SESSÃO ÚNICA (KICK-OUT)
            const localSession = localStorage.getItem("current_session_id");
            if (
              data.currentSessionId && 
              localSession && 
              data.currentSessionId !== localSession &&
              currentUser.email !== "rodrigohono21@gmail.com"
            ) {
              console.warn("⚠️ Sessão encerrada: login detectado em outro local.");
              handleLogout();
              return;
            }

            // 🚨 2. ATUALIZAÇÃO DE DADOS (INCLUINDO STATUS)
            // Quando o status mudar para 'bloqueado', o userData mudará.
            // O PrivateRoute no App.js fará o redirecionamento.
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
        }, (error) => {
          console.error("Erro ao monitorar usuário:", error);
          setLoading(false);
        });

      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
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