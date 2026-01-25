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
    tipoAtendimento: 'local', // 'local' ou 'remocao'
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

  useEffect(() => {
    if (formData.nomePaciente.length > 2) {
      buscarSugestoes(formData.nomePaciente.toLowerCase());
    }
  }, [formData.nomePaciente, buscarSugestoes]);

  const updateField = useCallback((campo, valor) => {
    setFormData(prev => {
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
    const toastId = toast.loading("sincronizando dados...");
    
    const nomeLimpo = (p.nome || p.nomeBusca || p.nomePaciente || "").toLowerCase();
    const dataNasc = p.dataNascimento || "";

    const nomeParaId = nomeLimpo.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, '-');
    const dataParaId = dataNasc ? dataNasc.replace(/-/g, '') : 'nd';
    const idSugerido = p.id || p.pacienteId || `${nomeParaId}-${dataParaId}`;

    let dados = await puxarDadosCompletos(nomeLimpo, dataNasc);

    if (!dados) {
      try {
        const docRef = doc(db, "pastas_digitais", idSugerido);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          dados = { id: docSnap.id, ...docSnap.data() };
        }
      } catch (err) {
        console.error("Erro na busca direta:", err);
      }
    }

    if (dados) {
      const pesoStr = dados.peso ? String(dados.peso).replace('.', ',') : "";
      const alturaStr = dados.altura ? String(dados.altura).replace('.', ',') : "";
      const imcStr = dados.imc ? String(dados.imc).replace('.', ',') : "";
      const tempStr = dados.temperatura ? String(dados.temperatura).replace('.', ',') : "";

      setFormData(prev => ({
        ...prev,
        pacienteId: dados.id || idSugerido,
        nomePaciente: (dados.nomeBusca || dados.nome || nomeLimpo).toLowerCase(), 
        dataNascimento: dados.dataNascimento || dataNasc,
        sexo: (dados.sexo || prev.sexo || "").toLowerCase(),
        turma: (dados.turma || prev.turma || "").toLowerCase(),
        cargo: (dados.cargo || prev.cargo || "").toLowerCase(),
        etnia: (dados.etnia || prev.etnia || "").toLowerCase(),
        peso: pesoStr,
        altura: alturaStr,
        imc: imcStr,
        temperatura: tempStr,
        alunoPossuiAlergia: (dados.alunoPossuiAlergia || 'não').toLowerCase(),
        qualAlergia: (dados.qualAlergia || '').toLowerCase(),
        observacoes: (dados.observacoes || "").toLowerCase()
      }));

      setConfigUI(prev => ({ ...prev, naoSabePeso: !pesoStr, naoSabeAltura: !alturaStr }));
      setTemCadastro(true);
      toast.success("perfil sincronizado!", { id: toastId });
    } else {
      setFormData(prev => ({ ...prev, nomePaciente: nomeLimpo, dataNascimento: dataNasc, pacienteId: idSugerido }));
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

      // Determina status com base no tipo de atendimento da UI
      const statusAtendimento = configUI.tipoAtendimento === 'local' ? 'finalizado' : 'pendente';
      const tipoRegistro = configUI.tipoAtendimento === 'remocao' ? 'remoção' : 'local';

      // Normalização recursiva para lowercase
      const payload = JSON.parse(JSON.stringify(formData), (key, value) => 
        typeof value === 'string' ? value.toLowerCase().trim() : value
      );

      const numericData = {
        ...payload,
        idade: parseInt(payload.idade) || 0,
        peso: parseFloat(String(payload.peso).replace(',', '.')) || 0,
        altura: parseFloat(String(payload.altura).replace(',', '.')) || 0,
        imc: parseFloat(String(payload.imc).replace(',', '.')) || 0,
        temperatura: parseFloat(String(payload.temperatura).replace(',', '.')) || 0
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
        statusAtendimento, // automático: finalizado ou pendente
        tipoRegistro,      // automático: local ou remoção
        perfilPaciente: configUI.perfilPaciente.toLowerCase(),
        escola: (user?.escolaId || "unidade").toLowerCase(),
        profissionalResponsavel: (user?.nome || "profissional").toLowerCase(),
        registroProfissional: (user?.registroProfissional || user?.coren || "n/a").toLowerCase(),
        createdAt: serverTimestamp()
      };

      // Salva o atendimento
      batch.set(doc(collection(db, "atendimentos_enfermagem")), finalData);

      // Atualiza a Pasta Digital com o último estado
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
        ultimaAtualizacao: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      
      const msgSucesso = statusAtendimento === 'finalizado' 
        ? "atendimento local finalizado!" 
        : "remoção registrada como pendente!";
        
      toast.success(msgSucesso, { id: toastId });
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