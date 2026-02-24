import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

const useAuditoria = (
  atendimentosRaw = [],
  alunosRaw = [],
  questionariosRaw = [],
  periodo
) => {
  const { user } = useAuth();

  return useMemo(() => {
    // 🛡️ FILTRO DE SEGURANÇA E IDENTIDADE
    // Se não for ROOT, filtramos para processar APENAS dados da escola do usuário logado
    const isRoot = user?.role === 'root' || user?.email === "rodrigohono21@gmail.com";

    const filtrarPorEscola = (lista) => {
      if (isRoot) return lista;
      if (!user?.escolaId) return []; // Segurança: Se não tem ID de escola no login, não vê nada
      
      const escolaAlvo = user.escolaId.toLowerCase().trim();
      return lista.filter(item => 
        (item.escolaId?.toLowerCase().trim() === escolaAlvo) || 
        (item.unidadeId?.toLowerCase().trim() === escolaAlvo)
      );
    };

    // 🔧 1. NORMALIZAÇÃO E FILTRAGEM POR ESCOLA (O coração do multiescola)
    const atendimentosBase = Array.isArray(atendimentosRaw) ? filtrarPorEscola(atendimentosRaw) : [];
    const alunosBase = Array.isArray(alunosRaw) ? filtrarPorEscola(alunosRaw) : [];
    const questionariosBase = Array.isArray(questionariosRaw) ? filtrarPorEscola(questionariosRaw) : [];
    
    // Unifica dados de saúde para não contar o mesmo aluno duas vezes
    const mapaSaude = {};
    [...alunosBase, ...questionariosBase].forEach(p => {
      // Priorizamos o ID da pasta digital para unificação
      const id = (p.pacienteId || p.id || p.nomeBusca || p.nome || "sem-id").toLowerCase().trim();
      if (id === "sem-id") return;
      mapaSaude[id] = { ...mapaSaude[id], ...p };
    });
    const baseSaude = Object.values(mapaSaude);

    // 🔧 2. HELPERS DE FORMATAÇÃO (PADRÃO R S)
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

    // 📅 3. FILTRO DE PERÍODO (Aplicado sobre a base já isolada por escola)
    const atendimentosFiltrados = !periodo?.inicio || !periodo?.fim
      ? atendimentosBase
      : atendimentosBase.filter((a) => {
          const dataReg = toDateString(a.data) || toDateString(a.createdAt) || toDateString(a.dataAtendimento);
          return dataReg && dataReg >= periodo.inicio && dataReg <= periodo.fim;
        });

    // 🚨 4. LÓGICA DE SURTOS EPIDEMIOLÓGICOS (Focado na unidade local)
    const contagemPorGrupo = atendimentosFiltrados.reduce((acc, a) => {
      const q = normalizar(a.motivoAtendimento || a.motivo || a.queixaPrincipal || "outros");
      
      if (q !== "nenhum" && q !== "") {
        if (!acc[q]) {
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
        const nomeAluno = normalizar(a.nomePaciente || a.alunoNome || a.nome || "paciente oculto");
        
        if (!acc[q].pacientes.find(p => p.nome === nomeAluno)) {
          acc[q].pacientes.push({
            nome: nomeAluno,
            data: toDateString(a.dataAtendimento || a.data || a.createdAt)
          });
        }
      }
      return acc;
    }, {});

    // 🏥 5. MAPEAMENTO DE GRUPOS DE RISCO (Isolado por escolaId)
    const gruposSaude = {
      alergias: baseSaude.filter(p => 
        checar(p.alergias) || checar(p.qualAlergia) || checar(p.alunoPossuiAlergia)
      ),
      acessibilidade: baseSaude.filter(p => 
        checar(p.pcdStatus) || p.pcd === true || p.isPCD === true || p.isPcd === "sim"
      ),
      mobilidade: baseSaude.filter(p => {
        const d = normalizar(p.caminharDificuldade) === "sim" || 
                  p.mobilidadeAuxilio?.cadeirante === true || 
                  checar(p.mobilidadeReduzida);
        return d;
      }),
      neurodiversidade: baseSaude.filter(p => 
        checar(p.diagnosticoNeuro) || p.diagnosticoNeuro?.possui === "sim"
      ),
      cronicos: baseSaude.filter(p => 
        checar(p.diabetes) || checar(p.asma) || checar(p.medicacaoContinua)
      ),
      restricaoAlimentar: baseSaude.filter(p => 
        checar(p.restricaoAlimentar) || checar(p.restricoesAlimentares)
      ),
      vulnerabilidade: baseSaude.filter(p => checar(p.historicoViolencia))
    };

    // 🧠 6. RETORNO PARA O DASHBOARD (Calculado em tempo real para a escola logada)
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
  }, [atendimentosRaw, alunosRaw, questionariosRaw, periodo, user]);
};

export default useAuditoria;