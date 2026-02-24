import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { 
  serverTimestamp, doc, writeBatch, 
  query, collection, where, getDocs, limit 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export const useFormCadastroFuncionario = (dadosEdicao, modoPastaDigital, onSucesso, handleActionVoltar) => {
  const { user } = useAuth();
  const [mostrarEndereco, setMostrarEndereco] = useState(!!dadosEdicao?.endereco_cep);
  const [mostrarSegundoContato, setMostrarSegundoContato] = useState(!!dadosEdicao?.contato2);
  const [carregandoCep, setCarregandoCep] = useState(false);
  const [buscandoDados, setBuscandoDados] = useState(false);

  // 🛡️ TRAVA DE UNIDADE DINÂMICA (Prioriza LocalStorage para evitar cache de outras unidades)
  const escolaUsuarioId = (localStorage.getItem("escolaIdLogada") || user?.escolaId)?.toLowerCase().trim();
  const escolaNomeLogada = (localStorage.getItem("escolaNomeLogada") || user?.escola)?.toLowerCase().trim();
  const isRoot = user?.role?.toLowerCase() === 'root' || user?.email === "rodrigohono21@gmail.com";

  // ✅ Funções de Normalização (Padrão R S)
  const paraBanco = (val) => val ? String(val).toLowerCase().trim().replace(/\s+/g, ' ') : "";
  const paraBusca = (val) => val ? val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
  
  const paraExibicao = useCallback((val) => {
    if (!val) return "";
    return val.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  }, []);

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm({
    mode: "onChange",
    defaultValues: dadosEdicao || {
      nome: '', naoSabeSus: false, naoSabeEtnia: false, naoSabePeso: false, naoSabeAltura: false,
      cartaoSus: '', sexo: '', dataNascimento: '', idade: '', cargo: '', etnia: '', peso: '', altura: '',
      nomeContato1: '', contato: '', nomeContato2: '', contato2: '', temAlergia: 'não', historicoMedico: '',
      endereco_rua: '', endereco_cep: '', endereco_bairro: '',
      escolaId: escolaUsuarioId,
      escola: escolaNomeLogada
    }
  });

  const watchValues = watch();

  // 🚀 SINCRONIZAÇÃO DE UNIDADE (Força a escola correta se mudar no sistema)
  useEffect(() => {
    if (!dadosEdicao) {
      setValue("escolaId", escolaUsuarioId);
      setValue("escola", escolaNomeLogada);
    }
  }, [escolaUsuarioId, escolaNomeLogada, setValue, dadosEdicao]);

  // --- BUSCA AUTOMÁTICA DE STAFF ---
  useEffect(() => {
    const buscarExistente = async () => {
      const nomeLimpo = paraBusca(watchValues.nome);
      // Busca apenas se tiver nome e sobrenome
      if (nomeLimpo.split(/\s+/).length >= 2 && !modoPastaDigital && escolaUsuarioId) {
        setBuscandoDados(true);
        try {
          const ref = collection(db, "funcionarios");
          const q = isRoot 
            ? query(ref, where("nomeBusca", "==", nomeLimpo), limit(1))
            : query(ref, where("nomeBusca", "==", nomeLimpo), where("escolaId", "==", escolaUsuarioId), limit(1));

          const snap = await getDocs(q);
          if (!snap.empty) {
            const d = snap.docs[0].data();
            toast.success("Staff localizado!", { icon: '👤' });
            
            // Preenchimento automático dos dados encontrados
            Object.keys(d).forEach(key => {
              if (key === 'nome') setValue('nome', paraExibicao(d[key]));
              else if (['cargo', 'sexo', 'etnia'].includes(key)) setValue(key, d[key]?.toLowerCase());
              else if (key !== 'updatedAt' && key !== 'createdAt') setValue(key, d[key]);
            });
            if (d.endereco_cep) setMostrarEndereco(true);
            if (d.contato2) setMostrarSegundoContato(true);
          }
        } catch (e) { console.error(e); } finally { setBuscandoDados(false); }
      }
    };
    const timer = setTimeout(buscarExistente, 1000);
    return () => clearTimeout(timer);
  }, [watchValues.nome, escolaUsuarioId, isRoot, modoPastaDigital, setValue, paraExibicao]);

  // --- LÓGICA DE CEP ---
  useEffect(() => {
    const cep = watchValues.endereco_cep?.replace(/\D/g, '');
    if (cep?.length === 8) {
      setCarregandoCep(true);
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setValue("endereco_rua", paraExibicao(data.logradouro));
            setValue("endereco_bairro", paraExibicao(`${data.bairro} - ${data.localidade}/${data.uf}`));
            setMostrarEndereco(true);
            toast.success("Endereço localizado!");
          }
        }).finally(() => setCarregandoCep(false));
    }
  }, [watchValues.endereco_cep, setValue, paraExibicao]);

  // --- ✅ LÓGICA DE IDADE (PRECISÃO R S) ---
  useEffect(() => {
    if (watchValues.dataNascimento && watchValues.dataNascimento.length === 10) {
      const hoje = new Date();
      const partes = watchValues.dataNascimento.split('-');
      const nasc = new Date(partes[0], partes[1] - 1, partes[2]);

      if (!isNaN(nasc.getTime())) {
        let novaIdade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) novaIdade--;
        
        const idadeFinal = novaIdade >= 0 ? String(novaIdade) : "";
        
        if (String(watchValues.idade) !== idadeFinal) {
          setValue("idade", idadeFinal);
        }
      }
    }
  }, [watchValues.dataNascimento, watchValues.idade, setValue]);

  // --- SUBMIT (SALVAMENTO PADRONIZADO) ---
  const onSubmit = async (data) => {
    const escolaFinal = (localStorage.getItem("escolaIdLogada") || escolaUsuarioId);
    const nomeEscolaFinal = (localStorage.getItem("escolaNomeLogada") || escolaNomeLogada);
    
    if (!escolaFinal) {
      toast.error("Unidade não identificada. Saia e entre novamente.");
      return;
    }
    
    try {
      const nomeParaBusca = paraBusca(data.nome);
      const dataNascLimpa = data.dataNascimento?.replace(/-/g, '') || 'nd';
      
      // Gera ID com prefixo da escola atual para evitar duplicados entre unidades
      const idPasta = data.pacienteId || `${escolaFinal}-${nomeParaBusca.replace(/\s+/g, '-')}-${dataNascLimpa}`;

      const payload = {
        ...data,
        nome: paraBanco(data.nome),
        nomeBusca: nomeParaBusca,
        pacienteId: idPasta,
        escolaId: escolaFinal,
        escola: nomeEscolaFinal,
        perfil: 'funcionario',
        tipoPerfil: 'funcionario',
        // Normalização de campos sensíveis
        cargo: paraBanco(data.cargo),
        etnia: paraBanco(data.etnia),
        historicoMedico: paraBanco(data.historicoMedico),
        updatedAt: serverTimestamp(),
        createdAt: data.createdAt || serverTimestamp()
      };

      const batch = writeBatch(db);
      // Salva em Pastas Digitais e na coleção específica de Funcionários
      batch.set(doc(db, "pastas_digitais", idPasta), payload, { merge: true });
      batch.set(doc(db, "funcionarios", idPasta), payload, { merge: true });
      
      await batch.commit();
      toast.success(`Staff salvo no ${escolaFinal.toUpperCase()}`);

      if (modoPastaDigital) {
        handleActionVoltar();
      } else {
        reset();
        setMostrarEndereco(false);
        setMostrarSegundoContato(false);
      }
      if (onSucesso) onSucesso();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar dados.');
    }
  };

  return {
    register, 
    handleSubmit: handleSubmit(onSubmit),
    errors, 
    isSubmitting, 
    setValue,
    watchValues, 
    mostrarEndereco, 
    setMostrarEndereco, 
    mostrarSegundoContato, 
    setMostrarSegundoContato,
    carregandoCep, 
    buscandoDados, 
    paraExibicao
  };
};