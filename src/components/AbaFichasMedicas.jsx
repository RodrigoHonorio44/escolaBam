import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';

const AbaFichasMedicas = ({ grupos, darkMode }) => {
  const [subAba, setSubAba] = useState('alergias');
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 8;

  const categorias = [
    { id: 'alergias', label: 'Alergias', dados: grupos.alergias },
    { id: 'acessibilidade', label: 'PCD / Acessibilidade', dados: grupos.acessibilidade },
    { id: 'cronicos', label: 'Doenças Crônicas', dados: grupos.cronicos },
    { id: 'restricao', label: 'Restrição Alimentar', dados: grupos.restricaoAlimentar },
  ];

  const dadosAtuais = categorias.find(c => c.id === subAba).dados;
  const totalPaginas = Math.ceil(dadosAtuais.length / itensPorPagina);
  
  // Lógica de Paginação
  const inicio = (pagina - 1) * itensPorPagina;
  const dadosExibidos = dadosAtuais.slice(inicio, inicio + itensPorPagina);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Seletores de Categoria */}
      <div className="flex flex-wrap gap-2">
        {categorias.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setSubAba(cat.id); setPagina(1); }}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              subAba === cat.id 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                : darkMode ? 'bg-white/5 text-slate-400' : 'bg-white text-slate-600 border'
            }`}
          >
            {cat.label} ({cat.dados.length})
          </button>
        ))}
      </div>

      {/* Tabela de Dados */}
      <div className={`rounded-[35px] border overflow-hidden ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                <th className="p-6">Nome do Aluno</th>
                <th className="p-6">Idade</th>
                <th className="p-6">Turma</th>
                <th className="p-6">Detalhes Técnicos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dadosExibidos.map((aluno, idx) => (
                <tr key={idx} className={`hover:bg-blue-600/5 transition-colors ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                  <td className="p-6 font-bold italic">{aluno.nome?.toUpperCase()}</td>
                  <td className="p-6">{aluno.idade || '--'} anos</td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-black uppercase">
                      {aluno.turma}
                    </span>
                  </td>
                  <td className="p-6 text-[11px] opacity-70">
                    {subAba === 'alergias' && (aluno.detalhesAlergia || 'Sim')}
                    {subAba === 'cronicos' && (aluno.detalhesDoenca || 'Sim')}
                    {subAba === 'restricao' && (aluno.detalhesRestricao || 'Sim')}
                    {subAba === 'acessibilidade' && (aluno.tipoDeficiencia || 'Necessita Apoio')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé com Paginação */}
        <div className={`p-6 flex items-center justify-between border-t ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <span className="text-[10px] font-black uppercase opacity-40">
            Exibindo {dadosExibidos.length} de {dadosAtuais.length} registros
          </span>
          
          <div className="flex gap-2">
            <button 
              disabled={pagina === 1}
              onClick={() => setPagina(p => p - 1)}
              className="p-3 rounded-xl bg-slate-500/10 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-20"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center px-4 text-[10px] font-black tracking-widest">
              PÁGINA {pagina} DE {totalPaginas || 1}
            </div>
            <button 
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina(p => p + 1)}
              className="p-3 rounded-xl bg-slate-500/10 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-20"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaFichasMedicas;