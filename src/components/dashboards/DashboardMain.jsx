import React from 'react';
import { useAuth } from '../../context/AuthContext';
// Importando os componentes de Dashboard
import Dashboard from './Dashboard'; 
import DashboardEnfermeiro from './DashboardEnfermeiro';

const DashboardMain = () => {
  const { user, loading } = useAuth();

  // 1. Enquanto carrega os dados do usuário, não renderiza nada para evitar "pulos" de tela
  if (loading) return null;

  // Normaliza o cargo para facilitar a comparação (minúsculas e sem espaços extras)
  const cargoUser = user?.role?.toLowerCase().trim() || '';

  // 2. LÓGICA DE DETECÇÃO POR PALAVRA-CHAVE (EQUIPE DE SAÚDE)
  // O .includes() garante que "Médico", "Médica", "Clínico Geral" ou "Médico Plantonista" funcionem
  const isEquipeSaude = 
    cargoUser.includes('enfermeir') || // enfermeiro, enfermeira
    cargoUser.includes('tecnico') ||   // tecnico, tecnica
    cargoUser.includes('tecnica') || 
    cargoUser.includes('medic') ||     // medico, medica (pega ambos pela raiz 'medic')
    cargoUser.includes('auxiliar de enfermagem');

  // 3. LÓGICA DE DETECÇÃO ADMINISTRATIVA (PAINEL SASS / ROOT)
  const isAdministrativo = 
    cargoUser === 'root' || 
    cargoUser === 'admin' || 
    cargoUser === 'diretor' || 
    cargoUser === 'diretora';

  // --- REDIRECIONAMENTO ---

  // Se for saúde (Enfermeiro/Médico/Técnico), retorna o dashboard de atendimento
  if (isEquipeSaude) {
    return <DashboardEnfermeiro user={user} />;
  }

  // Se for administrativo, retorna o dashboard principal (Admin)
  if (isAdministrativo) {
    return <Dashboard user={user} />;
  }

  // Fallback: Caso o cargo não seja identificado
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-center p-10 font-sans">
      <div className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Detalhe estético no topo */}
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
        
        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">
          Acesso Restrito
        </h2>
        
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Seu Perfil Atual:</p>
          <span className="text-blue-600 font-black text-lg uppercase italic">
            {user?.role || 'NÃO DEFINIDO'}
          </span>
        </div>

        <p className="text-slate-500 text-sm font-medium leading-relaxed">
          Seu cargo ainda não possui um painel específico configurado. <br/>
          Por favor, contate o administrador do sistema.
        </p>
        
        <div className="mt-8 pt-8 border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Rodhon MedSys v2.0 • 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardMain;