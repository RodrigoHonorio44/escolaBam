import { useMemo } from "react";

const useAuditoria = (
  atendimentosRaw = [],
  alunosRaw = [],
  questionariosRaw = [],
  periodo
) => {
  return useMemo(() => {
    // 🔧 1. NORMALIZAÇÃO DE BASES
    const atendimentos = Array.isArray(atendimentosRaw) ? atendimentosRaw : [];
    
    const mapaSaude = {};
    [...alunosRaw, ...questionariosRaw].forEach(p => {
      const id = p.pacienteId || p.id || p.nomeBusca || p.alunoNome || p.nome;
      if (!id) return;
      mapaSaude[id] = { ...mapaSaude[id], ...p };
    });
    const baseSaude = Object.values(mapaSaude);

    // 🔧 2. HELPERS
    const normalizar = (v) => String(v || "").toLowerCase().trim();

    const toDateString = (data) => {
      if (!data) return null;
      if (typeof data === 'object' && data.seconds) {
        return new Date(data.seconds * 1000).toISOString().split('T')[0];
      }
      if (typeof data === "string") {
        const regex = /^\d{4}-\d{2}-\d{2}/;
        const match = data.match(regex);
        return match ? match[0] : null;
      }
      return null;
    };

    const checar = (campo) => {
      if (!campo) return false;
      if (typeof campo === "object") {
        return normalizar(campo.possui) === "sim" || campo.possui === true;
      }
      const v = normalizar(campo);
      return v === "sim" || v === "true" || campo === true;
    };

    // 📅 3. FILTRO DE PERÍODO
    const atendimentosFiltrados = !periodo?.inicio || !periodo?.fim
      ? atendimentos
      : atendimentos.filter((a) => {
          const dataReg = toDateString(a.data) || toDateString(a.createdAt) || toDateString(a.dataAtendimento);
          return dataReg && dataReg >= periodo.inicio && dataReg <= periodo.fim;
        });

    // 🚨 4. LÓGICA DE SURTOS (Com nomes de alunos e explicação)
    const contagemPorGrupo = atendimentosFiltrados.reduce((acc, a) => {
      const q = normalizar(a.motivoAtendimento || a.motivo || a.queixaPrincipal || "outros");
      if (q !== "nenhum") {
        if (!acc[q]) {
          // Define explicações técnicas automáticas
          const explicacoes = {
            'respiratorio': "Risco de propagação viral. Requer ventilação de ambientes e monitoramento de sintomas gripais.",
            'diarreia': "Suspeita de surto gastrointestinal. Verificar higienização e procedência de alimentos/água.",
            'febre': "Indício de processo infeccioso comunitário. Necessária triagem ativa no grupo.",
            'pele': "Possível surto dermatológico/infectocontagioso. Evitar compartilhamento de objetos.",
            'outros': "Aumento atípico de queixas. Recomenda-se investigação epidemiológica local."
          };

          acc[q] = { 
            total: 0, 
            pacientes: [], 
            justificativa: explicacoes[q] || explicacoes['outros'] 
          };
        }
        
        acc[q].total += 1;
        // Adiciona aluno à lista se não for duplicado no mesmo surto
        const nomeAluno = normalizar(a.alunoNome || a.nome || "não identificado");
        if (!acc[q].pacientes.find(p => p.nome === nomeAluno)) {
          acc[q].pacientes.push({
            nome: nomeAluno,
            data: toDateString(a.dataAtendimento || a.data)
          });
        }
      }
      return acc;
    }, {});

    // 🚨 5. GRUPOS DE SAÚDE FIXOS
    const gruposSaude = {
      alergias: baseSaude.filter(p => 
        checar(p.alergias) || checar(p.qualAlergia) || checar(p.alunoPossuiAlergia) || checar(p.possuiAlergia)
      ),
      acessibilidade: baseSaude.filter(p => 
        checar(p.pcdStatus) || p.pcd === true || p.isPCD === true || p.pcdStatus?.possui === "sim"
      ),
      mobilidade: baseSaude.filter(p => {
        const caminhaSim = normalizar(p.caminharDificuldade) === "sim";
        const cadeiranteFlag = p.mobilidadeAuxilio?.cadeirante === true;
        const andarDificuldade = p.dificuldades?.andar === true;
        const membrosDificuldade = p.dificuldades?.movimentarMembros === true;
        return caminhaSim || cadeiranteFlag || andarDificuldade || membrosDificuldade || checar(p.mobilidadeReduzida);
      }),
      neurodiversidade: baseSaude.filter(p => 
        checar(p.diagnosticoNeuro) || (p.diagnosticoNeuro?.possui === "sim")
      ),
      cronicos: baseSaude.filter(p => 
        checar(p.diabetes) || checar(p.asma) || checar(p.medicacaoContinua) || checar(p.doencasCardiacas)
      ),
      restricaoAlimentar: baseSaude.filter(p => 
        checar(p.restricaoAlimentar) || checar(p.restricoesAlimentares)
      ),
      vulnerabilidade: baseSaude.filter(p => checar(p.historicoViolencia))
    };

    // 🧠 6. RETORNO PARA O DASHBOARD
    return {
      estatisticas: {
        totalAtendimentos: atendimentosFiltrados.length,
        porGrupo: contagemPorGrupo,
        
        rankingQueixas: Object.entries(contagemPorGrupo).map(([label, dados]) => ({
          label,
          value: dados.total
        })).sort((a, b) => b.value - a.value),
        
        alertasCriticos: gruposSaude.alergias.length + gruposSaude.restricaoAlimentar.length,
        pcdNeuro: gruposSaude.acessibilidade.length + gruposSaude.neurodiversidade.length,
        totalMobilidade: gruposSaude.mobilidade.length,
        doencasCronicas: gruposSaude.cronicos.length,
        totalFebre: atendimentosFiltrados.filter(a => {
          const t = parseFloat(String(a.temperatura || "0").replace(",", "."));
          return t >= 37.5;
        }).length,
      },
      gruposSaude,
      atendimentos: atendimentosFiltrados,
    };
  }, [atendimentosRaw, alunosRaw, questionariosRaw, periodo]);
};

export default useAuditoria;