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

  const getInitialFormState = () => ({
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
    procedimentos: '',
    medicacao: '',
    observacoes: '',
    destinoHospital: '', 
    motivoEncaminhamento: '',
    obsEncaminhamento: '', 
    alunoPossuiAlergia: 'não',
    qualAlergia: '',
    pacienteId: ''
  });

  const [formData, setFormData] = useState(getInitialFormState());

  // Lógica de cálculo de IMC aprimorada
  const calcularIMC = (peso, altura) => {
    const p = parseFloat(String(peso).replace(',', '.'));
    const a = parseFloat(String(altura).replace(',', '.'));
    if (p > 0 && a > 0.5) {
      return (p / (a * a)).toFixed(2);
    }
    return '';
  };

  const updateField = useCallback((campo, valor) => {
    setFormData(prev => {
      // Normalização: Strings em lowercase, números mantidos para cálculo
      const valorFormatado = typeof valor === 'string' ? valor.toLowerCase() : valor;
      const novoEstado = { ...prev, [campo]: valorFormatado };
      
      if (campo === 'peso' || campo === 'altura') {
        novoEstado.imc = calcularIMC(novoEstado.peso, novoEstado.altura);
      }
      return novoEstado;
    });
  }, []);

  // Sincronização de sugestões
  useEffect(() => {
    if (formData.nomePaciente.length > 2) {
      buscarSugestoes(formData.nomePaciente.toLowerCase());
    }
  }, [formData.nomePaciente, buscarSugestoes]);

  // Cálculo de Idade
  useEffect(() => {
    if (formData.dataNascimento && !configUI.naoSabeDataNasc) {
      const hoje = new Date();
      const nasc = new Date(formData.dataNascimento);
      let idade = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) { idade--; }
      setFormData(prev => ({ ...prev, idade: idade >= 0 ? idade.toString() : '' }));
    }
  }, [formData.dataNascimento, configUI.naoSabeDataNasc]);

  const selecionarPaciente = async (p) => {
    setMostrarSugestoes(false);
    const toastId = toast.loading("sincronizando dados...");
    
    const nomeLimpo = (p.nome || p.nomeBusca || p.nomePaciente || "").toLowerCase();
    const dataNasc = p.dataNascimento || "";

    const nomeParaId = nomeLimpo.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, '-');
    const dataParaId = dataNasc ? dataNasc.replace(/-/g, '') : 'nd';
    const idSugerido = (p.id || p.pacienteId || `${nomeParaId}-${dataParaId}`).toLowerCase();

    let dados = await puxarDadosCompletos(nomeLimpo, dataNasc);

    if (dados) {
      // GARANTE QUE NÚMEROS NÃO QUEBREM O FORMULÁRIO
      const pesoValue = dados.peso ? String(dados.peso).replace('.', ',') : "";
      const alturaValue = dados.altura ? String(dados.altura).replace('.', ',') : "";
      
      setFormData(prev => ({
        ...prev,
        pacienteId: idSugerido,
        nomePaciente: nomeLimpo, 
        dataNascimento: dados.dataNascimento || dataNasc,
        sexo: (dados.sexo || "").toLowerCase(),
        turma: (dados.turma || "").toLowerCase(),
        cargo: (dados.cargo || "").toLowerCase(),
        etnia: (dados.etnia || "").toLowerCase(),
        peso: pesoValue,
        altura: alturaValue,
        imc: calcularIMC(pesoValue, alturaValue),
        alunoPossuiAlergia: (dados.alunoPossuiAlergia || 'não').toLowerCase(),
        qualAlergia: (dados.qualAlergia || '').toLowerCase(),
        observacoes: (dados.observacoes || "").toLowerCase()
      }));

      setConfigUI(prev => ({ 
        ...prev, 
        naoSabePeso: !dados.peso, 
        naoSabeAltura: !dados.altura,
        perfilPaciente: (dados.perfil || 'aluno').toLowerCase()
      }));
      setTemCadastro(true);
      toast.success("perfil sincronizado!", { id: toastId });
    } else {
      toast.error("histórico não encontrado.", { id: toastId });
    }
  };

  const salvarAtendimento = async (e) => {
    if (e) e.preventDefault();
    if (!validarNomeCompleto(formData.nomePaciente)) {
      toast.error("nome e sobrenome!");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("processando registro...");

    try {
      const batch = writeBatch(db);
      const horaSaida = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // 1. Limpeza e Normalização (Lowercase em tudo que é string)
      const payload = JSON.parse(JSON.stringify(formData), (key, value) => 
        typeof value === 'string' ? value.toLowerCase().trim() : value
      );

      // 2. Definição de Status
      const ehRemocao = configUI.tipoAtendimento === 'remocao' || payload.motivoEncaminhamento.length > 2;
      const statusAtendimento = ehRemocao ? 'pendente' : 'finalizado';
      const tipoRegistro = ehRemocao ? 'remoção' : 'local';

      // 3. Conversão Numérica Rigorosa para o Firebase
      const numericData = {
        ...payload,
        idade: parseInt(payload.idade) || 0,
        peso: parseFloat(String(payload.peso).replace(',', '.')) || 0,
        altura: parseFloat(String(payload.altura).replace(',', '.')) || 0,
        imc: parseFloat(String(payload.imc).replace(',', '.')) || 0,
        temperatura: parseFloat(String(payload.temperatura).replace(',', '.')) || 0
      };

      // 4. Criação do ID Único da Pasta Digital
      const nomeParaId = payload.nomePaciente
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, '-');
      const dataParaId = payload.dataNascimento ? payload.dataNascimento.replace(/-/g, '') : 'nd';
      const idPasta = `${nomeParaId}-${dataParaId}`.toLowerCase();

      const finalData = {
        ...numericData,
        pacienteId: idPasta,
        horarioSaida: horaSaida,
        statusAtendimento, 
        tipoRegistro,      
        perfilPaciente: configUI.perfilPaciente.toLowerCase(),
        escola: (user?.escola || "unidade").toLowerCase(), // Usa 'escola' em vez de escolaId
        profissionalResponsavel: (user?.nome || "profissional").toLowerCase(),
        registroProfissional: (user?.registroProfissional || "n/a").toLowerCase(),
        createdAt: serverTimestamp()
      };

      // Salva o Atendimento
      batch.set(doc(collection(db, "atendimentos_enfermagem")), finalData);

      // Atualiza ou Cria a Pasta Digital (Histórico Acumulado)
      batch.set(doc(db, "pastas_digitais", idPasta), {
        nomeBusca: finalData.nomePaciente,
        dataNascimento: finalData.dataNascimento,
        peso: finalData.peso,
        altura: finalData.altura,
        imc: finalData.imc,
        etnia: finalData.etnia,
        sexo: finalData.sexo,
        turma: finalData.turma,
        alunoPossuiAlergia: finalData.alunoPossuiAlergia,
        qualAlergia: finalData.qualAlergia,
        ultimoStatusClinico: statusAtendimento === 'pendente' ? 'em remoção' : 'estável',
        ultimaUnidade: finalData.escola,
        ultimaAtualizacao: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      
      toast.success(ehRemocao ? "remoção registrada!" : "atendimento finalizado!", { id: toastId });
      setFormData(getInitialFormState());
      setTemCadastro(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("erro ao salvar no banco", { id: toastId });
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