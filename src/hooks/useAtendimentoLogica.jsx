import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, serverTimestamp, doc, getDoc,
  writeBatch 
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { usePacienteSinc } from './usePacienteSinc';

export const useAtendimentoLogica = (user) => {
  const [loading, setLoading] = useState(false);
  const [temCadastro, setTemCadastro] = useState(false);
  const { buscarSugestoes, sugestoes, puxarDadosCompletos, buscando } = usePacienteSinc();
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // ✅ EXTRAÇÃO SEGURA E NORMALIZADA (PADRÃO R S)
  const escolaIdLogada = user?.escolaId?.toLowerCase().trim() || null;
  const escolaNomeLogada = user?.escola?.toLowerCase().trim() || null;

  const GRUPOS_RISCO = {
    "gastrointestinal": ["dor abdominal", "náusea/vômito", "diarreia", "enjoo"],
    "respiratório": ["febre", "sintomas gripais", "dor de garganta", "tosse"],
    "infestação": ["coceira intensa", "pediculose", "lesões de pele"],
    "ansiedade": ["crise de ansiedade", "falta de ar"]
  };

  const identificarGrupoRisco = (queixa) => {
    if (!queixa) return "nenhum";
    const queixaLower = queixa.toLowerCase().trim();
    return Object.keys(GRUPOS_RISCO).find(grupo => 
      GRUPOS_RISCO[grupo].includes(queixaLower)
    ) || "nenhum";
  };

  const [configUI, setConfigUI] = useState({
    tipoAtendimento: 'local', 
    perfilPaciente: 'aluno',
    naoSabeDataNasc: false,
    naoSabePeso: false,
    naoSabeAltura: false,
    houveMedicacao: 'não'
  });

  const validarNomeCompleto = (nome) => {
    const partes = nome.trim().split(/\s+/);
    return partes.length >= 2 && partes[1].length >= 2;
  };

  const gerarIdPadrao = useCallback((nome, data) => {
    if (!nome) return '';
    const nomeLimpo = nome.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^a-z0-9\s]/g, "") 
      .replace(/\s+/g, '-'); 
    
    const dataLimpa = data ? data.replace(/-/g, '') : 'nd';
    return `${escolaIdLogada}-${nomeLimpo}-${dataLimpa}`;
  }, [escolaIdLogada]);

  const getDataLocal = () => {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  };

  const getInitialFormState = useCallback(() => ({
    baenf: `baenf-2026-${Math.random().toString(36).substring(2, 8).toLowerCase()}`,
    data: getDataLocal(),
    // ✅ Inicializa com a hora atual, mas permite edição posterior
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    horarioSaida: '', 
    nomePaciente: '',
    dataNascimento: '',
    idade: '',
    sexo: '',
    estaGestante: 'não',
    semanasGestacao: '',
    dum: '',
    preNatal: 'nao',
    turma: '',
    cargo: '',
    etnia: '',
    temperatura: '',
    pa: '', 
    hgt: '', 
    peso: '',
    altura: '',
    imc: '',
    motivoAtendimento: '',
    grupoRisco: 'nenhum',
    procedimentos: '',
    medicacao: '',
    observacoes: '',
    destinoHospital: '',
    motivoEncaminhamento: '',
    obsEncaminhamento: '',
    alunoPossuiAlergia: 'não',
    qualAlergia: '',
    pacienteId: '',
    condicoesEspeciais: [], 
    contatoEmergencia: '', 
    registroProfissional: (user?.registroProfissional || user?.coren || "n/a").toLowerCase()
  }), [user]);

  const [formData, setFormData] = useState(getInitialFormState());

  // ✅ CÁLCULO DE IDADE AUTOMÁTICO
  useEffect(() => {
    if (formData.dataNascimento && formData.dataNascimento.length === 10) {
      const hoje = new Date();
      const [ano, mes, dia] = formData.dataNascimento.split('-').map(Number);
      const nascimento = new Date(ano, mes - 1, dia);

      if (!isNaN(nascimento.getTime())) {
        let idadeCalculada = hoje.getFullYear() - nascimento.getFullYear();
        const m = hoje.getMonth() - nascimento.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
          idadeCalculada--;
        }
        const idadeFinal = (idadeCalculada >= 0 && idadeCalculada < 120) ? String(idadeCalculada) : "";
        if (formData.idade !== idadeFinal) {
          setFormData(prev => ({ ...prev, idade: idadeFinal }));
        }
      }
    } else if (formData.idade !== "") {
       setFormData(prev => ({ ...prev, idade: "" }));
    }
  }, [formData.dataNascimento, formData.idade]);

  useEffect(() => {
    if (formData.nomePaciente.length > 2) {
      buscarSugestoes(formData.nomePaciente.toLowerCase());
    }
  }, [formData.nomePaciente, buscarSugestoes]);

  // ✅ UPDATE FIELD ATUALIZADO PARA LIBERAR O HORÁRIO
  const updateField = useCallback((campo, valor) => {
    // REMOVIDO: if (campo === 'horario') return; 
    setFormData(prev => {
      const valorFormatado = typeof valor === 'string' ? valor.toLowerCase() : valor;
      let novoEstado = { ...prev, [campo]: valorFormatado };
      
      if (campo === 'sexo' && valorFormatado !== 'feminino') {
        novoEstado.estaGestante = 'não';
        novoEstado.semanasGestacao = '';
        novoEstado.dum = '';
        novoEstado.preNatal = 'nao';
      }
      if (campo === 'motivoAtendimento') {
        novoEstado.grupoRisco = identificarGrupoRisco(valorFormatado);
      }
      if (campo === 'peso' || campo === 'altura') {
        const p = parseFloat(String(novoEstado.peso).replace(',', '.'));
        const a = parseFloat(String(novoEstado.altura).replace(',', '.'));
        novoEstado.imc = (p > 0 && a > 0.5) ? parseFloat((p / (a * a)).toFixed(2)) : 0;
      }
      return novoEstado;
    });
  }, []);

  const selecionarPaciente = async (p) => {
    setMostrarSugestoes(false);
    const toastId = toast.loading("Sincronizando prontuário...");
    const nomeOriginal = (p.nome || p.nomeBusca || p.nomePaciente || "").toLowerCase().trim();
    let dataParaInput = p.dataNascimento || "";

    if (dataParaInput.includes('-') && dataParaInput.split('-')[0].length === 2) {
      const [d, m, a] = dataParaInput.split('-');
      dataParaInput = `${a}-${m}-${d}`;
    }

    try {
      const dados = await puxarDadosCompletos(nomeOriginal, dataParaInput);

      if (dados) {
        setFormData(prev => ({
          ...prev,
          pacienteId: dados.id,
          nomePaciente: dados.nome,
          dataNascimento: dados.dataNascimento, 
          sexo: dados.sexo,
          turma: dados.turma,
          etnia: dados.etnia,
          peso: dados.peso || "",
          altura: dados.altura || "", 
          alunoPossuiAlergia: dados.alunoPossuiAlergia || 'não',
          qualAlergia: dados.qualAlergia || '',
          contatoEmergencia: dados.contatos?.[0]?.telefone ? `${dados.contatos[0].nome} (${dados.contatos[0].telefone})`.toLowerCase() : ''
        }));
        setTemCadastro(true);
        toast.success("Perfil carregado!", { id: toastId });
      }
    } catch (err) { toast.error("Erro ao carregar dados.", { id: toastId }); }
  };

  const salvarAtendimento = async (e) => {
    if (e) e.preventDefault();
    if (!escolaIdLogada) {
      toast.error("Unidade não identificada.");
      return;
    }
    if (!validarNomeCompleto(formData.nomePaciente)) {
      toast.error("Nome completo obrigatório!");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Salvando...");

    try {
      const batch = writeBatch(db);
      const agoraHora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const eFuncionario = configUI.perfilPaciente === 'funcionario';
      const colecaoBase = eFuncionario ? "funcionarios" : "alunos";

      const payload = JSON.parse(JSON.stringify(formData), (key, value) => 
        typeof value === 'string' ? value.toLowerCase().trim() : value
      );

      const idPasta = gerarIdPadrao(payload.nomePaciente, formData.dataNascimento);
      const eRemocao = configUI.tipoAtendimento === 'remocao';

      const finalDataAtendimento = {
        ...payload,
        escolaId: escolaIdLogada,
        escola: escolaNomeLogada,
        unidadeId: escolaIdLogada,
        unidade: escolaNomeLogada, 
        pacienteId: idPasta, 
        idade: Number(payload.idade) || 0,
        peso: Number(String(payload.peso).replace(',', '.')) || 0,
        altura: Number(String(payload.altura).replace(',', '.')) || 0,
        imc: Number(payload.imc) || 0,
        temperatura: Number(String(payload.temperatura).replace(',', '.')) || 0,
        horarioSaida: agoraHora, 
        statusAtendimento: eRemocao ? 'pendente' : 'finalizado',
        createdAt: serverTimestamp()
      };

      if (eFuncionario) { delete finalDataAtendimento.turma; } else { delete finalDataAtendimento.cargo; }
      delete finalDataAtendimento.condicoesEspeciais;
      delete finalDataAtendimento.contatoEmergencia;

      const finalDataPasta = {
        id: idPasta,
        escolaId: escolaIdLogada,
        escola: escolaNomeLogada,
        nomeBusca: finalDataAtendimento.nomePaciente,
        dataNascimento: finalDataAtendimento.dataNascimento,
        sexo: finalDataAtendimento.sexo,
        tipoPerfil: configUI.perfilPaciente.toLowerCase(),
        peso: finalDataAtendimento.peso,
        altura: finalDataAtendimento.altura,
        ultimaAtualizacao: serverTimestamp(),
        ...(eFuncionario ? { cargo: finalDataAtendimento.cargo } : { turma: finalDataAtendimento.turma })
      };

      batch.set(doc(db, "atendimentos_enfermagem", finalDataAtendimento.baenf), finalDataAtendimento);
      batch.set(doc(db, colecaoBase, idPasta), { ...finalDataPasta, nome: finalDataAtendimento.nomePaciente }, { merge: true });
      batch.set(doc(db, "pastas_digitais", idPasta), finalDataPasta, { merge: true });

      await batch.commit();
      toast.success(eRemocao ? "Remoção pendente!" : "Atendimento finalizado!", { id: toastId });
      setFormData(getInitialFormState());
      setTemCadastro(false);
      return true; 
    } catch (error) {
      toast.error("Erro ao salvar", { id: toastId });
      return false;
    } finally { setLoading(false); }
  };

  return {
    formData, updateField, loading, configUI, setConfigUI,
    sugestoes, mostrarSugestoes, setMostrarSugestoes, buscando,
    buscarSugestoes, selecionarPaciente, salvarAtendimento, temCadastro, 
    validarNomeCompleto
  };
};