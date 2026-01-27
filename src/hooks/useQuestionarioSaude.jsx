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

  const estadoInicial = useMemo(() => ({
    alunoNome: '',
    dataNascimento: '',
    turma: '',
    etnia: '', // <-- ADICIONADO
    sexo: '',  // <-- ADICIONADO
    peso: '',
    altura: '',
    historicoDoencas: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    alergias: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    medicacaoContinua: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    cirurgias: { possui: 'não', detalhes: '' },
    diabetes: { possui: 'não', tipo: '' }, 
    asma: { possui: 'não', detalhes: '', motivo: '', qual: '' },
    doencasCardiacas: { possui: 'não', detalhes: '' },
    epilepsia: { possui: 'não' },
    desmaioConvulsao: 'não',
    problemaColuna: { possui: 'não', detalhes: '' },
    restricoesAlimentares: { possui: 'não', detalhes: '' },
    necessidadesEspeciais: { possui: 'não', detalhes: '' },
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

  const formatarTelefone = (valor) => {
    const tel = (valor || "").replace(/\D/g, "");
    if (tel.length <= 11) return tel.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
    return valor;
  };

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
      // Busca o último atendimento de enfermagem para pegar etnia/sexo/peso atualizados
      const qAtend = query(
        collection(db, "atendimentos_enfermagem"),
        where("pacienteId", "==", paciente.id),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const [questSnap, pastaSnap, alunoSnap, atendSnap] = await Promise.all([
        getDoc(doc(db, "questionarios_saude", paciente.id)),
        getDoc(doc(db, "pastas_digitais", paciente.id)),
        getDoc(doc(db, "alunos", paciente.id)),
        getDocs(qAtend)
      ]);

      const dQuest = questSnap.exists() ? questSnap.data() : {};
      const dPasta = pastaSnap.exists() ? pastaSnap.data() : {};
      const dAlu = alunoSnap.exists() ? alunoSnap.data() : {};
      const dAtend = !atendSnap.empty ? atendSnap.docs[0].data() : {};

      setFormData(prev => ({
        ...estadoInicial,
        ...dQuest,
        pacienteId: paciente.id,
        // Cruzamento de dados incluindo Atendimentos e Pasta Digital
        alunoNome: formatarNomeRS(dQuest.alunoNome || dAtend.nomePaciente || dPasta.nomeBusca || dAlu.nome || paciente.nome || ''),
        etnia: dQuest.etnia || dAtend.etnia || dPasta.etnia || '', // <-- BUSCA ETNIA
        sexo: dQuest.sexo || dAtend.sexo || dPasta.sexo || '',   // <-- BUSCA SEXO
        dataNascimento: dQuest.dataNascimento || dAtend.dataNascimento || dPasta.dataNascimento || dAlu.dataNascimento || '',
        turma: dQuest.turma || dAtend.turma || dPasta.turma || dAlu.turma || '',
        peso: dQuest.peso || dAtend.peso || dPasta.peso || '',
        altura: dQuest.altura || dAtend.altura || dPasta.altura || '',
        atestadoAtividadeFisica: dQuest.atestadoAtividadeFisica || dPasta.atestadoAtividadeFisica || 'pendente',
        
        pcdStatus: {
          possui: dQuest.pcdStatus?.possui || dAtend.isPCD === true ? 'sim' : (dPasta.pcdStatus?.possui || 'não'),
          detalhes: dQuest.pcdStatus?.detalhes || dQuest.pcdStatus?.qual || dPasta.pcdStatus?.detalhes || '',
          motivo: dQuest.pcdStatus?.motivo || dQuest.pcdStatus?.detalhes || '',
          qual: dQuest.pcdStatus?.qual || dQuest.pcdStatus?.detalhes || ''
        },
        
        alergias: {
          possui: dQuest.alergias?.possui || dAtend.alunoPossuiAlergia || dPasta.alunoPossuiAlergia || 'não',
          detalhes: dQuest.alergias?.detalhes || dAtend.qualAlergia || dPasta.qualAlergia || '',
          motivo: dQuest.alergias?.motivo || dQuest.alergias?.detalhes || '',
          qual: dQuest.alergias?.qual || dQuest.alergias?.detalhes || ''
        },
        
        contatos: dQuest.contatos || [
          { 
            nome: formatarNomeRS(dPasta.responsavel || dAlu.responsavel || ''), 
            telefone: formatarTelefone(dPasta.contato || dAlu.contato || '') 
          },
          { nome: '', telefone: '' }
        ]
      }));
      
      toast.success("perfil recuperado!", { id: toastId });
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.pacienteId) return toast.error("selecione um aluno primeiro.");
    
    setLoading(true);
    const toastId = toast.loading("sincronizando prontuário...");
    
    try {
      const batch = writeBatch(db);

      const payload = JSON.parse(JSON.stringify(formData), (key, value) => 
        typeof value === 'string' ? normalizeParaBanco(value) : value
      );

      payload.updatedAt = serverTimestamp();
      payload.statusFicha = 'concluída';

      const resumoSaude = {
        possuiAlergia: payload.alergias.possui,
        detalheAlergia: payload.alergias.detalhes,
        pesoAtual: payload.peso,
        alturaAtual: payload.altura,
        possuiDiabetes: payload.diabetes.possui,
        medicacaoContinua: payload.medicacaoContinua.detalhes,
        isPCD: payload.pcdStatus.possui === 'sim',
        atestadoFisico: payload.atestadoAtividadeFisica,
        lastHealthUpdate: serverTimestamp()
      };

      batch.set(doc(db, "questionarios_saude", formData.pacienteId), payload, { merge: true });

      batch.set(doc(db, "pastas_digitais", formData.pacienteId), {
        nomeBusca: payload.alunoNome, 
        etnia: payload.etnia, // Salva na pasta para facilitar futuros acessos
        sexo: payload.sexo,
        alertaSaude: resumoSaude,
        alunoPossuiAlergia: payload.alergias.possui,
        qualAlergia: payload.alergias.detalhes || 'nenhuma informada',
        peso: payload.peso,
        altura: payload.altura,
        atestadoAtividadeFisica: payload.atestadoAtividadeFisica,
        pcdStatus: payload.pcdStatus,
        temQuestionarioSaude: true,
        statusSaude: 'preenchido',
        questionarioSaudeStatus: 'concluido',
        dataQuestionarioSaude: serverTimestamp(),
        ultimaAtualizacao: serverTimestamp()
      }, { merge: true });

      batch.set(doc(db, "alunos", formData.pacienteId), {
        nome: payload.alunoNome,
        etnia: payload.etnia,
        sexo: payload.sexo,
        dataNascimento: payload.dataNascimento,
        turma: payload.turma,
        responsavel: payload.contatos[0].nome,
        contato: payload.contatos[0].telefone,
        pcd: payload.pcdStatus.possui === 'sim',
        ultimaAtualizacao: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      toast.success("sincronizado com sucesso!", { id: toastId });
      if (onSucesso) onSucesso();
    } catch (error) { 
      console.error(error);
      toast.error("erro ao salvar prontuário.", { id: toastId }); 
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