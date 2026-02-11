import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, serverTimestamp, doc, getDoc, getDocs, 
  query, where, writeBatch, orderBy, limit 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export const useFormCadastroAluno = (props) => {
  const { onVoltar, dadosEdicao, alunoParaEditar, modoPastaDigital, onClose, onSucesso } = props;
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);

  // LÓGICA R S: Normalização para minúsculas
  const paraBanco = (txt) => txt ? String(txt).toLowerCase().trim() : "";

  const aplicarMascaraTelefone = (valor) => {
    if (!valor) return "";
    const n = valor.replace(/\D/g, "");
    if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const defaultValues = {
    nome: '', nomeMae: '', nomePai: '', semPaiDeclarado: false,
    matriculaInteligente: '', cartaoSus: '', naoSabeEtnia: false,
    naoSabePeso: false, naoSabeAltura: false, naoSabeEndereco: false,
    sexo: '', estaGestante: 'não', semanasGestacao: '',
    dataNascimento: '', idade: '', turma: '', etnia: '',
    peso: '', altura: '', isPCD: 'não', tipoDeficiencia: '',
    categoriasPCD: [], detalheTEA: '', detalheTDAH: '',
    detalheIntelectual: '', detalheFisico: 'andante sem auxílio', 
    outrosDiagnosticos: '', numeroCid: '', tomaMedicao: 'não',
    detalhesMedicao: '', contato1_nome: '', contato1_parentesco: 'mãe',
    contato1_telefone: '', contato2_nome: '', contato2_parentesco: 'pai',
    contato2_telefone: '', temAlergia: 'não', historicoMedico: '',
    observacoesAlergia: '', endereco_rua: '', endereco_cep: '', endereco_bairro: ''
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm({
    mode: "onChange", 
    defaultValues
  });

  // Observadores para lógica de interface
  const watchers = {
    dataNasc: watch("dataNascimento"),
    nome: watch("nome"),
    sexo: watch("sexo"),
    estaGestante: watch("estaGestante"),
    isPCD: watch("isPCD"),
    categoriasPCD: watch("categoriasPCD") || [],
    tomaMedicao: watch("tomaMedicao"),
    temAlergia: watch("temAlergia"),
    cep: watch("endereco_cep"),
    detalheFisico: watch("detalheFisico"),
    semPai: watch("semPaiDeclarado")
  };

  // 1. Cálculo de Idade
  useEffect(() => {
    if (watchers.dataNasc) {
      const hoje = new Date();
      const nasc = new Date(watchers.dataNasc);
      let idadeCalculada = hoje.getFullYear() - nasc.getFullYear();
      if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) idadeCalculada--;
      setValue("idade", idadeCalculada >= 0 ? idadeCalculada : "");
    }
  }, [watchers.dataNasc, setValue]);

  // 2. Busca de CEP
  useEffect(() => {
    const cepLimpo = watchers.cep?.replace(/\D/g, "");
    if (cepLimpo?.length === 8) {
      const buscarCep = async () => {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
          const data = await res.json();
          if (!data.erro) {
            setValue("endereco_rua", paraBanco(data.logradouro));
            setValue("endereco_bairro", paraBanco(`${data.bairro} - ${data.localidade}/${data.uf}`));
            toast.success("endereço localizado!");
          }
        } catch (e) { console.error("Erro CEP"); }
      };
      buscarCep();
    }
  }, [watchers.cep, setValue]);

  // 3. Carregar Sugestões de nomes
  useEffect(() => {
    const carregarNomes = async () => {
      try {
        const snap = await getDocs(query(collection(db, "alunos"), limit(50)));
        const nomes = snap.docs.map(doc => doc.data().nome).filter(Boolean);
        setSugestoes([...new Set(nomes)]);
      } catch (e) { console.error(e); }
    };
    carregarNomes();
  }, []);

  // 4. Efeito de Edição (Dados Iniciais)
  useEffect(() => {
    const dados = alunoParaEditar || dadosEdicao;
    if (dados) {
      reset({
        ...dados,
        contato1_telefone: aplicarMascaraTelefone(dados.contato1_telefone || ""),
        contato2_telefone: aplicarMascaraTelefone(dados.contato2_telefone || ""),
        categoriasPCD: Array.isArray(dados.categoriasPCD) ? dados.categoriasPCD : [],
      });
    }
  }, [alunoParaEditar, dadosEdicao, reset]);

  // 5. Busca Cruzada (Sincronização)
  const buscarAluno = async () => {
    const nomeBusca = paraBanco(watchers.nome);
    if (nomeBusca.length < 3) return toast.error("digite ao menos 3 letras");

    setBuscando(true);
    const toastId = toast.loading("sincronizando...");
    try {
      let pacienteId = null;
      const qPasta = query(collection(db, "pastas_digitais"), where("nomeBusca", "==", nomeBusca), limit(1));
      const snapId = await getDocs(qPasta);
      
      if (!snapId.empty) pacienteId = snapId.docs[0].id;

      if (!pacienteId) {
        toast.error("não localizado", { id: toastId });
        return;
      }

      const [snapQuest, snapPasta, snapAlu] = await Promise.all([
        getDoc(doc(db, "questionarios_saude", pacienteId)),
        getDoc(doc(db, "pastas_digitais", pacienteId)),
        getDoc(doc(db, "alunos", pacienteId))
      ]);

      const dQuest = snapQuest.exists() ? snapQuest.data() : {};
      const dPasta = snapPasta.exists() ? snapPasta.data() : {};
      const dAlu = snapAlu.exists() ? snapAlu.data() : {};

      reset({
        ...defaultValues, ...dAlu, ...dQuest, ...dPasta,
        pacienteId: pacienteId,
        contato1_telefone: aplicarMascaraTelefone(dPasta.contato1_telefone || ""),
        contato2_telefone: aplicarMascaraTelefone(dPasta.contato2_telefone || ""),
      });
      toast.success("sincronizado!", { id: toastId });
    } catch (e) { toast.error("erro na busca", { id: toastId }); }
    finally { setBuscando(false); }
  };

  // 6. Envio do Formulário
  const onSubmit = async (data) => {
    const nomeNormalizado = paraBanco(data.nome);
    const dataNascLimpa = data.dataNascimento ? data.dataNascimento.replace(/-/g, '') : 'sem-data';
    const idGerado = data.pacienteId || `${nomeNormalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${dataNascLimpa}`;
    
    // Normalização em massa para minúsculas (R S padrão)
    const payload = { 
      ...data, 
      nome: nomeNormalizado, 
      nomeBusca: nomeNormalizado,
      nomeMae: paraBanco(data.nomeMae),
      nomePai: paraBanco(data.nomePai),
      matriculaInteligente: paraBanco(data.matriculaInteligente),
      cartaoSus: paraBanco(data.cartaoSus),
      contato1_nome: paraBanco(data.contato1_nome),
      contato1_telefone: data.contato1_telefone.replace(/\D/g, ""),
      contato2_nome: paraBanco(data.contato2_nome),
      contato2_telefone: data.contato2_telefone.replace(/\D/g, ""),
      endereco_rua: paraBanco(data.endereco_rua),
      endereco_bairro: paraBanco(data.endereco_bairro),
      updatedAt: serverTimestamp()
    };
    
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, "pastas_digitais", idGerado), payload, { merge: true });
      batch.set(doc(db, "alunos", idGerado), { ...payload, createdAt: serverTimestamp() }, { merge: true });
      
      await batch.commit();
      toast.success("salvo com sucesso!");
      
      if (onSucesso) onSucesso();
      if (modoPastaDigital) {
        onClose ? onClose() : onVoltar();
      } else {
        reset(defaultValues);
      }
    } catch (e) { 
      toast.error("erro ao salvar");
      console.error(e);
    }
  };

  return {
    register, handleSubmit: handleSubmit(onSubmit), reset, setValue, watchers,
    errors, isSubmitting, buscando, buscarAluno, aplicarMascaraTelefone, 
    sugestoes, defaultValues, paraBanco
  };
};