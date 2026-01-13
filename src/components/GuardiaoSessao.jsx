import React from "react";
import { Outlet } from "react-router-dom";
import { useInactivityLogout } from "../hooks/useInactivityLogout";

const GuardiaoSessao = () => {
  // Monitora inatividade (40 minutos)
  useInactivityLogout(40);

  // O Outlet renderiza o Layout e as rotas filhas (Dashboard, etc)
  return <Outlet />;
};

export default GuardiaoSessao;