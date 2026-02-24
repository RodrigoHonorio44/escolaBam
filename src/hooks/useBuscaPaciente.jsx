import { useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  collection, query, where, getDocs, limit, orderBy, doc, getDoc 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const useBuscaPaciente = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // 🛡️ TRAVA DE UNIDADE DINÂMICA (LocalStorage manda no sistema para evitar cache do CEPT)
  const escolaUsuarioId = (localStorage.getItem("escolaIdLogada") || user?.escolaId)?.toLowerCase().trim();
  const isRoot = user?.role?.toLowerCase() === 'root' || user?.email === "rodrigohono21@gmail.com";

  // --- FUNÇÃO AUXILIAR DE NORMALIZAÇÃO (PADRÃO R S) ---
  const paraBanco = (str) => {
    if (!str) return '';
    return str.toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const gerarIdMestre = (nome, dataNasc) => {
    if (!nome) return null;
    const nomeSlug = paraBanco(nome).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const dataRef = dataNasc ? dataNasc.replace(/-/g, '') : 'nd';
    
    // O ID Mestre agora é atrelado à unidade logada no sistema para evitar conflitos
    const prefixoEscola = escolaUsuarioId || 'global';
    return `${prefixoEscola}-${nomeSlug}-${dataRef}`;
  };

  // 🔒 HELPER DE QUERY SEGURA (Garante que uma escola não veja dados de outra)
  const querySegura = (colecao, campoBusca, termo) => {
    const ref = collection(db, colecao);
    const termoNormalizado = paraBanco(termo);

    if (isRoot) {
      return query(ref, where(campoBusca, "==", termoNormalizado), limit(1));
    }

    return query(
      ref, 
      where(campoBusca, "==", termoNormalizado), 
      where("escolaId", "==", escolaUsuarioId), 
      limit(1)
    );
  };

  const buscarAlunos = async (termo, idMestre = null) => {
    try {
      if (idMestre) {
        const d = await getDoc(doc(db, "alunos", idMestre));
        if (d.exists()) {
          const data = d.data();
          if (isRoot || (data.escolaId?.toLowerCase().trim() === escolaUsuarioId)) {
            return { id: d.id, ...data };
          }
          return null; 
        }
      }
      const q = querySegura("alunos", "nome", termo);
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  const buscarFuncionarios = async (termo, idMestre = null) => {
    try {
      if (idMestre) {
        const d = await getDoc(doc(db, "funcionarios", idMestre));
        if (d.exists()) {
          const data = d.data();
          if (isRoot || (data.escolaId?.toLowerCase().trim() === escolaUsuarioId)) {
            return { id: d.id, ...data };
          }
        }
      }
      const q = querySegura("funcionarios", "nome", termo);
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  const buscarPastasDigitais = async (termo, idMestre = null) => {
    try {
      if (idMestre) {
        const d = await getDoc(doc(db, "pastas_digitais", idMestre));
        if (d.exists()) {
          const data = d.data();
          if (isRoot || (data.escolaId?.toLowerCase().trim() === escolaUsuarioId)) {
            return { id: d.id, ...data };
          }
          return null;
        }
      }
      const q = querySegura("pastas_digitais", "nomeBusca", termo);
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  const buscarQuestionario = async (termo, idMestre = null) => {
    try {
      if (idMestre) {
        const d = await getDoc(doc(db, "questionarios_saude", idMestre));
        if (d.exists()) {
          const data = d.data();
          if (isRoot || (data.escolaId?.toLowerCase().trim() === escolaUsuarioId)) {
            return { id: d.id, ...data };
          }
          return null;
        }
      }
      const q = querySegura("questionarios_saude", "alunoNome", termo);
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
      const ref = collection(db, "atendimentos_enfermagem");
      const termoNormalizado = paraBanco(termo);
      let q;
      
      if (isRoot) {
        q = query(ref, where("nomePaciente", "==", termoNormalizado), orderBy("createdAt", "desc"), limit(15));
      } else {
        q = query(
          ref, 
          where("nomePaciente", "==", termoNormalizado), 
          where("escolaId", "==", escolaUsuarioId), 
          orderBy("createdAt", "desc"),
          limit(15)
        );
      }
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        dataAtendimento: doc.data().dataAtendimento || doc.data().data || "---"
      }));
    } catch (err) { return []; }
  };

  const buscarDadosCompletos = async (nomePesquisado, dataNascOpcional = null) => {
    if (!nomePesquisado) return null;
    setLoading(true);
    
    const termoBusca = paraBanco(nomePesquisado);
    const idMestre = gerarIdMestre(termoBusca, dataNascOpcional);

    try {
      // Busca paralela em todas as coleções respeitando a trava de escola
      const [aluno, funcionario, pasta, saude, atendimentos] = await Promise.all([
        buscarAlunos(termoBusca, idMestre),
        buscarFuncionarios(termoBusca, idMestre),
        buscarPastasDigitais(termoBusca, idMestre),
        buscarQuestionario(termoBusca, idMestre),
        buscarAtendimentos(termoBusca)
      ]);

      if (!aluno && !funcionario && !pasta && !saude && atendimentos.length === 0) {
        return null;
      }

      const perfilOriginal = pasta || aluno || funcionario;
      const nomeFinal = paraBanco(perfilOriginal?.nome || perfilOriginal?.nomeBusca || saude?.alunoNome || termoBusca);

      const perfilConsolidado = {
        ...perfilOriginal,
        id: idMestre || perfilOriginal?.id,
        nome: nomeFinal,
        turma: paraBanco(perfilOriginal?.turma || saude?.turma || (funcionario ? "staff" : "n/a")),
        dataNascimento: perfilOriginal?.dataNascimento || saude?.dataNascimento || dataNascOpcional || "",
        sexo: paraBanco(perfilOriginal?.sexo || saude?.sexo || ""),
        estaGestante: paraBanco(perfilOriginal?.estaGestante || "não"),
        semanasGestacao: perfilOriginal?.semanasGestacao || saude?.semanasGestacao || "",
        peso: perfilOriginal?.peso || saude?.peso || "",
        altura: perfilOriginal?.altura || saude?.altura || "",
        qualAlergia: paraBanco(perfilOriginal?.qualAlergia || saude?.alergias?.detalhes || perfilOriginal?.historicoMedico || ""),
        alunoPossuiAlergia: paraBanco(perfilOriginal?.alunoPossuiAlergia || saude?.alergias?.possui || perfilOriginal?.temAlergia || "não"),
        cartaoSus: perfilOriginal?.cartaoSus || saude?.cartaoSus || ""
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
          medicacaoContinua: paraBanco(saude?.medicacaoContinua?.possui || "não"),
          gestante: perfilConsolidado.estaGestante === 'sim'
        },
        dadosParaForm: {
          ...saude,
          ...perfilConsolidado,
          isEdicao: !!(perfilOriginal || saude),
          origem: 'pasta_digital'
        }
      };
    } catch (err) {
      console.error("Erro na busca consolidada:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { buscarDadosCompletos, loading, gerarIdMestre };
};