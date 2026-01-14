import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useInactivityLogout } from "../hooks/useInactivityLogout";
import toast from "react-hot-toast";

const GuardiaoSessao = () => {
  const navigate = useNavigate();
  
  // Monitora inatividade (40 min)
  useInactivityLogout(40);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Ignora a verificação de sessão duplicada para o seu e-mail de administrador
        if (user.email === "rodrigohono21@gmail.com") return;

        const usuariosRef = collection(db, "usuarios");
        const q = query(usuariosRef, where("email", "==", user.email));
        
        const unsubscribeSnap = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            const localSessionId = localStorage.getItem("current_session_id");

            // 1. VERIFICAÇÃO DE BLOQUEIO EM TEMPO REAL
            // Se o admin te bloquear enquanto você está logado, o sistema te expulsa na hora
            const isBloqueado = userData.status === "bloqueado" || userData.statusLicenca === "bloqueada";
            
            if (isBloqueado) {
              executarExpulsao("ACESSO SUSPENSO PELO ADMINISTRADOR.");
              return;
            }

            // 2. LÓGICA DE SESSÃO DUPLICADA
            // Só expulsa se houver um ID no banco E ele for diferente do local
            if (userData.currentSessionId && localSessionId && userData.currentSessionId !== localSessionId) {
              executarExpulsao("ACESSO ENCERRADO: OUTRO DISPOSITIVO SE CONECTOU.");
            }
          }
        });

        return () => unsubscribeSnap();
      } else {
        // Se não houver usuário autenticado no Firebase, garante que limpe o local
        localStorage.removeItem("current_session_id");
        navigate("/login");
      }
    });

    const executarExpulsao = async (mensagem) => {
      await signOut(auth);
      localStorage.clear();
      
      toast.error(mensagem, {
        id: "kick-alert",
        duration: 6000,
        position: "top-center",
        style: { 
          background: '#0f172a', 
          color: '#fff', 
          fontWeight: 'bold', 
          border: '1px solid #ef4444',
          fontSize: '12px'
        }
      });
      
      navigate("/login");
    };

    return () => unsubscribeAuth();
  }, [navigate]);

  return <Outlet />;
};

export default GuardiaoSessao;