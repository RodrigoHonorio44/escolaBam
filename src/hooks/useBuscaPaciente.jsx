import { useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

export const useBuscaPaciente = () => {
  const [loading, setLoading] = useState(false);

  const buscarAlunos = async (nomeUpper) => {
    try {
      const q = query(collection(db, "alunos"), where("nomeBusca", "==", nomeUpper.toUpperCase()), limit(1));
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  const buscarFuncionarios = async (nomeUpper) => {
    try {
      const q = query(collection(db, "funcionarios"), where("nomeBusca", "==", nomeUpper.toUpperCase()), limit(1));
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  const buscarPastasDigitais = async (nomeUpper) => {
    try {
      const q = query(collection(db, "pastas_digitais"), where("nomeBusca", "==", nomeUpper.toUpperCase()), limit(1));
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  const buscarQuestionario = async (nomeNormal) => {
    try {
      const q = query(collection(db, "questionarios_saude"), where("alunoNome", "==", nomeNormal), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const data = snap.docs[0].data();
      return { 
        id: snap.docs[0].id, 
        ...data, 
        contatos: (data.contatos || []).filter(c => c.nome?.trim()) 
      };
    } catch (err) { return null; }
  };

  const buscarAtendimentos = async (nomeUpper) => {
    try {
      const q = query(
        collection(db, "atendimentos_enfermagem"), 
        where("nomePacienteBusca", "==", nomeUpper.toUpperCase()), 
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        dataAtendimento: doc.data().dataAtendimento || doc.data().data || "---"
      }));
    } catch (err) { return []; }
  };

  const buscarDadosCompletos = async (nomePesquisado) => {
    if (!nomePesquisado) return null;
    setLoading(true);
    const nomeUpper = nomePesquisado.trim().toUpperCase();
    const nomeNormal = nomePesquisado.trim();

    try {
      const [aluno, funcionario, pasta, saude, atendimentos] = await Promise.all([
        buscarAlunos(nomeUpper),
        buscarFuncionarios(nomeUpper),
        buscarPastasDigitais(nomeUpper),
        buscarQuestionario(nomeNormal),
        buscarAtendimentos(nomeUpper)
      ]);

      // Consolida o perfil (Pasta Digital tem prioridade total)
      const perfilOriginal = pasta || aluno || funcionario;
      
      const limparString = (val) => {
        if (!val) return "";
        const proibidos = ["NÃO INFORMADO", "---", "UNDEFINED", "NULL", "NÃO"];
        return proibidos.includes(val.toString().toUpperCase()) ? "" : val;
      };

      const nomeFinal = perfilOriginal?.nome || saude?.alunoNome || nomeNormal;

      // Montamos um objeto perfil "blindado" para o componente não se perder
      const perfilConsolidado = {
        ...perfilOriginal,
        nome: nomeFinal,
        turma: perfilOriginal?.turma || perfilOriginal?.serie || (funcionario ? "STAFF" : "N/A"),
        dataNascimento: perfilOriginal?.dataNascimento || perfilOriginal?.nascimento || "",
        qualAlergia: perfilOriginal?.qualAlergia || perfilOriginal?.alergia || saude?.alergias?.detalhes || "",
        cartaoSus: limparString(perfilOriginal?.cartaoSus || saude?.cartaoSus)
      };

      return {
        perfil: perfilConsolidado, // Aqui agora tem TUDO (turma, nascimento, alergia)
        saude,
        atendimentos,
        isFuncionario: !!funcionario || perfilOriginal?.tipoPerfil === 'funcionario',
        nome: nomeFinal,
        
        statusClinico: {
          asma: saude?.asma?.possui || perfilOriginal?.possuiAsma || "Não",
          diabetes: saude?.diabetes?.possui || perfilOriginal?.possuiDiabetes || "Não",
          cardiaco: saude?.doencasCardiacas?.possui || "Não",
          epilepsia: saude?.epilepsia?.possui || "Não"
        },

        dadosParaForm: {
          ...saude,
          ...perfilConsolidado,
          isEdicao: !!(perfilOriginal || saude),
          origem: 'pasta_digital'
        }
      };
    } catch (err) {
      console.error("Erro na consolidação:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { buscarDadosCompletos, loading };
};