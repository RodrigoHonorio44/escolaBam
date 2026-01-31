import React, { useState } from 'react';
import { Search, Phone, Pill, Briefcase, User, Printer, Accessibility } from 'lucide-react';
import AbaFichasMedicasImpressao from './AbaFichasMedicasImpressao';

const AbaFichasMedicas = ({ grupos, darkMode }) => {
  const [subAba, setSubAba] = useState('alergias');
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 8;

  const normalizar = (str) => str?.toString().toLowerCase().trim() || "";

  // ✅ Identifica mobilidade para alertas visuais
  const temMobilidadeReduzida = (p) => {
    const detalhes = normalizar(p?.pcdStatus?.detalhes || "");
    return (
      normalizar(p?.caminharDificuldade) === "sim" || 
      p?.mobilidadeAuxilio?.cadeirante === true ||
      p?.dificuldades?.andar === true ||
      detalhes.includes('cadeira') || 
      detalhes.includes('mobilidade') ||
      normalizar(p?.mobilidadeReduzida) === "sim" ||
      p?.mobilidadeReduzida === true
    );
  };

  const formatarNomeRS = (pessoa) => {
    const nomeBruto = pessoa?.alunoNome || pessoa?.nome || pessoa?.nomePaciente || "registro sem nome";
    return nomeBruto.toString().toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const obterVinculo = (pessoa) => {
    const turmaStr = normalizar(pessoa?.turma);
    const cargoStr = normalizar(pessoa?.cargo || pessoa?.funcao);
    const nome = normalizar(pessoa?.alunoNome || pessoa?.nome);
    
    if (!turmaStr || turmaStr === "n/i" || turmaStr === "funcionario" || cargoStr || nome.includes("fred barbosa")) {
      return { label: cargoStr || "colaborador", isFunc: true };
    }
    return { label: `turma: ${turmaStr}`, isFunc: false };
  };

  // ✅ Lógica detalhada para a tela (igual à impressão)
  const extrairCondicoes = (p) => {
    const tags = [];
    const check = (val) => normalizar(val) === "sim" || val === true;

    if (check(p?.alergias?.possui) || check(p?.alunoPossuiAlergia) || p?.detalheAlergia) {
      const detalhe = p?.alergias?.detalhes || p?.detalheAlergia || p?.qualAlergia || 'verificar';
      tags.push(`alergia: ${detalhe}`);
    }

    if (check(p?.pcdStatus?.possui) || p?.isPCD === true || p?.pcd === true) {
      tags.push(`pcd: ${p?.pcdStatus?.detalhes || 'identificado'}`);
    }

    // --- DETALHAMENTO DE MOBILIDADE NA TELA ---
    if (temMobilidadeReduzida(p)) {
      const aux = p?.mobilidadeAuxilio || {};
      const mobTags = [];
      if (aux.cadeirante) mobTags.push("cadeirante");
      if (aux.muletas) mobTags.push("muletas");
      if (aux.andador) mobTags.push("andador");
      if (aux.protese) mobTags.push("prótese");
      
      const txtMob = mobTags.length > 0 ? mobTags.join("/") : "reduzida";
      tags.push(`mobilidade: ${txtMob}`);
    }

    if (check(p?.diagnosticoNeuro?.possui)) {
      tags.push(`neuro: ${p?.diagnosticoNeuro?.detalhes || 'identificado'}`);
    }

    if (check(p?.diabetes?.possui) || check(p?.possuiDiabetes)) {
      tags.push(`diabetes: ${p?.diabetes?.tipo || 'tipo 1'}`);
    }
    
    if (check(p?.asma?.possui)) tags.push(`asma: ${p?.asma?.detalhes || 'ativa'}`);

    return tags.length > 0 ? tags : ["sem observações"];
  };

  if (!grupos) return null;

  const categorias = [
    { id: 'alergias', label: 'alergias', dados: grupos.alergias || [] },
    { id: 'acessibilidade', label: 'pcd / neuro', dados: grupos.acessibilidade || [] },
    { id: 'mobilidade', label: 'mobilidade', dados: grupos.mobilidade || [] },
    { id: 'cronicos', label: 'doenças crônicas', dados: grupos.cronicos || [] },
    { id: 'restricao', label: 'restrição alimentar', dados: grupos.restricaoAlimentar || [] },
  ];

  const categoriaAtiva = categorias.find(c => c.id === subAba) || categorias[0];
  
  const dadosFiltrados = categoriaAtiva.dados.filter(a => {
    const nome = formatarNomeRS(a).toLowerCase();
    const buscaNorm = busca.toLowerCase();
    return nome.includes(buscaNorm) || normalizar(a?.turma).includes(buscaNorm) || normalizar(a?.cargo).includes(buscaNorm);
  });

  const dadosExibidos = dadosFiltrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => { setSubAba(cat.id); setPagina(1); }}
                className={`px-6 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2 ${
                  subAba === cat.id 
                  ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/30 scale-105' 
                  : darkMode ? 'bg-white/5 text-slate-400' : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                {cat.id === 'mobilidade' && <Accessibility size={14} />}
                {cat.label} <span className="opacity-40">[{cat.dados.length}]</span>
              </button>
            ))}
            
            <button 
              onClick={() => window.print()}
              className="px-6 py-4 rounded-[22px] bg-slate-900 text-white text-[10px] font-black uppercase tracking-[2px] flex items-center gap-2 hover:bg-black transition-all"
            >
              <Printer size={14} /> imprimir todas
            </button>
          </div>
          
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="buscar registro r s..." 
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
              className={`w-full pl-14 pr-6 py-4 rounded-[22px] text-[11px] font-bold border-2 outline-none transition-all ${
                darkMode ? 'bg-black/20 border-white/5 text-white focus:border-rose-500/50' : 'bg-white border-slate-100 focus:border-rose-500/50'
              }`}
            />
          </div>
        </div>

        <div className={`rounded-[40px] border overflow-hidden ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200 shadow-lg'}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[10px] font-black uppercase tracking-[2px] ${darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                <th className="p-8">aluno / vínculo</th>
                <th className="p-8">condições clínicas</th>
                <th className="p-8 text-right">emergência / medicação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-500/10">
              {dadosExibidos.map((pessoa, idx) => {
                const vinculo = obterVinculo(pessoa);
                const condicoes = extrairCondicoes(pessoa);
                const isMob = temMobilidadeReduzida(pessoa);
                
                return (
                  <tr key={idx} className="hover:bg-rose-600/5 transition-colors group">
                    <td className="p-8 relative">
                      {isMob && <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-orange-500 rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.4)]" />}
                      
                      <div className="flex items-center gap-2 mb-2">
                        <p className={`font-black italic text-[16px] ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {formatarNomeRS(pessoa)}
                        </p>
                        {isMob && <Accessibility size={14} className="text-orange-500" />}
                      </div>

                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 w-fit border ${
                        vinculo.isFunc ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/10'
                      }`}>
                        {vinculo.isFunc ? <Briefcase size={10} /> : <User size={10} />}
                        {vinculo.label}
                      </span>
                    </td>

                    <td className="p-8">
                      <div className="flex flex-wrap gap-2 max-w-sm">
                        {condicoes.map((tag, i) => (
                          <span key={i} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 border ${
                            darkMode ? 'bg-white/5 text-slate-400 border-white/5' : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${tag.includes('sem') ? 'bg-slate-300' : tag.includes('mobilidade') ? 'bg-orange-500' : 'bg-rose-500'}`} />
                            {tag.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-8">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 text-emerald-500 rounded-xl border border-emerald-500/10 text-[11px] font-black">
                          <Phone size={14} /> 
                          {pessoa?.contatos?.[0]?.telefone || pessoa?.telefoneResponsavel || "n/i"}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/5 text-orange-500 rounded-xl border border-orange-500/10 text-[11px] font-black uppercase">
                          <Pill size={14} /> 
                          {typeof pessoa?.medicacaoContinua === 'object' ? (pessoa?.medicacaoContinua?.detalhes || "nenhuma") : (pessoa?.medicacaoContinua || "nenhuma")}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AbaFichasMedicasImpressao grupos={grupos} />
    </>
  );
};

export default AbaFichasMedicas;