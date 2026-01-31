import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  doc, getDoc, serverTimestamp, collection, 
  query, orderBy, getDocs, limit, startAt, endAt, writeBatch, where 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export const useQuestionarioSaude = (onSucesso) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [buscandoNome, setBuscandoNome] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const campoBuscaRef = useRef(null);

  const formatarNomeRS = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const normalizeParaBanco = (val) => {
    if (typeof val !== 'string') return val;
    return val.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const formatarTelefone = (valor) => {
    const tel = (valor || "").replace(/\D/g, "").slice(0, 11);
    if (tel.length > 10) {
      return tel.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (tel.length > 6) {
      return tel.replace(/^(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else if (tel.length > 2) {
      return tel.replace(/^(\d{2})(\d)/, "($1) $2");
    } else if (tel.length > 0) {
      return tel.replace(/^(\d)/, "($1");
    }
    return tel;
  };

  const estadoInicial = useMemo(() => ({
    tipoEntidade: 'aluno', // 'aluno' ou 'funcionario'
    alunoNome: '',
    dataNascimento: '',
    turma: '',
    cargo: '', 
    setor: '',
    etnia: '',
    sexo: '',
    peso: '',
    altura: '',
    historicoDoencas: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    alergias: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    medicacaoContinua: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    cirurgias: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    diabetes: { possui: 'não', tipo: '' }, 
    asma: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    doencasCardiacas: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    epilepsia: { possui: 'não' },
    desmaioConvulsao: 'não',
    problemaColuna: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    restricoesAlimentares: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    necessidadesEspeciais: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    pcdStatus: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    diagnosticoNeuro: { possui: 'não', detalhes: '', motivo: '', qual: '' }, 
    atrasoDesenvolvimento: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    atrasoCrescimento: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    tratamentoEspecializado: { 
      possui: 'não', psicologo: false, fonoaudiologo: false, terapiaOcupacional: false, outro: '' 
    },
    vacinaStatus: '', 
    atestadoAtividadeFisica: 'pendente',
    carteiraVacina: 'não',
    vacinaAtualizada: 'não',
    dentistaUltimaConsulta: '', 
    tipoParto: '', 
    viverCom: '', 
    dificuldades: {
      enxergar: false, falar: false, ouvir: false, andar: false, movimentarMembros: false
    },
    caminharDificuldade: 'não',
    problemaVisao: 'não',
    contatoEmergenciaPrioridade: '',
    contatos: [
      { nome: '', telefone: '' },
      { nome: '', telefone: '' }
    ],
    autorizacaoEmergencia: false,
    pacienteId: '',
  }), []);

  const [formData, setFormData] = useState(estadoInicial);

  useEffect(() => {
    const clickFora = (e) => {
      if (campoBuscaRef.current && !campoBuscaRef.current.contains(e.target)) setMostrarSugestoes(false);
    };
    document.addEventListener('mousedown', clickFora);
    return () => document.removeEventListener('mousedown', clickFora);
  }, []);

  const limparFormulario = () => {
    setFormData(estadoInicial);
    setSugestoes([]);
    setMostrarSugestoes(false);
    toast.success("formulário resetado");
  };

  const buscarSugestoes = async (valor) => {
    const termo = normalizeParaBanco(valor);
    if (termo.length < 3) { setSugestoes([]); setMostrarSugestoes(false); return; }
    setBuscandoNome(true);
    try {
      const q = query(
        collection(db, "pastas_digitais"), 
        orderBy("nomeBusca"), 
        startAt(termo), 
        endAt(termo + '\uf8ff'), 
        limit(6)
      );
      const snap = await getDocs(q);
      setSugestoes(snap.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          ...data,
          nomeExibicao: formatarNomeRS(data.nome || data.nomeBusca)
        };
      }));
      setMostrarSugestoes(true);
    } catch (error) { 
      console.error("Erro na busca:", error); 
    } finally { 
      setBuscandoNome(false); 
    }
  };

  const selecionarPaciente = async (paciente) => {
    setMostrarSugestoes(false);
    setFetching(true);
    const toastId = toast.loading("sincronizando dados...");
    
    try {
      const qAtend = query(
        collection(db, "atendimentos_enfermagem"),
        where("pacienteId", "==", paciente.id),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      // Inteligência: Tenta buscar também na coleção de funcionários
      const [questSnap, pastaSnap, alunoSnap, atendSnap, funcSnap] = await Promise.all([
        getDoc(doc(db, "questionarios_saude", paciente.id)),
        getDoc(doc(db, "pastas_digitais", paciente.id)),
        getDoc(doc(db, "alunos", paciente.id)),
        getDocs(qAtend),
        getDoc(doc(db, "funcionarios", paciente.id))
      ]);

      const dQuest = questSnap.exists() ? questSnap.data() : {};
      const dPasta = pastaSnap.exists() ? pastaSnap.data() : {};
      const dAlu = alunoSnap.exists() ? alunoSnap.data() : {};
      const dAtend = !atendSnap.empty ? atendSnap.docs[0].data() : {};
      const dFunc = funcSnap.exists() ? funcSnap.data() : {};

      // Inteligência: Identifica se é funcionário
      const ehFuncionario = funcSnap.exists() || dPasta.cargo || dPasta.tipo === 'funcionario';

      const mapHealthField = (field, fallbackPossui = 'não', fallbackDet = '') => ({
        possui: dQuest[field]?.possui || fallbackPossui,
        detalhes: dQuest[field]?.detalhes || dQuest[field]?.qual || dQuest[field]?.motivo || fallbackDet,
        motivo: dQuest[field]?.motivo || dQuest[field]?.detalhes || fallbackDet,
        qual: dQuest[field]?.qual || dQuest[field]?.detalhes || fallbackDet
      });

      setFormData(prev => ({
        ...estadoInicial,
        ...dQuest,
        pacienteId: paciente.id,
        tipoEntidade: ehFuncionario ? 'funcionario' : 'aluno',
        alunoNome: formatarNomeRS(dQuest.alunoNome || dAtend.nomePaciente || dPasta.nomeBusca || dAlu.nome || dFunc.nome || paciente.nome || ''),
        cargo: dFunc.cargo || dPasta.cargo || dQuest.cargo || '',
        setor: dFunc.setor || dPasta.setor || dQuest.setor || '',
        etnia: dQuest.etnia || dAtend.etnia || dPasta.etnia || dFunc.etnia || '',
        sexo: dQuest.sexo || dAtend.sexo || dPasta.sexo || dFunc.sexo || '',
        dataNascimento: dQuest.dataNascimento || dAtend.dataNascimento || dPasta.dataNascimento || dAlu.dataNascimento || dFunc.dataNascimento || '',
        turma: ehFuncionario ? 'funcionario' : (dQuest.turma || dAtend.turma || dPasta.turma || dAlu.turma || ''),
        peso: dQuest.peso || dAtend.peso || dPasta.peso || '',
        altura: dQuest.altura || dAtend.altura || dPasta.altura || '',
        atestadoAtividadeFisica: dQuest.atestadoAtividadeFisica || dPasta.atestadoAtividadeFisica || 'pendente',
        
        pcdStatus: mapHealthField('pcdStatus', (dAtend.isPCD === true ? 'sim' : (dPasta.pcdStatus?.possui || 'não')), dPasta.pcdStatus?.detalhes),
        alergias: mapHealthField('alergias', (dAtend.alunoPossuiAlergia || dPasta.alunoPossuiAlergia || 'não'), (dAtend.qualAlergia || dPasta.qualAlergia || '')),
        
        historicoDoencas: mapHealthField('historicoDoencas'),
        doencasCardiacas: mapHealthField('doencasCardiacas'),
        cirurgias: mapHealthField('cirurgias'),
        problemaColuna: mapHealthField('problemaColuna'),
        medicacaoContinua: mapHealthField('medicacaoContinua', 'não', dAtend.medicacaoEmUso || ''),

        contatos: dQuest.contatos || [
          { 
            nome: formatarNomeRS(ehFuncionario ? (dFunc.nome || dPasta.nomeBusca) : (dPasta.responsavel || dAlu.responsavel || '')), 
            telefone: formatarTelefone(ehFuncionario ? (dFunc.telefone || dPasta.contato) : (dPasta.contato || dAlu.contato || '')) 
          },
          { nome: '', telefone: '' }
        ]
      }));
      
      toast.success(ehFuncionario ? "perfil funcionário!" : "perfil aluno!", { id: toastId });
    } catch (error) { 
      console.error(error);
      toast.error("erro ao cruzar dados.", { id: toastId }); 
    } finally { 
      setFetching(false); 
    }
  };

  const handleChange = (path, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      if (keys.length > 1) {
        const rootKey = keys[0];
        const childKey = keys[1];
        const rootObj = prev[rootKey] || {};
        if (['detalhes', 'motivo', 'qual'].includes(childKey)) {
          return { 
            ...prev, 
            [rootKey]: { ...rootObj, detalhes: value, motivo: value, qual: value } 
          };
        }
        return { ...prev, [rootKey]: { ...rootObj, [childKey]: value } };
      }
      const finalValue = path === 'alunoNome' ? formatarNomeRS(value) : value;
      return { ...prev, [path]: finalValue ?? '' };
    });
  };

  const handleContactChange = (index, field, value) => {
    const novosContatos = [...formData.contatos];
    novosContatos[index][field] = field === 'nome' ? formatarNomeRS(value) : (field === 'telefone' ? formatarTelefone(value) : value);
    setFormData(prev => ({ ...prev, contatos: novosContatos }));
  };

  const handleDificuldadeToggle = (campo) => {
    setFormData(prev => ({
      ...prev,
      dificuldades: { ...prev.dificuldades, [campo]: !prev.dificuldades[campo] }
    }));
  };

  const validarCampos = () => {
    if (!formData.pacienteId) return "selecione uma pessoa primeiro.";
    if (!formData.alunoNome) return "o nome é obrigatório.";
    if (!formData.dataNascimento) return "data de nascimento é obrigatória.";
    
    // Inteligência: Só exige turma se for aluno
    if (formData.tipoEntidade === 'aluno' && !formData.turma) return "selecione a turma.";
    
    const tel = (formData.contatos[0].telefone || "").replace(/\D/g, "");
    if (tel.length < 10) return "o telefone principal deve ter no mínimo 10 dígitos.";
    
    return null;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const erro = validarCampos();
    if (erro) return toast.error(erro);
    
    setLoading(true);
    const toastId = toast.loading("sincronizando prontuário...");
    
    try {
      const batch = writeBatch(db);

      const payload = JSON.parse(JSON.stringify(formData), (key, value) => 
        typeof value === 'string' ? normalizeParaBanco(value) : value
      );

      payload.updatedAt = serverTimestamp();
      payload.statusFicha = 'concluída';

      batch.set(doc(db, "questionarios_saude", formData.pacienteId), payload, { merge: true });

      batch.set(doc(db, "pastas_digitais", formData.pacienteId), {
        nomeBusca: payload.alunoNome, 
        tipoEntidade: payload.tipoEntidade,
        temQuestionarioSaude: true,
        statusSaude: 'preenchido',
        ultimaAtualizacao: serverTimestamp()
      }, { merge: true });

      // Atualiza coleção de origem dependendo do tipo
      const colecaoDestino = formData.tipoEntidade === 'funcionario' ? "funcionarios" : "alunos";
      batch.set(doc(db, colecaoDestino, formData.pacienteId), {
        nome: payload.alunoNome,
        ultimaAtualizacao: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      toast.success("dados sincronizados!", { id: toastId });
      if (onSucesso) onSucesso();
    } catch (error) { 
      console.error(error);
      toast.error("erro ao salvar.", { id: toastId }); 
    } finally { 
      setLoading(false); 
    }
  };

  return {
    formData, loading, fetching, buscandoNome, sugestoes, mostrarSugestoes, campoBuscaRef,
    setMostrarSugestoes, handleChange, handleContactChange, handleDificuldadeToggle,
    buscarSugestoes, selecionarPaciente, handleSubmit, setFormData, limparFormulario
  };
};