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
    
    // Unificação por ID para evitar duplicados entre 'alunos' e 'questionarios'
    const mapaSaude = {};
    [...alunosRaw, ...questionariosRaw].forEach(p => {
      // Tenta mapear todos os IDs possíveis que vimos nas suas coleções
      const id = p.pacienteId || p.id || p.nomeBusca || p.alunoNome || p.nome;
      if (!id) return;
      mapaSaude[id] = { ...mapaSaude[id], ...p };
    });
    const baseSaude = Object.values(mapaSaude);

    // 🔧 2. HELPERS (Lowercase e Parser de Data)
    const normalizar = (v) => String(v || "").toLowerCase().trim();

    const toDateString = (data) => {
      if (!data) return null;
      // Trata Timestamp do Firebase (objeto com seconds)
      if (typeof data === 'object' && data.seconds) {
        return new Date(data.seconds * 1000).toISOString().split('T')[0];
      }
      // Trata strings YYYY-MM-DD
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

    // 📅 3. FILTRO DE PERÍODO (Afeta apenas a contagem de atendimentos)
    const atendimentosFiltrados = !periodo?.inicio || !periodo?.fim
      ? atendimentos
      : atendimentos.filter((a) => {
          // Busca data nos campos identificados nas suas coleções
          const dataReg = toDateString(a.data) || toDateString(a.createdAt);
          return dataReg && dataReg >= periodo.inicio && dataReg <= periodo.fim;
        });

    // 🚨 4. GRUPOS DE SAÚDE (Busca na base completa, ignorando data)
    const gruposSaude = {
      alergias: baseSaude.filter(p => 
        checar(p.alergias) || checar(p.qualAlergia) || checar(p.alunoPossuiAlergia) || checar(p.possuiAlergia)
      ),

      acessibilidade: baseSaude.filter(p => 
        checar(p.pcdStatus) || p.pcd === true || p.isPCD === true || p.pcdStatus?.possui === "sim"
      ),

      // ♿ MAPEAMENTO DE MOBILIDADE (Baseado no seu log do Caio Giromba)
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
        checar(p.diabetes) || checar(p.asma) || 
        checar(p.medicacaoContinua) || checar(p.doencasCardiacas)
      ),

      restricaoAlimentar: baseSaude.filter(p => 
        checar(p.restricaoAlimentar) || checar(p.restricoesAlimentares)
      ),
      
      vulnerabilidade: baseSaude.filter(p => checar(p.historicoViolencia))
    };

    // 🧠 5. RETORNO PARA O DASHBOARD
    return {
      estatisticas: {
        totalAtendimentos: atendimentosFiltrados.length,
        rankingQueixas: Object.values(
          atendimentosFiltrados.reduce((acc, a) => {
            const q = normalizar(a.motivoAtendimento || a.motivo || "outros");
            acc[q] = { label: q, value: (acc[q]?.value || 0) + 1 };
            return acc;
          }, {})
        ).sort((a, b) => b.value - a.value),
        
        alertasCriticos: gruposSaude.alergias.length + gruposSaude.restricaoAlimentar.length,
        pcdNeuro: gruposSaude.acessibilidade.length + gruposSaude.neurodiversidade.length,
        totalMobilidade: gruposSaude.mobilidade.length, // Adicionado aqui
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