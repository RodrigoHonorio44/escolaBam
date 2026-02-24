import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import Dashboard from './Dashboard'; 
import DashboardEnfermeiro from './DashboardEnfermeiro';

const DashboardMain = () => {
  const { user, loading } = useAuth();
  
  const [atendimentos, setAtendimentos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [questionarios, setQuestionarios] = useState([]);

  useEffect(() => {
    if (!user) return;

    // ✅ IDENTIFICAÇÃO DE PRIVILÉGIO (ROOT/ADMIN VÊ TUDO)
    const isRoot = user.role?.toLowerCase() === 'root' || user.email === "rodrigohono21@gmail.com";
    const escolaFiltro = user.escolaId;

    console.log(`📡 Sincronização Rodhon MedSys: [Unidade: ${isRoot ? 'Global' : user.escola}]`);

    // --- FUNÇÃO PARA CRIAR QUERIES SEGURAS ---
    const criarQuerySegura = (colecao) => {
      const ref = collection(db, colecao);
      // Se não for root, filtra pelo escolaId do usuário
      return isRoot ? ref : query(ref, where("escolaId", "==", escolaFiltro));
    };

    // --- LISTENERS EM TEMPO REAL COM ISOLAMENTO ---
    const unsubAtend = onSnapshot(criarQuerySegura("atendimentos_enfermagem"), (snap) => {
      setAtendimentos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAlunos = onSnapshot(criarQuerySegura("pastas_digitais"), (snap) => {
      setAlunos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubQuest = onSnapshot(criarQuerySegura("questionarios_saude"), (snap) => {
      setQuestionarios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubAtend(); unsubAlunos(); unsubQuest(); };
  }, [user]);

  if (loading) return null;

  // Normalização agressiva de cargo (Padrão Caio Giromba)
  const cargoUser = user?.role?.toLowerCase().trim() || '';

  // 1. Grupos Operacionais (Enfermeiros, Médicos, Diretores, Adm Escolar)
  const vaiParaDashboardEnfermeiro = 
    cargoUser.includes('enfermeir') || 
    cargoUser.includes('tecnico') || 
    cargoUser.includes('tecnica') || 
    cargoUser.includes('medic') || 
    cargoUser === 'diretor' || 
    cargoUser === 'diretora' || 
    cargoUser === 'administrativo';

  // 2. Grupos Estratégicos (Controle Total da Rede)
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

  // Fallback Minimalista para erros de cargo
  return (
     <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-center p-10 font-sans">
        <div className="bg-white p-12 rounded-[50px] shadow-xl border border-slate-200 max-w-md animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Lock size={32} />
            </div>
            <h2 className="text-2xl font-[1000] uppercase italic text-slate-900 mb-2">Acesso Restrito</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Role: {cargoUser || 'Pendente'}</p>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Sua conta não possui permissões para acessar as interfaces clínicas ou administrativas.
            </p>
            <button 
              onClick={() => auth.signOut()}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl uppercase italic text-xs tracking-widest hover:bg-slate-800 transition-all"
            >
              Tentar outro login
            </button>
        </div>
     </div>
  );
};

export default DashboardMain;