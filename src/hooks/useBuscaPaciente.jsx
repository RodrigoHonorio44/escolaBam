import { useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, query, where, getDocs, limit, orderBy, doc, getDoc 
} from 'firebase/firestore';

export const useBuscaPaciente = () => {
  const [loading, setLoading] = useState(false);

  // --- FUNÇÃO AUXILIAR DE NORMALIZAÇÃO (PADRÃO CAIO GIROMBA) ---
  const paraBanco = (str) => {
    if (!str) return '';
    return str.toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const gerarIdMestre = (nome, dataNasc) => {
    if (!nome || !dataNasc) return null;
    const nomeSlug = paraBanco(nome).replace(/\s+/g, '-');
    const dataRef = dataNasc.replace(/-/g, '');
    return `${nomeSlug}-${dataRef}`;
  };

  const buscarAlunos = async (termo, idMestre = null) => {
    try {
      if (idMestre) {
        const d = await getDoc(doc(db, "alunos", idMestre));
        if (d.exists()) return { id: d.id, ...d.data() };
      }
      const q = query(collection(db, "alunos"), where("nome", "==", termo), limit(1));
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  const buscarFuncionarios = async (termo) => {
    try {
      const q = query(collection(db, "funcionarios"), where("nome", "==", termo), limit(1));
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  const buscarPastasDigitais = async (termo, idMestre = null) => {
    try {
      if (idMestre) {
        const d = await getDoc(doc(db, "pastas_digitais", idMestre));
        if (d.exists()) return { id: d.id, ...d.data() };
      }
      const q = query(collection(db, "pastas_digitais"), where("nomeBusca", "==", termo), limit(1));
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  const buscarQuestionario = async (termo, idMestre = null) => {
    try {
      if (idMestre) {
        const d = await getDoc(doc(db, "questionarios_saude", idMestre));
        if (d.exists()) return { id: d.id, ...d.data() };
      }
      const q = query(collection(db, "questionarios_saude"), where("alunoNome", "==", termo), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const data = snap.docs[0].data();
      return { 
        id: snap.docs[0].id, 
        ...data, 
        contatos: (data.contatos || [])
          .filter(c => c.nome?.trim())
          .map(c => ({ nome: paraBanco(c.nome), telefone: c.telefone }))
      };
    } catch (err) { return null; }
  };

  const buscarAtendimentos = async (termo) => {
    try {
      const q = query(
        collection(db, "atendimentos_enfermagem"), 
        where("nomePaciente", "==", termo), 
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        dataAtendimento: doc.data().dataAtendimento || doc.data().data || "---"
      }));
    } catch (err) { 
      console.error("Erro atendimentos:", err);
      return []; 
    }
  };

  const buscarDadosCompletos = async (nomePesquisado, dataNascOpcional = null) => {
    if (!nomePesquisado) return null;
    setLoading(true);
    
    const termoBusca = paraBanco(nomePesquisado);
    const idMestre = gerarIdMestre(termoBusca, dataNascOpcional);

    try {
      // Busca em paralelo usando ID Mestre (se houver) ou Termo
      const [aluno, funcionario, pasta, saude, atendimentos] = await Promise.all([
        buscarAlunos(termoBusca, idMestre),
        buscarFuncionarios(termoBusca),
        buscarPastasDigitais(termoBusca, idMestre),
        buscarQuestionario(termoBusca, idMestre),
        buscarAtendimentos(termoBusca)
      ]);

      const perfilOriginal = pasta || aluno || funcionario;
      
      const limparString = (val) => {
        if (!val) return "";
        const termoLimpo = paraBanco(val);
        const proibidos = ["nao informado", "---", "undefined", "null", "nao", "nenhum", "nenhuma"];
        return proibidos.includes(termoLimpo) ? "" : paraBanco(val);
      };

      const nomeFinal = paraBanco(perfilOriginal?.nome || perfilOriginal?.nomeBusca || saude?.alunoNome || termoBusca);

      // Consolidação Final Rigorosa (Sincronismo Circular)
      const perfilConsolidado = {
        ...perfilOriginal,
        id: idMestre || perfilOriginal?.id,
        nome: nomeFinal,
        turma: paraBanco(perfilOriginal?.turma || saude?.turma || (funcionario ? "staff" : "n/a")),
        dataNascimento: perfilOriginal?.dataNascimento || saude?.dataNascimento || dataNascOpcional || "",
        sexo: paraBanco(perfilOriginal?.sexo || saude?.sexo || ""),
        peso: perfilOriginal?.peso || saude?.peso || "",
        altura: perfilOriginal?.altura || saude?.altura || "",
        qualAlergia: paraBanco(perfilOriginal?.qualAlergia || saude?.alergias?.detalhes || ""),
        alunoPossuiAlergia: paraBanco(perfilOriginal?.alunoPossuiAlergia || saude?.alergias?.possui || "não"),
        cartaoSus: limparString(perfilOriginal?.cartaoSus || saude?.cartaoSus)
      };

      return {
        perfil: perfilConsolidado,
        saude: saude,
        atendimentos: atendimentos,
        isFuncionario: !!funcionario || perfilOriginal?.tipoPerfil === 'funcionario',
        nome: nomeFinal,
        
        statusClinico: {
          asma: paraBanco(saude?.asma?.possui || "não"),
          diabetes: paraBanco(saude?.diabetes?.possui || "não"),
          cardiaco: paraBanco(saude?.doencasCardiacas?.possui || "não"),
          epilepsia: paraBanco(saude?.epilepsia?.possui || "não"),
          medicacaoContinua: paraBanco(saude?.medicacaoContinua?.possui || "não")
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