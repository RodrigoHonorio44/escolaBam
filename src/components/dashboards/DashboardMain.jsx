import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import Dashboard from './Dashboard'; 
import DashboardEnfermeiro from './DashboardEnfermeiro';

const DashboardMain = () => {
  const { user, loading } = useAuth();
  
  // 🔍 ESTADOS PARA ARMAZENAR OS DADOS BRUTOS
  const [atendimentos, setAtendimentos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [questionarios, setQuestionarios] = useState([]);

  // 📡 BUSCA GLOBAL DE DADOS (Para Auditoria)
  useEffect(() => {
    if (!user) return;

    console.log("📡 Iniciando Sincronização Global para Auditoria...");

    // 1. Busca Atendimentos
    const unsubAtend = onSnapshot(collection(db, "atendimentos_enfermagem"), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("✅ Atendimentos sincronizados:", docs.length);
      setAtendimentos(docs);
    });

    // 2. Busca Alunos (Pastas Digitais)
    const unsubAlunos = onSnapshot(collection(db, "pastas_digitais"), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("✅ Alunos sincronizados:", docs.length);
      setAlunos(docs);
    });

    // 3. Busca Questionários
    const unsubQuest = onSnapshot(collection(db, "questionarios_saude"), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("✅ Questionários sincronizados:", docs.length);
      setQuestionarios(docs);
    });

    return () => { unsubAtend(); unsubAlunos(); unsubQuest(); };
  }, [user]);

  if (loading) return null;

  const cargoUser = user?.role?.toLowerCase().trim() || '';

  const isEquipeSaude = 
    cargoUser.includes('enfermeir') || 
    cargoUser.includes('tecnico') || 
    cargoUser.includes('tecnica') || 
    cargoUser.includes('medic') || 
    cargoUser.includes('auxiliar de enfermagem');

  const isAdministrativo = 
    cargoUser === 'root' || 
    cargoUser === 'admin' || 
    cargoUser === 'diretor' || 
    cargoUser === 'diretora';

  // --- RENDERIZAÇÃO COM PASSAGEM DE DADOS ---

  if (isEquipeSaude) {
    return (
      <DashboardEnfermeiro 
        user={user} 
        atendimentosRaw={atendimentos} 
        alunosRaw={alunos} 
        questionariosRaw={questionarios} 
      />
    );
  }

  if (isAdministrativo) {
    return (
      <Dashboard 
        user={user} 
        atendimentosRaw={atendimentos} 
        alunosRaw={alunos} 
        questionariosRaw={questionarios} 
      />
    );
  }

  // Fallback (Acesso Restrito...)
  return (
     <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-center p-10 font-sans">
       {/* ... seu código de acesso restrito ... */}
       <p className="text-blue-600 font-black text-lg uppercase italic">{user?.role || 'NÃO DEFINIDO'}</p>
     </div>
  );
};

export default DashboardMain;