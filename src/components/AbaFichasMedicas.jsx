import React, { useState } from 'react';
import { Search, Phone, Pill, Briefcase, User, Activity, AlertCircle } from 'lucide-react';

const AbaFichasMedicas = ({ grupos, darkMode }) => {
  const [subAba, setSubAba] = useState('alergias');
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 8;

  const normalizar = (str) => str?.toString().toLowerCase().trim() || "";

  // Formatação R S (Caio Giromba)
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

  // EXTRAÇÃO DE DADOS (Ajustado para os logs: questionarios_saude e pastas_digitais)
  const extrairCondicoes = (p) => {
    const tags = [];
    const check = (val) => normalizar(val) === "sim" || val === true;

    // 1. Alergias (Puxa 'dipirona' do campo correto)
    if (check(p?.alergias?.possui) || check(p?.alunoPossuiAlergia) || p?.detalheAlergia) {
      const detalhe = p?.alergias?.detalhes || p?.detalheAlergia || p?.qualAlergia || 'verificar';
      tags.push(`alergia: ${detalhe}`);
    }

    // 2. PCD e Neurodiversidade (TDAH/TEA)
    if (check(p?.pcdStatus?.possui) || p?.isPCD === true || p?.pcd === true) {
      tags.push(`pcd: ${p?.pcdStatus?.detalhes || 'identificado'}`);
    }
    if (check(p?.diagnosticoNeuro?.possui)) {
      tags.push(`neuro: ${p?.diagnosticoNeuro?.detalhes || 'identificado'}`);
    }

    // 3. Doenças Crônicas
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
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {categorias.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => { setSubAba(cat.id); setPagina(1); }}
              className={`px-6 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[2px] transition-all ${
                subAba === cat.id 
                ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/30 scale-105' 
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
            placeholder="buscar colaborador ou turma..." 
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
              
              return (
                <tr key={idx} className="hover:bg-rose-600/5 transition-colors group">
                  <td className="p-8">
                    <p className={`font-black italic text-[16px] mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
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

                  <td className="p-8">
                    <div className="flex flex-wrap gap-2 max-w-sm">
                      {condicoes.map((tag, i) => (
                        <span key={i} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 border ${
                          darkMode ? 'bg-white/5 text-slate-400 border-white/5' : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${tag.includes('sem') ? 'bg-slate-300' : 'bg-rose-500'}`} />
                          {tag.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-8">
                    <div className="flex flex-col items-end gap-2">
                      {/* CONTATO: Acessa a array 'contatos' conforme seu log do Caio */}
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 text-emerald-500 rounded-xl border border-emerald-500/10 text-[11px] font-black">
                        <Phone size={14} /> 
                        {pessoa?.contatos?.[0]?.telefone || pessoa?.telefoneResponsavel || pessoa?.contatoEmergencia || "n/i"}
                      </div>
                      
                      {/* MEDICAÇÃO: Acessa o objeto 'medicacaoContinua.detalhes' */}
                      <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/5 text-orange-500 rounded-xl border border-orange-500/10 text-[11px] font-black uppercase">
                        <Pill size={14} /> 
                        {typeof pessoa?.medicacaoContinua === 'object' 
                          ? (pessoa?.medicacaoContinua?.detalhes || "nenhuma") 
                          : (pessoa?.medicacaoContinua || pessoa?.medicamento || "nenhuma")}
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
  );
};

export default AbaFichasMedicas;