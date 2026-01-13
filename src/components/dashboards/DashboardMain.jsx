import React from 'react';
import { useAuth } from '../../context/AuthContext';
// 🚨 AJUSTADO: Importando "Dashboard" (que é o seu Admin) e o do Enfermeiro
import Dashboard from './Dashboard'; 
import DashboardEnfermeiro from './DashboardEnfermeiro';

const DashboardMain = () => {
  const { user } = useAuth();

  const rolesSaude = [
    'enfermeiro', 'enfermeira', 
    'tecnico enfermagem', 'tecnica enfermagem', 
    'medico', 'medica'
  ];

  const cargoUser = user?.role?.toLowerCase();

  // 1. Se for saúde, vai para o dashboard de enfermeiro
  if (rolesSaude.includes(cargoUser)) {
    return <DashboardEnfermeiro user={user} />;
  }

  // 2. Se for root ou admin, vai para o seu arquivo "Dashboard.jsx" (o Admin)
  if (cargoUser === 'root' || cargoUser === 'admin') {
    return <Dashboard user={user} />;
  }

  return (
    <div className="p-20 text-center">
      <h2 className="text-slate-300 font-black uppercase italic text-2xl">Acesso Padrão</h2>
      <p className="text-slate-400">Cargo: {user?.role}</p>
    </div>
  );
};

export default DashboardMain;