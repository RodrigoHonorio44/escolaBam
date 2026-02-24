import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export function useInactivityLogout(minutes = 40) {
  const { handleLogout, user } = useAuth();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // ✅ Função para reiniciar o cronômetro
  const resetTimer = () => {
    // 1. Só inicia o timer se houver usuário e não for Root
    const isRoot = user?.role?.toLowerCase() === 'root' || user?.email === "rodrigohono21@gmail.com";
    if (!user || isRoot) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // 2. Throttling: Só reinicia o timer se passaram mais de 2 segundos desde a última execução
    // Isso evita processamento excessivo durante o movimento do mouse
    const agora = Date.now();
    if (agora - lastActivityRef.current < 2000) return;
    lastActivityRef.current = agora;

    // 3. Limpa o timer anterior e define o novo
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      toast('Sessão encerrada por inatividade.', {
        icon: '⏳',
        duration: 6000,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      
      handleLogout();
    }, minutes * 60 * 1000);
  };

  useEffect(() => {
    // Lista de eventos que indicam atividade humana
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    
    const handleEvent = () => resetTimer();

    if (user) {
      events.forEach((event) => document.addEventListener(event, handleEvent));
      // Inicializa o primeiro timer
      resetTimer();
    }

    return () => {
      // Limpeza completa para evitar memory leaks e bugs de redirecionamento
      events.forEach((event) => document.removeEventListener(event, handleEvent));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]); // Monitora apenas o estado do usuário

  return null;
}