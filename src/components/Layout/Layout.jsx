import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore'; 
// AJUSTE: Voltando para caminho relativo para evitar o Erro 500 do Vite
import { db } from '../../firebase/firebaseConfig'; 
import { useAuth } from '../../context/AuthContext'; 

import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se não houver usuário logado, não tenta monitorar
    if (!user?.uid) return;

    // MONITORAMENTO EM TEMPO REAL (Cadeado Mestre)
    // Se o status mudar no Firestore, o usuário é expulso instantaneamente
    const unsub = onSnapshot(doc(db, "usuarios", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Verifica as variações de bloqueio do seu banco
        const isBloqueado = 
          data.licencaStatus === 'bloqueado' || 
          data.statusLicenca === 'bloqueada' || 
          data.status === 'bloqueado';

        // Regra de Ouro: Root nunca é expulso do próprio sistema
        if (isBloqueado && data.role !== 'root') {
          console.warn("🚨 Acesso interrompido pelo Painel Master.");
          navigate('/bloqueado', { replace: true });
        }
      }
    }, (error) => {
      console.error("Erro no monitoramento de segurança:", error);
    });

    return () => unsub();
  }, [user?.uid, navigate]);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar Fixa */}
      <Sidebar />

      {/* Área Principal: ml-64 compensa a largura da Sidebar */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-6 md:p-10">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-top-2 duration-700">
            {/* Renderiza as sub-rotas (Dashboard, Usuários, etc.) */}
            <Outlet /> 
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;