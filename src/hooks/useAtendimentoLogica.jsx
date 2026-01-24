import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, serverTimestamp, doc, 
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
    alunoPossuiAlergia: 'não',
    qualAlergia: '',
    pacienteId: ''
  });

  const [formData, setFormData] = useState(getInitialFormState());

  // useEffect para disparar a busca de sugestões conforme digita
  useEffect(() => {
    if (formData.nomePaciente.length > 2) {
      buscarSugestoes(formData.nomePaciente.toLowerCase());
    }
  }, [formData.nomePaciente, buscarSugestoes]);

  const updateField = useCallback((campo, valor) => {
    setFormData(prev => {
      // Normalização automática para campos de texto
      const valorFormatado = typeof valor === 'string' ? valor.toLowerCase() : valor;
      const novoEstado = { ...prev, [campo]: valorFormatado };
      
      if (campo === 'peso' || campo === 'altura') {
        const p = parseFloat(String(novoEstado.peso).replace(',', '.'));
        const a = parseFloat(String(novoEstado.altura).replace(',', '.'));
        if (p > 0 && a > 0.5) { 
          novoEstado.imc = (p / (a * a)).toFixed(2);
        } else {
          novoEstado.imc = '';
        }
      }
      return novoEstado;
    });
  }, []);

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
    const toastId = toast.loading("sincronizando histórico total...");
    
    // Tenta buscar pelo nome ou nomeBusca (o que vier da sugestão)
    const nomeBusca = p.nome || p.nomeBusca || p.nomePaciente;
    const dados = await puxarDadosCompletos(nomeBusca.toLowerCase(), p.dataNascimento);

    if (dados) {
      setFormData(prev => ({
        ...prev,
        pacienteId: dados.id || p.id,
        nomePaciente: (dados.nome || dados.nomeBusca || dados.nomePaciente).toLowerCase(), 
        dataNascimento: dados.dataNascimento,
        sexo: dados.sexo || prev.sexo,
        turma: dados.turma || prev.turma,
        cargo: dados.cargo || prev.cargo,
        etnia: dados.etnia || prev.etnia,
        peso: dados.peso || '',
        altura: dados.altura || '',
        imc: dados.imc || '',
        alunoPossuiAlergia: dados.alunoPossuiAlergia || 'não',
        qualAlergia: dados.qualAlergia || '',
        observacoes: dados.contatos?.[0]?.nome 
          ? `responsável: ${dados.contatos[0].nome} | tel: ${dados.contatos[0].telefone}` 
          : prev.observacoes
      }));
      setTemCadastro(true);
      toast.success("perfil integrado!", { id: toastId });
    } else {
      toast.error("erro ao cruzar dados.", { id: toastId });
    }
  };

  const salvarAtendimento = async (e) => {
    if (e) e.preventDefault();
    if (!validarNomeCompleto(formData.nomePaciente)) {
      toast.error("digite o nome e o sobrenome!");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("finalizando...");

    try {
      const batch = writeBatch(db);
      const horaSaida = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Normalização Final
      const payload = JSON.parse(JSON.stringify(formData), (key, value) => 
        typeof value === 'string' ? value.toLowerCase().trim() : value
      );

      // Conversão de tipos para o Firebase (Números como Numbers)
      const numericData = {
        ...payload,
        idade: parseInt(payload.idade) || 0,
        peso: parseFloat(payload.peso) || 0,
        altura: parseFloat(payload.altura) || 0,
        imc: parseFloat(payload.imc) || 0,
        temperatura: parseFloat(payload.temperatura) || 0
      };

      const nomeParaId = payload.nomePaciente
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, '-');
      
      const dataParaId = payload.dataNascimento ? payload.dataNascimento.replace(/-/g, '') : 'nd';
      const idPasta = payload.pacienteId || `${nomeParaId}-${dataParaId}`;

      const finalData = {
        ...numericData,
        pacienteId: idPasta,
        horarioSaida: horaSaida,
        escola: (user?.escolaId || "unidade escolar").toLowerCase(),
        profissional: (user?.nome || "profissional").toLowerCase(),
        createdAt: serverTimestamp()
      };

      // 1. Histórico
      const atendimentoRef = doc(collection(db, "atendimentos_enfermagem"));
      batch.set(atendimentoRef, finalData);

      // 2. Pasta Digital (Cérebro)
      batch.set(doc(db, "pastas_digitais", idPasta), {
        nomeBusca: finalData.nomePaciente,
        dataNascimento: finalData.dataNascimento,
        peso: finalData.peso,
        altura: finalData.altura,
        imc: finalData.imc,
        alunoPossuiAlergia: finalData.alunoPossuiAlergia,
        qualAlergia: finalData.qualAlergia,
        sexo: finalData.sexo,
        turma: finalData.turma,
        ultimaAtualizacao: serverTimestamp()
      }, { merge: true });

      // 3. Alunos
      batch.set(doc(db, "alunos", idPasta), {
        nome: finalData.nomePaciente,
        dataNascimento: finalData.dataNascimento,
        turma: finalData.turma,
        sexo: finalData.sexo,
        ultimaPresenca: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      toast.success("atendimento salvo!", { id: toastId });
      
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