import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  doc, getDoc, serverTimestamp, collection, 
  query, orderBy, getDocs, limit, startAt, endAt, writeBatch 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export const useQuestionarioSaude = (onSucesso) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [buscandoNome, setBuscandoNome] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const campoBuscaRef = useRef(null);

  // --- LÓGICA DE FORMATAÇÃO VISUAL "R S" ---
  const formatarNomeRS = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  // Normalização padrão para o banco (sempre minúsculo)
  const normalizeParaBanco = (val) => {
    if (typeof val !== 'string') return val;
    return val.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const estadoInicial = useMemo(() => ({
    alunoNome: '',
    dataNascimento: '',
    turma: '',
    peso: '',
    altura: '',
    historicoDoencas: { possui: 'não', detalhes: '' },
    alergias: { possui: 'não', detalhes: '' },
    medicacaoContinua: { possui: 'não', detalhes: '' },
    cirurgias: { possui: 'não', detalhes: '' },
    diabetes: { possui: 'não', tipo: '' }, 
    asma: { possui: 'não', detalhes: '' },
    doencasCardiacas: { possui: 'não', detalhes: '' },
    epilepsia: { possui: 'não' },
    desmaioConvulsao: 'não',
    problemaColuna: { possui: 'não', detalhes: '' },
    restricoesAlimentares: { possui: 'não', detalhes: '' },
    necessidadesEspeciais: { possui: 'não', detalhes: '' },
    diagnosticoNeuro: { possui: 'não', detalhes: '' }, 
    atrasoDesenvolvimento: { possui: 'não', detalhes: '' },
    atrasoCrescimento: { possui: 'não', detalhes: '' },
    tratamentoEspecializado: { 
      possui: 'não', psicologo: false, fonoaudiologo: false, terapiaOcupacional: false, outro: '' 
    },
    vacinaStatus: '', 
    carteiraVacina: 'não',
    vacinaAtualizada: 'não',
    dentistaUltimaConsulta: '', 
    tipoParto: '', 
    viverCom: '', 
    dificuldades: {
      enxergar: false, falar: false, ouvir: false, andar: false, movimentarMembros: false
    },
    caminharDificuldade: 'não',
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
      const [questSnap, pastaSnap, alunoSnap] = await Promise.all([
        getDoc(doc(db, "questionarios_saude", paciente.id)),
        getDoc(doc(db, "pastas_digitais", paciente.id)),
        getDoc(doc(db, "alunos", paciente.id))
      ]);

      const dQuest = questSnap.exists() ? questSnap.data() : {};
      const dPasta = pastaSnap.exists() ? pastaSnap.data() : {};
      const dAlu = alunoSnap.exists() ? alunoSnap.data() : {};

      setFormData(prev => ({
        ...estadoInicial,
        ...dQuest,
        pacienteId: paciente.id,
        alunoNome: formatarNomeRS(dQuest.alunoNome || dPasta.nomeBusca || dAlu.nome || paciente.nome || ''),
        dataNascimento: dQuest.dataNascimento || dPasta.dataNascimento || dAlu.dataNascimento || '',
        turma: dQuest.turma || dPasta.turma || dAlu.turma || '',
        peso: dQuest.peso || dPasta.peso || '',
        altura: dQuest.altura || dPasta.altura || '',
        
        alergias: {
          possui: dQuest.alergias?.possui || dPasta.alunoPossuiAlergia || 'não',
          detalhes: dQuest.alergias?.detalhes || dPasta.qualAlergia || ''
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
    const finalValue = path === 'alunoNome' ? formatarNomeRS(value) : value;
    
    setFormData(prev => {
      if (keys.length > 1) {
        return { ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: finalValue ?? '' } };
      }
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

      // --- TUDO VIRA LOWERCASE PARA O BANCO ---
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
        lastHealthUpdate: serverTimestamp()
      };

      // 1. Salva na coleção Questionários
      batch.set(doc(db, "questionarios_saude", formData.pacienteId), payload, { merge: true });

      // 2. Atualiza Pasta Digital (Adicionadas flags de status para visualização)
      batch.set(doc(db, "pastas_digitais", formData.pacienteId), {
        nomeBusca: payload.alunoNome, 
        alertaSaude: resumoSaude,
        alunoPossuiAlergia: payload.alergias.possui,
        qualAlergia: payload.alergias.detalhes || 'nenhuma informada',
        peso: payload.peso,
        altura: payload.altura,
        
        // --- BLOCO DE STATUS PARA A PASTA DIGITAL ---
        temQuestionarioSaude: true,
        questionarioSaude: true,
        statusSaude: 'preenchido',
        questionarioSaudeStatus: 'concluido',
        dataQuestionarioSaude: serverTimestamp(),
        
        ultimaAtualizacao: serverTimestamp()
      }, { merge: true });

      // 3. Atualiza Base de Alunos
      batch.set(doc(db, "alunos", formData.pacienteId), {
        nome: payload.alunoNome,
        dataNascimento: payload.dataNascimento,
        turma: payload.turma,
        responsavel: payload.contatos[0].nome,
        contato: payload.contatos[0].telefone,
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
    buscarSugestoes, selecionarPaciente, handleSubmit, setFormData
  };
};