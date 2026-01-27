import { useMemo } from 'react';

const useAuditoria = (atendimentosRaw, alunosRaw, periodo) => {
  return useMemo(() => {
    const alunos = Array.isArray(alunosRaw) ? alunosRaw : Object.values(alunosRaw || {});
    if (alunos.length === 0) return null;

    // Formatação "R S" para exibição (Ex: maia sales -> Maia Sales)
    const formatarRS = (str) => {
      if (!str) return 'não informado';
      return str.toString().toLowerCase().split(' ')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    };

    const normalizar = (val) => val?.toString().toLowerCase().trim() || "";
    
    // Helper para checar "sim" ou true em qualquer formato
    const checar = (valor) => {
      if (valor === undefined || valor === null) return false;
      const v = normalizar(valor);
      return v === 'sim' || v === 'true' || valor === true;
    };

    const atendimentos = Array.isArray(atendimentosRaw) ? atendimentosRaw : Object.values(atendimentosRaw || {});
    const atendimentosFiltrados = atendimentos.filter(a => 
      a.data >= periodo.inicio && a.data <= periodo.fim
    );

    const gruposSaude = {
      alergias: alunos.filter(p => 
        checar(p.alunoPossuiAlergia) || 
        checar(p.alertaSaude?.possuiAlergia) ||
        checar(p.temAlergia)
      ),
      
      acessibilidade: alunos.filter(p => 
        checar(p.alertaSaude?.isPCD) || // Onde está o true no seu log
        checar(p.pcdStatus?.possui) ||  // Onde está o "sim" no seu log
        checar(p.pcd)
      ),
      
      cronicos: alunos.filter(p => 
        checar(p.alertaSaude?.possuiDiabetes) || // "sim" no seu log
        (p.alertaSaude?.medicacaoContinua && p.alertaSaude.medicacaoContinua !== "não") ||
        checar(p.asma) || 
        checar(p.epilepsia)
      ),
      
      restricaoAlimentar: alunos.filter(p => 
        checar(p.restricoesAlimentares)
      )
    };

    return {
      estatisticas: {
        totalAtendimentos: atendimentosFiltrados.length,
        totalFebre: atendimentosFiltrados.filter(a => {
          const t = parseFloat(String(a.temperatura).replace(',', '.'));
          return t >= 37.5;
        }).length,
        rankingQueixas: []
      },
      gruposSaude,
      atendimentos: atendimentosFiltrados,
      nutricional: alunos
        .filter(p => parseFloat(p.peso || p.alertaSaude?.pesoAtual || 0) > 0)
        .map(p => {
          const peso = parseFloat(p.peso || p.alertaSaude?.pesoAtual || 0);
          const altura = parseFloat(p.altura || p.alertaSaude?.alturaAtual || 1); 
          const imc = p.imc || (peso / (altura * altura)).toFixed(2);
          return {
            nome: formatarRS(p.nome || p.nomeBusca),
            turma: normalizar(p.turma),
            peso,
            altura,
            imc: parseFloat(imc)
          };
        })
    };
  }, [atendimentosRaw, alunosRaw, periodo]);
};

export default useAuditoria;