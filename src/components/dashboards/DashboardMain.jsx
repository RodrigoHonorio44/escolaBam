import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import Dashboard from './Dashboard'; 
import DashboardEnfermeiro from './DashboardEnfermeiro';

const DashboardMain = () => {
  const { user, loading } = useAuth();
  
  const [atendimentos, setAtendimentos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [questionarios, setQuestionarios] = useState([]);

  useEffect(() => {
    if (!user) return;

    console.log("📡 Iniciando Sincronização Global...");

    const unsubAtend = onSnapshot(collection(db, "atendimentos_enfermagem"), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAtendimentos(docs);
    });

    const unsubAlunos = onSnapshot(collection(db, "pastas_digitais"), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlunos(docs);
    });

    const unsubQuest = onSnapshot(collection(db, "questionarios_saude"), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuestionarios(docs);
    });

    return () => { unsubAtend(); unsubAlunos(); unsubQuest(); };
  }, [user]);

  if (loading) return null;

  // Normalização do cargo para evitar erros de digitação
  const cargoUser = user?.role?.toLowerCase().trim() || '';

  // 1. Definição do Grupo que entra no Dashboard do Enfermeiro
  // Inclui Saúde + Diretoria + Administrativo Escolar
  const vaiParaDashboardEnfermeiro = 
    cargoUser.includes('enfermeir') || 
    cargoUser.includes('tecnico') || 
    cargoUser.includes('tecnica') || 
    cargoUser.includes('medic') || 
    cargoUser === 'diretor' || 
    cargoUser === 'diretora' || 
    cargoUser === 'administrativo';

  // 2. Definição do Grupo que entra no Dashboard Administrativo (ROOT)
  const vaiParaDashboardAdmin = 
    cargoUser === 'root' || 
    cargoUser === 'admin';

  // --- RENDERIZAÇÃO ---

  if (vaiParaDashboardEnfermeiro) {
    return (
      <DashboardEnfermeiro 
        user={user} 
        atendimentosRaw={atendimentos} 
        alunosRaw={alunos} 
        questionariosRaw={questionarios} 
      />
    );
  }

  if (vaiParaDashboardAdmin) {
    return (
      <Dashboard 
        user={user} 
        atendimentosRaw={atendimentos} 
        alunosRaw={alunos} 
        questionariosRaw={questionarios} 
      />
    );
  }

  // Fallback para cargos não mapeados
  return (
     <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-center p-10 font-sans">
        <div className="bg-white p-12 rounded-[50px] shadow-xl border border-slate-200 max-w-md">
            <h2 className="text-2xl font-black uppercase italic text-slate-800 mb-4">Acesso Restrito</h2>
            <p className="text-slate-500 text-sm mb-6">Seu cargo não possui uma interface definida. Contate o administrador.</p>
            <p className="text-blue-600 font-black text-lg uppercase italic border-t pt-4">{cargoUser || 'NÃO DEFINIDO'}</p>
        </div>
     </div>
  );
};

export default DashboardMain;