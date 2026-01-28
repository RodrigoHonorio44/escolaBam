import React, { useState } from 'react';
import { Search, Phone, Pill, Briefcase, User, Activity, AlertCircle } from 'lucide-react';

const AbaFichasMedicas = ({ grupos, darkMode }) => {
  const [subAba, setSubAba] = useState('alergias');
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 8;

  const normalizar = (str) => str?.toString().toLowerCase().trim() || "";

  // Formatação R S (Caio Giromba)
  const formatarNomeRS = (aluno) => {
    const nomeBruto = aluno?.alunoNome || aluno?.nome || aluno?.nomePaciente || "aluno sem nome";
    return nomeBruto.toString().toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  // Identifica Fred Barbosa e outros colaboradores
  const obterVinculo = (aluno) => {
    const turmaStr = normalizar(aluno?.turma);
    const nome = normalizar(aluno?.alunoNome || aluno?.nome);
    
    if (!turmaStr || turmaStr === "n/i" || turmaStr === "funcionario" || nome.includes("fred barbosa")) {
      return { label: "colaborador", isFunc: true };
    }
    return { label: `turma: ${turmaStr}`, isFunc: false };
  };

  // RELATÓRIO CLÍNICO DETALHADO (Extraindo tudo do Firebase)
  const extrairCondicoes = (aluno) => {
    const tags = [];
    
    if (aluno?.alergias?.possui === "sim") tags.push(`alergia: ${aluno.alergias.detalhes}`);
    if (aluno?.asma?.possui === "sim") tags.push(`asma: ${aluno.asma.detalhes || 'ativa'}`);
    if (aluno?.diabetes?.possui === "sim") tags.push(`diabetes: ${aluno.diabetes.tipo || ''}`);
    if (aluno?.diagnosticoNeuro?.detalhes) tags.push(`neuro: ${aluno.diagnosticoNeuro.detalhes}`);
    if (aluno?.pcdStatus?.detalhes) tags.push(`pcd: ${aluno.pcdStatus.detalhes}`);
    if (aluno?.problemaVisao === "sim") tags.push("usa óculos / visão");
    if (aluno?.caminharDificuldade === "sim") tags.push("apoio motor");
    if (aluno?.restricoesAlimentares?.possui === "sim") tags.push(`dieta: ${aluno.restricoesAlimentares.detalhes}`);

    return tags.length > 0 ? tags : ["sem observações críticas"];
  };

  if (!grupos) return null;

  const categorias = [
    { id: 'alergias', label: 'alergias', dados: grupos.alergias || [] },
    { id: 'acessibilidade', label: 'pcd / neuro', dados: grupos.acessibilidade || [] },
    { id: 'cronicos', label: 'doenças crônicas', dados: grupos.cronicos || [] },
    { id: 'restricao', label: 'restrição alimentar', dados: grupos.restricaoAlimentar || [] },
  ];

  const categoriaAtiva = categorias.find(c => c.id === subAba) || categorias[0];
  
  const dadosFiltrados = categoriaAtiva.dados.filter(a => {
    const nome = formatarNomeRS(a).toLowerCase();
    const buscaNorm = busca.toLowerCase();
    const turma = normalizar(a?.turma);
    return nome.includes(buscaNorm) || turma.includes(buscaNorm);
  });

  const dadosExibidos = dadosFiltrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {categorias.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => { setSubAba(cat.id); setPagina(1); }}
              className={`px-6 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[2px] transition-all ${
                subAba === cat.id 
                ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/30' 
                : darkMode ? 'bg-white/5 text-slate-400' : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              {cat.label} <span className="opacity-40 ml-1">[{cat.dados.length}]</span>
            </button>
          ))}
        </div>
        
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="buscar por nome ou turma..." 
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            className={`w-full pl-14 pr-6 py-4 rounded-[22px] text-[11px] font-bold border-2 outline-none transition-all ${
              darkMode ? 'bg-black/20 border-white/5 text-white focus:border-rose-500/50' : 'bg-white border-slate-100 focus:border-rose-500/50'
            }`}
          />
        </div>
      </div>

      {/* TABELA */}
      <div className={`rounded-[40px] border overflow-hidden ${darkMode ? 'bg-[#0A1629] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-lg'}`}>
        <table className="w-full text-left">
          <thead>
            <tr className={`text-[10px] font-black uppercase tracking-[2px] ${darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
              <th className="p-8">aluno / vínculo</th>
              <th className="p-8">condições clínicas</th>
              <th className="p-8 text-right">emergência / medicação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {dadosExibidos.length > 0 ? (
              dadosExibidos.map((pessoa, idx) => {
                const vinculo = obterVinculo(pessoa);
                const condicoes = extrairCondicoes(pessoa);
                
                return (
                  <tr key={idx} className="hover:bg-rose-600/5 transition-colors">
                    {/* IDENTIFICAÇÃO */}
                    <td className="p-8">
                      <p className={`font-black italic text-[15px] mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {formatarNomeRS(pessoa)}
                      </p>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 w-fit border ${
                        vinculo.isFunc 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                        : 'bg-blue-500/10 text-blue-500 border-blue-500/10'
                      }`}>
                        {vinculo.isFunc ? <Briefcase size={10} /> : <User size={10} />}
                        {vinculo.label}
                      </span>
                    </td>

                    {/* CONDIÇÕES */}
                    <td className="p-8">
                      <div className="flex flex-wrap gap-2 max-w-sm">
                        {condicoes.map((tag, i) => (
                          <span key={i} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 border ${
                            darkMode ? 'bg-white/5 text-slate-400 border-white/5' : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* SUPORTE */}
                    <td className="p-8">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 text-emerald-500 rounded-xl border border-emerald-500/10 text-[11px] font-black">
                          <Phone size={14} /> {pessoa?.contatosEmergencia || pessoa?.telefoneResponsavel || "n/i"}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/5 text-orange-500 rounded-xl border border-orange-500/10 text-[11px] font-black">
                          <Pill size={14} /> {pessoa?.medicacaoContinua?.detalhes || "nenhuma"}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" className="p-20 text-center opacity-30 font-black uppercase text-[10px] tracking-widest">
                  <AlertCircle className="mx-auto mb-4" size={32} />
                  nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AbaFichasMedicas;