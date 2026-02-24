import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, serverTimestamp, doc, getDoc, getDocs, 
  query, where, writeBatch, limit 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export const useFormCadastroAluno = (props) => {
  const { onVoltar, dadosEdicao, alunoParaEditar, modoPastaDigital, onClose, onSucesso, usuarioLogado } = props;
  
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);

  // --- HELPERS R S ---
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

  const watchers = {
    dataNasc: watch("dataNascimento"),
    nome: watch("nome"),
    sexo: watch("sexo"),
    isPCD: watch("isPCD"),
    categoriasPCD: watch("categoriasPCD") || [],
    tomaMedicao: watch("tomaMedicao"),
    temAlergia: watch("temAlergia"),
    cep: watch("endereco_cep"),
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

  // 3. Carregar Sugestões
  useEffect(() => {
    const carregarNomes = async () => {
      const escolaId = (localStorage.getItem("escolaIdLogada") || usuarioLogado?.escolaId || usuarioLogado?.unidadeid)?.toLowerCase().trim();
      if (!escolaId) return;
      try {
        const q = query(
          collection(db, "pastas_digitais"), 
          where("escolaId", "==", escolaId),
          limit(50)
        );
        const snap = await getDocs(q);
        const nomes = snap.docs.map(doc => doc.data().nome || doc.data().nomeBusca).filter(Boolean);
        setSugestoes([...new Set(nomes)]);
      } catch (e) { console.error("Erro sugestões", e); }
    };
    carregarNomes();
  }, [usuarioLogado]);

  // 4. Efeito de Edição
  useEffect(() => {
    const dados = alunoParaEditar || dadosEdicao;
    if (dados) {
      reset({
        ...defaultValues,
        ...dados,
        contato1_telefone: aplicarMascaraTelefone(dados.contato1_telefone || ""),
        contato2_telefone: aplicarMascaraTelefone(dados.contato2_telefone || ""),
        categoriasPCD: Array.isArray(dados.categoriasPCD) ? dados.categoriasPCD : [],
      });
    }
  }, [alunoParaEditar, dadosEdicao, reset]);

  // 5. Busca Cruzada (LIBERADA PARA ENCONTRAR OS REGISTROS QUE VOCÊ MOSTROU)
  const buscarAluno = async () => {
    const nomeOriginal = watchers.nome;
    const nomeBusca = paraBanco(nomeOriginal);

    if (nomeBusca.length < 3) return toast.error("digite ao menos 3 letras");

    setBuscando(true);
    const toastId = toast.loading("sincronizando...");
    try {
      let pacienteId = null;
      let dadosEncontrados = null;

      // BUSCA GLOBAL: Como vimos que o escolaId varia, buscamos pelo nomeBusca em todo o banco
      const q = query(
        collection(db, "pastas_digitais"), 
        where("nomeBusca", "==", nomeBusca),
        limit(1)
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        pacienteId = snap.docs[0].id;
        dadosEncontrados = snap.docs[0].data();
      }

      if (!pacienteId) {
        toast.error("aluno não encontrado no sistema", { id: toastId });
        setBuscando(false);
        return;
      }

      // Sincroniza dados de todas as coleções
      const [snapQuest, snapAlu] = await Promise.all([
        getDoc(doc(db, "questionarios_saude", pacienteId)),
        getDoc(doc(db, "alunos", pacienteId))
      ]);

      const dQuest = snapQuest.exists() ? snapQuest.data() : {};
      const dAlu = snapAlu.exists() ? snapAlu.data() : {};
      const dPasta = dadosEncontrados;

      // Preenche o formulário com o merge de tudo (incluindo turma, sexo e escola do banco)
      reset({
        ...defaultValues, 
        ...dAlu, 
        ...dQuest, 
        ...dPasta,
        pacienteId: pacienteId,
        nome: dPasta.nome || dAlu.nome || nomeOriginal,
        contato1_telefone: aplicarMascaraTelefone(dPasta.contato1_telefone || dAlu.contato1_telefone || ""),
        contato2_telefone: aplicarMascaraTelefone(dPasta.contato2_telefone || dAlu.contato2_telefone || ""),
      });
      
      toast.success("perfil localizado!", { id: toastId });
    } catch (e) { 
      console.error(e);
      toast.error("erro ao conectar ao banco", { id: toastId }); 
    } finally { 
      setBuscando(false); 
    }
  };

  // 6. Envio do Formulário (SALVA COM escolaId PARA MANTER PADRÃO)
  const onSubmit = async (data) => {
    const escolaIdAtiva = (
        localStorage.getItem("escolaIdLogada") || 
        usuarioLogado?.escolaId || 
        usuarioLogado?.unidadeid
    )?.toLowerCase().trim();
    
    if (!escolaIdAtiva) {
      return toast.error("erro: escola não identificada!");
    }

    const nomeNormalizado = paraBanco(data.nome);
    const dataNascLimpa = data.dataNascimento ? data.dataNascimento.replace(/-/g, '') : 'sem-data';
    
    // Se já tem pacienteId (veio da busca), mantém. Se não, gera novo padrão.
    const idGerado = data.pacienteId || `${escolaIdAtiva}-${nomeNormalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${dataNascLimpa}`;
    
    const payload = { 
      ...data, 
      nome: nomeNormalizado, 
      nomeBusca: nomeNormalizado,
      nomeMae: paraBanco(data.nomeMae),
      nomePai: paraBanco(data.nomePai),
      escolaId: escolaIdAtiva,
      unidadeid: escolaIdAtiva,
      unidade: paraBanco(usuarioLogado?.unidade || usuarioLogado?.escola),
      contato1_telefone: (data.contato1_telefone || "").replace(/\D/g, ""),
      contato2_telefone: (data.contato2_telefone || "").replace(/\D/g, ""),
      updatedAt: serverTimestamp()
    };
    
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, "pastas_digitais", idGerado), payload, { merge: true });
      batch.set(doc(db, "alunos", idGerado), { ...payload, createdAt: serverTimestamp() }, { merge: true });
      
      await batch.commit();
      toast.success("registro atualizado!");
      
      if (onSucesso) onSucesso();
      if (modoPastaDigital) {
        onClose ? onClose() : onVoltar();
      } else {
        reset(defaultValues);
      }
    } catch (e) { 
      toast.error("erro ao salvar");
    }
  };

  return {
    register, handleSubmit: handleSubmit(onSubmit), reset, setValue, watchers,
    errors, isSubmitting, buscando, buscarAluno, aplicarMascaraTelefone, 
    sugestoes, defaultValues, paraBanco
  };
};