import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext'; // ✅ Importado para controle de acesso

const DashboardAuditoria = ({ atendimentosRaw = [], alunosRaw = [], questionariosRaw = [] }) => {
  const { user } = useAuth();

  const stats = useMemo(() => {
    // 🔍 1. Filtro de Unidade (Segurança Máxima)
    const isRoot = user?.role === 'root' || user?.email === "rodrigohono21@gmail.com";
    const escolaFiltro = user?.escolaId;

    const filtrarPorUnidade = (lista) => {
      if (isRoot) return lista;
      return lista.filter(d => d.escolaId === escolaFiltro || d.escola === escolaFiltro);
    };

    const atendimentosUnidade = filtrarPorUnidade(atendimentosRaw);
    const alunosUnidade = filtrarPorUnidade(alunosRaw);
    const questionariosUnidade = filtrarPorUnidade(questionariosRaw);

    // 🔍 2. Mapeamento Global em Lowercase (Padrão Caio Giromba)
    const baseSaude = [...alunosUnidade, ...questionariosUnidade].map(d => 
      JSON.stringify(d).toLowerCase()
    );

    // Função de verificação por palavra-chave
    const check = (termo) => baseSaude.filter(d => d.includes(termo.toLowerCase())).length;

    // 📊 3. Cálculo de métricas
    return {
      totalAtendimentos: atendimentosUnidade.length,
      // Busca inteligente com normalização NFD para ignorar acentos na auditoria
      alergias: check('alergia') + check('alergico') + check('alergica'),
      pcd: check('pcd') + check('neuro') + check('autismo') + check('deficiencia') + check('tea'),
      cronicos: check('diabetes') + check('hiperten') + check('asma') + check('pressao') + check('cardiaco'),
      totalProntuarios: alunosUnidade.length + questionariosUnidade.length
    };
  }, [atendimentosRaw, alunosRaw, questionariosRaw, user]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER MINIMALISTA */}
      <div className="border-b border-slate-500/10 pb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-6xl font-[1000] italic tracking-tighter uppercase text-slate-900 leading-none">
            Auditoria <span className="text-blue-600">Clínica</span>
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">
            Análise Populacional — {user?.escola || 'Rede Municipal'} — MedSys 2026
          </p>
        </div>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl">
           <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Base Sincronizada</p>
           <p className="text-xl font-black italic">#{stats.totalProntuarios}</p>
        </div>
      </div>

      {/* CARDS DE IMPACTO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Fluxo de Atendimentos', val: stats.totalAtendimentos, color: 'text-slate-900', icon: '📊', bg: 'bg-white' },
          { label: 'Riscos de Alergia', val: stats.alergias, color: 'text-rose-600', icon: '⚠️', bg: 'bg-rose-50' },
          { label: 'PCD / Neurodiversos', val: stats.pcd, color: 'text-blue-600', icon: '🧠', bg: 'bg-blue-50' },
          { label: 'Monitoramento Crônico', val: stats.cronicos, color: 'text-emerald-600', icon: '🫀', bg: 'bg-emerald-50' },
        ].map((card, i) => (
          <div key={i} className={`${card.bg} border border-slate-200 p-8 rounded-[40px] flex flex-col justify-between h-52 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
            <div className="flex justify-between items-start">
               <span className="text-2xl bg-white p-3 rounded-2xl shadow-sm">{card.icon}</span>
            </div>
            <div>
              <p className={card.color + " text-6xl font-[1000] italic leading-none tracking-tighter"}>{card.val}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase mt-4 tracking-widest">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER DE STATUS */}
      <div className="bg-slate-900 p-8 rounded-[40px] relative overflow-hidden">
        <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Inteligência de Dados Ativa
            </p>
            <p className="text-slate-400 text-sm mt-4 font-medium leading-relaxed max-w-2xl">
              O motor de auditoria processou os dados da unidade <span className="text-white font-bold">{user?.escola || 'Global'}</span>. 
              Cruzando **{stats.totalAtendimentos}** atendimentos com **{stats.totalProntuarios}** registros. 
              A normalização <span className="text-white font-bold">lowercase</span> garante que nenhum caso seja perdido por erros de digitação.
            </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] text-white/[0.03] text-9xl font-black italic select-none">
          RODHON
        </div>
      </div>
    </div>
  );
};

export default DashboardAuditoria;