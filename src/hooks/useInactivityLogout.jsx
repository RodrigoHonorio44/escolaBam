import { useEffect, useRef } from "react";
// AJUSTADO: De "../api/Firebase" para o seu caminho real
import { auth } from "../firebase/firebaseconfig"; 
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function useInactivityLogout(minutes = 40) {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, minutes * 60 * 1000);
  };

  const handleLogout = async () => {
    try {
      // O Firebase Auth usa a instância vinda do seu firebaseconfig
      await signOut(auth);
      toast.info("Sessão encerrada por inatividade.");
      navigate("/login");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  useEffect(() => {
    // Eventos que resetam o cronômetro de 40 minutos
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    
    events.forEach((event) => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach((event) => document.removeEventListener(event, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
}