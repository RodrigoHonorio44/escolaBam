import { useMemo } from 'react';

const useAuditoria = (atendimentosRaw, alunosRaw, periodo) => {
  return useMemo(() => {
    // Garantia de que temos arrays para trabalhar
    const alunos = Array.isArray(alunosRaw) ? alunosRaw : Object.values(alunosRaw || {});
    const atendimentos = Array.isArray(atendimentosRaw) ? atendimentosRaw : Object.values(atendimentosRaw || {});

    // Se não houver alunos, evitamos processamento desnecessário, mas retornamos estrutura básica
    if (alunos.length === 0 && atendimentos.length === 0) {
      return { 
        estatisticas: { totalAtendimentos: 0, totalFebre: 0, rankingQueixas: [], rankingAlunos: [] },
        gruposSaude: { alergias: [], acessibilidade: [], cronicos: [], restricaoAlimentar: [] },
        atendimentos: [],
        nutricional: [] 
      };
    }

    // --- HELPERS DE FORMATAÇÃO ---
    const formatarRS = (str) => {
      if (!str || str === 'n/i') return 'não informado';
      return str.toString().toLowerCase().split(' ')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    };

    const normalizar = (val) => val?.toString().toLowerCase().trim() || "";
    
    const checar = (valor) => {
      if (valor === undefined || valor === null) return false;
      const v = normalizar(valor);
      return v === 'sim' || v === 'true' || valor === true;
    };

    // --- FILTRAGEM DE ATENDIMENTOS (Blindada contra strings ISO completas) ---
    const atendimentosFiltrados = atendimentos.filter(a => {
      if (!a.data) return false;
      // Garante que a data do atendimento seja comparada apenas YYYY-MM-DD
      const dataSimples = a.data.includes('T') ? a.data.split('T')[0] : a.data;
      return dataSimples >= periodo.inicio && dataSimples <= periodo.fim;
    });

    // --- RANKING DE QUEIXAS (DINÂMICO) ---
    const contagemQueixas = atendimentosFiltrados.reduce((acc, a) => {
      const motivo = normalizar(a.motivoAtendimento || "outros");
      acc[motivo] = (acc[motivo] || 0) + 1;
      return acc;
    }, {});

    const rankingQueixas = Object.entries(contagemQueixas)
      .map(([label, value]) => ({ 
        label: formatarRS(label), 
        value 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // --- RANKING DE ALUNOS (Para AbaRecidiva) ---
    const contagemAlunos = atendimentosFiltrados.reduce((acc, a) => {
      const nome = a.alunoNome || a.nome || a.nomePaciente;
      if (nome) {
        const n = normalizar(nome);
        acc[n] = (acc[n] || 0) + 1;
      }
      return acc;
    }, {});

    const rankingAlunos = Object.entries(contagemAlunos).sort((a, b) => b[1] - a[1]);

    // --- GRUPOS DE SAÚDE (Mantendo as antigas e incluindo as novas propriedades) ---
    const gruposSaude = {
      alergias: alunos.filter(p => 
        checar(p.alunoPossuiAlergia) || 
        checar(p.alertaSaude?.possuiAlergia) ||
        checar(p.alergias?.possui) || // Nova estrutura
        checar(p.temAlergia)
      ),
      acessibilidade: alunos.filter(p => 
        checar(p.alertaSaude?.isPCD) || 
        checar(p.pcdStatus?.possui) ||  // Nova estrutura
        checar(p.diagnosticoNeuro?.detalhes) || // Nova estrutura
        checar(p.pcd)
      ),
      cronicos: alunos.filter(p => 
        checar(p.alertaSaude?.possuiDiabetes) || 
        checar(p.diabetes?.possui) || // Nova estrutura
        checar(p.asma?.possui) ||     // Nova estrutura
        (p.alertaSaude?.medicacaoContinua && p.alertaSaude.medicacaoContinua !== "não") ||
        checar(p.asma) || 
        checar(p.epilepsia)
      ),
      restricaoAlimentar: alunos.filter(p => 
        checar(p.restricoesAlimentares?.possui) || // Nova estrutura
        checar(p.restricoesAlimentares)
      )
    };

    // --- DADOS NUTRICIONAIS (IMC) ---
    const nutricional = alunos
      .filter(p => parseFloat(p.peso || p.alertaSaude?.pesoAtual || 0) > 0)
      .map(p => {
        const peso = parseFloat(p.peso || p.alertaSaude?.pesoAtual || 0);
        let altura = parseFloat(p.altura || p.alertaSaude?.alturaAtual || 1); 
        if (altura > 3) altura = altura / 100;

        const imcCalculado = (peso / (altura * altura)).toFixed(2);
        const imcFinal = parseFloat(p.imc || imcCalculado);
        
        // Determina status para facilitar exibição
        let status = "normal";
        if (imcFinal < 18.5) status = "baixo peso";
        if (imcFinal >= 30) status = "obesidade";

        return {
          nome: formatarRS(p.nome || p.nomeBusca || p.alunoNome),
          turma: normalizar(p.turma),
          peso,
          altura,
          imc: imcFinal,
          status
        };
      });

    const alertasNutricionais = nutricional.filter(n => n.status !== "normal");

    return {
      estatisticas: {
        totalAtendimentos: atendimentosFiltrados.length,
        totalFebre: atendimentosFiltrados.filter(a => {
          // Blindagem para não quebrar se a temperatura for string ou undefined
          const tStr = String(a.temperatura || "0").replace(',', '.');
          const t = parseFloat(tStr);
          return t >= 37.5;
        }).length,
        rankingQueixas,
        rankingAlunos,
        alertasNutricionais // Usado pela AbaNutricional
      },
      gruposSaude,
      atendimentos: atendimentosFiltrados,
      nutricional
    };
  }, [atendimentosRaw, alunosRaw, periodo]);
};

export default useAuditoria;