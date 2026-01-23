import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Users, AlertCircle } from 'lucide-react';

const AbaFichasMedicas = ({ grupos, darkMode }) => {
  const [subAba, setSubAba] = useState('alergias');
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 8;

  // Proteção: Garante que grupos não seja undefined/null
  if (!grupos) return null;

  // Mapeamento das categorias com fallback para arrays vazios (evita erro de .length)
  const categorias = [
    { id: 'alergias', label: 'Alergias', dados: grupos.alergias || [] },
    { id: 'acessibilidade', label: 'PCD / Acessibilidade', dados: grupos.acessibilidade || [] },
    { id: 'cronicos', label: 'Doenças Crônicas', dados: grupos.cronicos || [] },
    { id: 'restricao', label: 'Restrição Alimentar', dados: grupos.restricaoAlimentar || [] },
  ];

  const categoriaAtiva = categorias.find(c => c.id === subAba);
  const dadosAtuais = categoriaAtiva.dados;
  const totalPaginas = Math.ceil(dadosAtuais.length / itensPorPagina);
  
  const inicio = (pagina - 1) * itensPorPagina;
  const dadosExibidos = dadosAtuais.slice(inicio, inicio + itensPorPagina);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* Seletores de Categoria com Estilo Premium */}
      <div className="flex flex-wrap gap-3">
        {categorias.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setSubAba(cat.id); setPagina(1); }}
            className={`px-6 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-3 ${
              subAba === cat.id 
                ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/30 ring-2 ring-rose-600 ring-offset-2 ring-offset-transparent' 
                : darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-500'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${subAba === cat.id ? 'bg-white animate-pulse' : 'bg-current opacity-30'}`} />
            {cat.label} <span className="opacity-50 ml-1">[{cat.dados.length}]</span>
          </button>
        ))}
      </div>

      {/* Tabela de Dados */}
      <div className={`rounded-[40px] border shadow-2xl shadow-black/5 overflow-hidden ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[10px] font-black uppercase tracking-[2px] ${darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                <th className="p-8">Identificação do Aluno</th>
                <th className="p-8 text-center">Idade</th>
                <th className="p-8 text-center">Turma</th>
                <th className="p-8">Detalhes Técnicos / Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dadosExibidos.length > 0 ? (
                dadosExibidos.map((aluno, idx) => (
                  <tr key={idx} className={`hover:bg-blue-600/5 transition-colors group ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                    <td className="p-8 font-black uppercase italic text-xs tracking-tighter">
                      {aluno.nome || 'NÃO IDENTIFICADO'}
                    </td>
                    <td className="p-8 text-center font-bold opacity-60 text-sm">
                      {aluno.idade || '--'} <span className="text-[9px] uppercase">anos</span>
                    </td>
                    <td className="p-8 text-center">
                      <span className="px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-500/20">
                        {aluno.turma || 'N/I'}
                      </span>
                    </td>
                    <td className="p-8">
                      <div className={`p-4 rounded-2xl text-[11px] leading-relaxed font-medium ${darkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                        {subAba === 'alergias' && (aluno.detalhesAlergia || aluno.alergiaObs || 'Sim (Ver prontuário)')}
                        {subAba === 'cronicos' && (aluno.detalhesDoenca || 'Paciente Crônico')}
                        {subAba === 'restricao' && (aluno.detalhesRestricao || 'Possui restrição')}
                        {subAba === 'acessibilidade' && (aluno.tipoDeficiencia || 'Apoio Especializado')}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-20 text-center">
                     <AlertCircle className="mx-auto text-slate-500/20 mb-4" size={40} />
                     <p className="text-[10px] font-black uppercase opacity-20 tracking-[4px]">Nenhum registro encontrado nesta categoria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação Estilizada */}
        {totalPaginas > 1 && (
          <div className={`p-8 flex items-center justify-between border-t ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">
              Exibindo {dadosExibidos.length} de {dadosAtuais.length} pacientes
            </span>
            
            <div className="flex gap-4">
              <button 
                disabled={pagina === 1}
                onClick={() => setPagina(p => p - 1)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-500/10 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-20"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center px-6 text-[11px] font-black tracking-[3px] italic bg-blue-500/5 rounded-2xl border border-blue-500/10">
                PÁGINA {pagina} <span className="opacity-30 mx-2">/</span> {totalPaginas}
              </div>
              <button 
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina(p => p + 1)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-500/10 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-20"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbaFichasMedicas;