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

  // --- MAPEAMENTO DE SURTOS R S (Para lógica interna) ---
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
    return `${nomeLimpo}-${dataLimpa}`;
  }, []);

  const getInitialFormState = useCallback(() => ({
    baenf: `baenf-2026-${Math.random().toString(36).substring(2, 8).toLowerCase()}`,
    data: new Date().toISOString().split('T')[0],
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    horarioSaida: '', 
    nomePaciente: '',
    dataNascimento: '',
    idade: '',
    sexo: '',
    turma: '',
    cargo: '',
    etnia: '',
    temperatura: '',
    peso: '',
    altura: '',
    imc: '',
    motivoAtendimento: '',
    grupoRisco: 'nenhum', // NOVO CAMPO
    procedimentos: '',
    medicacao: '',
    observacoes: '',
    destinoHospital: '',
    motivoEncaminhamento: '',
    obsEncaminhamento: '',
    alunoPossuiAlergia: 'não',
    qualAlergia: '',
    pacienteId: '',
    registroProfissional: (user?.registroProfissional || user?.coren || "n/a").toLowerCase()
  }), [user]);

  const [formData, setFormData] = useState(getInitialFormState());

  useEffect(() => {
    if (formData.nomePaciente.length > 2) {
      buscarSugestoes(formData.nomePaciente.toLowerCase());
    }
  }, [formData.nomePaciente, buscarSugestoes]);

  // UPDATE FIELD COM DETECÇÃO DE SURTO
  const updateField = useCallback((campo, valor) => {
    setFormData(prev => {
      const valorFormatado = typeof valor === 'string' ? valor.toLowerCase() : valor;
      let novoEstado = { ...prev, [campo]: valorFormatado };
      
      // Se mudar o motivo, atualiza o grupo de risco automaticamente
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

  useEffect(() => {
    if (formData.dataNascimento && !configUI.naoSabeDataNasc) {
      const hoje = new Date();
      const nasc = new Date(formData.dataNascimento);
      let idadeCalc = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) { idadeCalc--; }
      setFormData(prev => ({ ...prev, idade: idadeCalc >= 0 ? idadeCalc : '' }));
    }
  }, [formData.dataNascimento, configUI.naoSabeDataNasc]);

  const selecionarPaciente = async (p) => {
    setMostrarSugestoes(false);
    const toastId = toast.loading("sincronizando...");
    const nomeOriginal = (p.nome || p.nomeBusca || p.nomePaciente || "").toLowerCase().trim();
    let dataParaInput = p.dataNascimento || "";

    if (dataParaInput.includes('-') && dataParaInput.split('-')[0].length === 2) {
      const [d, m, a] = dataParaInput.split('-');
      dataParaInput = `${a}-${m}-${d}`;
    }

    const idSugerido = gerarIdPadrao(nomeOriginal, dataParaInput);

    try {
      const docRef = doc(db, "pastas_digitais", idSugerido);
      const docSnap = await getDoc(docRef);
      let dados = docSnap.exists() ? docSnap.data() : await puxarDadosCompletos(nomeOriginal, dataParaInput);

      if (dados) {
        setFormData(prev => ({
          ...prev,
          pacienteId: idSugerido,
          nomePaciente: nomeOriginal,
          dataNascimento: dataParaInput, 
          sexo: (dados.sexo || "").toLowerCase(),
          turma: (dados.turma || "").toLowerCase(),
          cargo: (dados.cargo || "").toLowerCase(),
          etnia: (dados.etnia || "").toLowerCase(),
          peso: dados.peso || "",
          altura: dados.altura || "",
          imc: dados.imc || 0,
          alunoPossuiAlergia: (dados.alunoPossuiAlergia || 'não').toLowerCase(),
          qualAlergia: (dados.qualAlergia || '').toLowerCase()
        }));

        const perfil = dados.tipoPerfil || (dados.cargo ? 'funcionario' : 'aluno');
        setConfigUI(prev => ({ ...prev, perfilPaciente: perfil }));
        setTemCadastro(true);
        toast.success("perfil carregado!", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("erro ao carregar dados.", { id: toastId });
    }
  };

  const salvarAtendimento = async (e) => {
    if (e) e.preventDefault();
    if (!validarNomeCompleto(formData.nomePaciente)) {
      toast.error("nome completo obrigatório!");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("salvando...");

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
        dataNascimento: formData.dataNascimento, 
        pacienteId: idPasta, 
        idade: Number(payload.idade) || 0,
        peso: Number(payload.peso) || 0,
        altura: Number(payload.altura) || 0,
        imc: Number(payload.imc) || 0,
        temperatura: Number(payload.temperatura) || 0,
        horarioSaida: agoraHora,
        statusAtendimento: eRemocao ? 'pendente' : 'finalizado',
        tipoRegistro: eRemocao ? 'remoção' : 'local',
        perfilPaciente: configUI.perfilPaciente,
        escola: (user?.escolaId || "e. m. anísio teixeira").toLowerCase(),
        profissionalResponsavel: (user?.nome || "profissional").toLowerCase(),
        createdAt: serverTimestamp()
      };

      if (eFuncionario) { delete finalDataAtendimento.turma; } 
      else { delete finalDataAtendimento.cargo; }

      const finalDataPasta = {
        id: idPasta,
        nomeBusca: finalDataAtendimento.nomePaciente,
        dataNascimento: finalDataAtendimento.dataNascimento,
        sexo: finalDataAtendimento.sexo,
        etnia: finalDataAtendimento.etnia,
        peso: finalDataAtendimento.peso,
        altura: finalDataAtendimento.altura,
        imc: finalDataAtendimento.imc,
        tipoPerfil: finalDataAtendimento.perfilPaciente,
        alunoPossuiAlergia: finalDataAtendimento.alunoPossuiAlergia,
        qualAlergia: finalDataAtendimento.qualAlergia,
        ultimaAtualizacao: serverTimestamp(),
        ...(eFuncionario ? { cargo: finalDataAtendimento.cargo } : { turma: finalDataAtendimento.turma })
      };

      batch.set(doc(db, "atendimentos_enfermagem", finalDataAtendimento.baenf), finalDataAtendimento);
      
      const dataColecaoSimples = {
        nome: finalDataAtendimento.nomePaciente,
        dataNascimento: finalDataAtendimento.dataNascimento,
        sexo: finalDataAtendimento.sexo,
        ultimaAtualizacao: serverTimestamp(),
        ...(eFuncionario ? { cargo: finalDataAtendimento.cargo } : { turma: finalDataAtendimento.turma })
      };
      
      batch.set(doc(db, colecaoBase, idPasta), dataColecaoSimples, { merge: true });
      batch.set(doc(db, "pastas_digitais", idPasta), finalDataPasta, { merge: true });

      await batch.commit();
      
      toast.success(eRemocao ? "remoção pendente!" : "atendimento finalizado!", { id: toastId });
      setFormData(getInitialFormState());
      setTemCadastro(false);
    } catch (error) {
      console.error(error);
      toast.error("erro ao salvar", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData, updateField, loading, configUI, setConfigUI,
    sugestoes, mostrarSugestoes, setMostrarSugestoes, buscando,
    buscarSugestoes, selecionarPaciente, salvarAtendimento, temCadastro, 
    validarNomeCompleto
  };
};