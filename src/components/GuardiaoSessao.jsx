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
        // MUDANÇA AQUI: Buscamos pelo e-mail, igual ao seu sistema de login
        const usuariosRef = collection(db, "usuarios");
        const q = query(usuariosRef, where("email", "==", user.email));
        
        const unsubscribeSnap = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            // Pegamos o primeiro documento encontrado com esse e-mail
            const userData = snapshot.docs[0].data();
            const localSessionId = localStorage.getItem("current_session_id");

            // LOG DE DEPURAÇÃO (Verifique no F12 se os IDs aparecem)
            console.log("Sessão Local:", localSessionId);
            console.log("Sessão no Banco:", userData.currentSessionId);

            // LÓGICA DE EXPULSÃO:
            if (userData.currentSessionId && userData.currentSessionId !== localSessionId) {
              
              const encerrarSessao = async () => {
                await signOut(auth);
                localStorage.clear();
                
                // Usamos um ID fixo no toast para não repetir várias vezes
                toast.error("ACESSO ENCERRADO: OUTRO DISPOSITIVO SE CONECTOU.", {
                  id: "kick-alert",
                  duration: 6000,
                  position: "top-center",
                  style: { background: '#1e293b', color: '#fff', fontWeight: 'bold', border: '1px solid #ef4444' }
                });
                
                navigate("/login");
              };

              encerrarSessao();
            }
          }
        });

        return () => unsubscribeSnap();
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  return <Outlet />;
};

export default GuardiaoSessao;