import React from 'react';

const AbaFichasMedicasImpressao = ({ grupos }) => {
  if (!grupos) return null;

  const normalizar = (str) => str?.toString().toLowerCase().trim() || "";
  
  const formatarNomeRS = (pessoa) => {
    const nomeBruto = pessoa?.alunoNome || pessoa?.nome || pessoa?.nomePaciente || "registro sem nome";
    return nomeBruto.toString().toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const secoes = [
    { titulo: "alergias", dados: grupos.alergias || [] },
    { titulo: "pcd / neurodiversidade", dados: grupos.acessibilidade || [] },
    { titulo: "mobilidade reduzida / auxílio", dados: grupos.mobilidade || [] },
    { titulo: "doenças crônicas", dados: grupos.cronicos || [] },
    { titulo: "restrição alimentar", dados: grupos.restricaoAlimentar || [] },
  ];

  // 🔧 FUNÇÃO PARA DETALHAR O TIPO DE MOBILIDADE
  const detalharMobilidade = (p) => {
    const tipos = [];
    const aux = p?.mobilidadeAuxilio || {};
    const dif = p?.dificuldades || {};

    if (aux.cadeirante) tipos.push("cadeirante");
    if (aux.muletas) tipos.push("uso de muletas");
    if (aux.andador) tipos.push("uso de andador");
    if (aux.protese) tipos.push("uso de prótese");
    if (aux.cadeiraRodasEletrica) tipos.push("cadeira elétrica");
    if (dif.andar) tipos.push("dificuldade em deambular");
    if (normalizar(p?.caminharDificuldade) === "sim") tipos.push("dificuldade ao caminhar");

    // Se não achou nada específico nos campos, mas está no grupo, usa o detalhe geral
    if (tipos.length === 0) return p?.pcdStatus?.detalhes || "mobilidade reduzida identificada";
    
    return tipos.join(", ");
  };

  return (
    <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-[9999] p-10 bg-white text-black font-sans">
      
      <div className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-[1000] uppercase tracking-tighter">Relatório de Auditoria por Especialidade</h1>
          <p className="text-[10px] font-bold lowercase tracking-[3px] opacity-60">Padronização de dados: r s</p>
        </div>
        <div className="text-right text-[9px] font-black uppercase">
          <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {secoes.map((secao, idx) => (
        secao.dados.length > 0 && (
          <div key={idx} className="mb-10 print:break-after-page">
            <div className="bg-slate-900 text-white px-4 py-2 mb-4">
              <h2 className="text-sm font-black uppercase tracking-[4px] italic">
                {secao.titulo} <span className="opacity-50 ml-2">[{secao.dados.length} registros]</span>
              </h2>
            </div>

            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="border-b-2 border-black bg-slate-100">
                  <th className="py-2 px-3 text-left text-[9px] font-black uppercase w-[30%]">paciente / vínculo</th>
                  <th className="py-2 px-3 text-left text-[9px] font-black uppercase w-[35%]">detalhes da condição</th>
                  <th className="py-2 px-3 text-center text-[9px] font-black uppercase w-[20%]">medicação</th>
                  <th className="py-2 px-3 text-right text-[9px] font-black uppercase w-[15%]">emergência</th>
                </tr>
              </thead>
              <tbody>
                {secao.dados.map((p, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    <td className="py-3 px-3">
                      <p className="text-[11px] font-black uppercase leading-tight">{formatarNomeRS(p)}</p>
                      <p className="text-[8px] font-bold lowercase opacity-50 italic">
                        {normalizar(p?.turma || p?.cargo || "colaborador")}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-[10px] lowercase italic font-medium leading-relaxed">
                      {/* LÓGICA DE EXIBIÇÃO POR SEÇÃO */}
                      {secao.titulo.includes("alergia") && (p?.alergias?.detalhes || p?.detalheAlergia || "não especificado")}
                      {secao.titulo.includes("pcd") && (p?.pcdStatus?.detalhes || p?.diagnosticoNeuro?.detalhes || "identificado")}
                      
                      {/* ✅ NOVA LÓGICA ESPECÍFICA PARA MOBILIDADE */}
                      {secao.titulo.includes("mobilidade") && detalharMobilidade(p)}

                      {secao.titulo.includes("crônicas") && (p?.diabetes?.tipo || p?.asma?.detalhes || "crônico identificado")}
                      {secao.titulo.includes("restrição") && (p?.detalheRestricao || "restrição identificada")}
                    </td>
                    <td className="py-3 px-3 text-center text-[9px] font-black uppercase">
                      {typeof p?.medicacaoContinua === 'object' ? p?.medicacaoContinua?.detalhes : p?.medicacaoContinua || "—"}
                    </td>
                    <td className="py-3 px-3 text-right text-[10px] font-mono font-bold">
                      {p?.contatos?.[0]?.telefone || p?.telefoneResponsavel || p?.contatoEmergencia || "n/i"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ))}

      <footer className="mt-10 pt-4 border-t border-black text-center text-[8px] uppercase font-black opacity-30">
        rodhon system - inteligência em saúde e auditoria técnica
      </footer>
    </div>
  );
};

export default AbaFichasMedicasImpressao;