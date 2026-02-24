import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useInactivityLogout } from "../hooks/useInactivityLogout";
import toast from "react-hot-toast";

const GuardiaoSessao = () => {
  const navigate = useNavigate();
  
  // Monitora inatividade (40 min)
  useInactivityLogout(40);

  useEffect(() => {
    // 1. Escuta mudanças no estado de autenticação
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // 2. Escuta em tempo real o documento específico do usuário
        const userRef = doc(db, "usuarios", user.uid);
        
        const unsubscribeSnap = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const localSessionId = localStorage.getItem("current_session_id");

            // 💾 SINCRONIZAÇÃO DE PERFIL: Salva escolaId para uso nos filtros (ex: ContatoAluno)
            // Guardamos em lowercase conforme sua padronização de busca
            if (userData.escolaId) {
              localStorage.setItem("escolaIdLogada", userData.escolaId.toLowerCase());
            }

            // 🛡️ IMUNIDADE ROOT: Rodrigo não é monitorado por sessão duplicada ou bloqueio
            if (user.email === "rodrigohono21@gmail.com") return;

            // --- A: VERIFICAÇÃO DE BLOQUEIO EM TEMPO REAL ---
            const isBloqueado = 
              userData.status === "bloqueado" || 
              userData.statusLicenca === "bloqueada" ||
              userData.licencaStatus === "bloqueada";
            
            if (isBloqueado) {
              executarExpulsao("CONTA BLOQUEADA: CONSULTE A ADMINISTRAÇÃO.");
              return;
            }

            // --- B: LÓGICA DE SESSÃO ÚNICA (DISPOSITIVOS DUPLICADOS) ---
            if (userData.currentSessionId && localSessionId && userData.currentSessionId !== localSessionId) {
              executarExpulsao("SESSÃO ENCERRADA: OUTRO DISPOSITIVO SE CONECTOU.");
            }
          }
        }, (error) => {
          console.error("Erro no Guardião:", error);
        });

        return () => unsubscribeSnap();
      } else {
        // Sem usuário? Limpa tudo e volta pro login
        localStorage.clear();
        navigate("/login", { replace: true });
      }
    });

    const executarExpulsao = async (mensagem) => {
      localStorage.clear();
      await signOut(auth);
      
      toast.error(mensagem, {
        id: "kick-alert",
        duration: 8000,
        position: "top-center",
        style: { 
          background: '#020617', 
          color: '#fff', 
          fontWeight: 'bold', 
          border: '2px solid #ef4444',
          fontSize: '11px',
          letterSpacing: '0.05em'
        }
      });
      
      navigate("/login", { replace: true });
    };

    return () => unsubscribeAuth();
  }, [navigate]);

  return <Outlet />;
};

export default GuardiaoSessao;