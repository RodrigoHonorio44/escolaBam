import { useState, useCallback } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  doc, getDoc, query, collection, where, getDocs, limit, orderBy, startAt, endAt
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const usePacienteSinc = () => {
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const { user } = useAuth();

  const escolaUsuarioId = (localStorage.getItem("escolaIdLogada") || user?.escolaId)?.toLowerCase().trim();
  const isRoot = user?.role?.toLowerCase() === 'root' || user?.email === "rodrigohono21@gmail.com";

  const gerarIdMestre = useCallback((nome, dataNasc) => {
    if (!nome || !escolaUsuarioId) return null;
    const nomeSlug = nome.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, '-');
    const dataRef = dataNasc ? dataNasc.replace(/-/g, '') : 'nd';
    return `${escolaUsuarioId}-${nomeSlug}-${dataRef}`;
  }, [escolaUsuarioId]);

  const buscarSugestoes = async (termo) => {
    const busca = termo.trim().toLowerCase();
    if (busca.length < 3 || !escolaUsuarioId) {
      setSugestoes([]);
      return;
    }
    try {
      // ✅ Adicionado "atendimentos_enfermagem" na busca de sugestões
      const colecoes = ["alunos", "pastas_digitais", "funcionarios", "atendimentos_enfermagem"];
      const buscas = colecoes.map(async (colNome) => {
        let campoBusca = "nome";
        if (colNome === "pastas_digitais") campoBusca = "nomeBusca";
        if (colNome === "atendimentos_enfermagem") campoBusca = "nomePaciente";
        
        const ref = collection(db, colNome);
        let q = isRoot 
          ? query(ref, orderBy(campoBusca), startAt(busca), endAt(busca + "\uf8ff"), limit(5))
          : query(ref, where("escolaId", "==", escolaUsuarioId), orderBy(campoBusca), startAt(busca), endAt(busca + "\uf8ff"), limit(5));
        
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
          id: d.id,
          nome: d.data()[campoBusca] || d.data().nome || d.data().nomePaciente,
          dataNascimento: d.data().dataNascimento || "",
          escolaId: d.data().escolaId,
          tipoPerfil: d.data().tipoPerfil || (colNome === "funcionarios" ? "funcionario" : "aluno"),
          ...d.data()
        }));
      });

      const retornoBuscas = await Promise.all(buscas);
      const unificados = retornoBuscas.flat().filter((valor, index, self) =>
        index === self.findIndex((t) => (
          t.nome?.toLowerCase() === valor.nome?.toLowerCase() && 
          t.dataNascimento === valor.dataNascimento
        ))
      );
      setSugestoes(unificados.slice(0, 8));
    } catch (error) { console.error("Erro na busca global:", error); }
  };

  const puxarDadosCompletos = useCallback(async (nome, dataNasc) => {
    const idMestre = gerarIdMestre(nome, dataNasc);
    if (!idMestre) return null;

    setBuscando(true);
    try {
      // ✅ Busca também o ÚLTIMO atendimento para pegar peso/altura se o aluno não tiver cadastro
      const qAtend = query(
        collection(db, "atendimentos_enfermagem"),
        where("pacienteId", "==", idMestre),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const [snapAluno, snapPasta, snapQuest, snapFunc, snapAtend] = await Promise.all([
        getDoc(doc(db, "alunos", idMestre)),
        getDoc(doc(db, "pastas_digitais", idMestre)),
        getDoc(doc(db, "questionarios_saude", idMestre)),
        getDoc(doc(db, "funcionarios", idMestre)),
        getDocs(qAtend)
      ]);

      const dAlu = snapAluno.exists() ? snapAluno.data() : {};
      const dPas = snapPasta.exists() ? snapPasta.data() : {};
      const dQue = snapQuest.exists() ? snapQuest.data() : {};
      const dFun = snapFunc.exists() ? snapFunc.data() : {};
      const dAtend = !snapAtend.empty ? snapAtend.docs[0].data() : {};

      const escolaDono = (dAlu.escolaId || dPas.escolaId || dQue.escolaId || dFun.escolaId || dAtend.escolaId)?.toLowerCase().trim();
      
      if (!isRoot && escolaDono && escolaDono !== escolaUsuarioId) {
        toast.error("ACESSO NEGADO: Este registro pertence a outra unidade.");
        return null;
      }

      const norm = (val) => (val ? String(val).toLowerCase().trim() : '');
      const numParaString = (val) => (val !== undefined && val !== null && val !== "" ? String(val) : '');

      const unificado = {
        id: idMestre,
        existe: snapAluno.exists() || snapPasta.exists() || snapQuest.exists() || snapFunc.exists() || !snapAtend.empty,
        nome: norm(dAlu.nome || dFun.nome || dAtend.nomePaciente || dQue.alunoNome || dPas.nomeBusca || nome),
        dataNascimento: dAlu.dataNascimento || dFun.dataNascimento || dAtend.dataNascimento || dQue.dataNascimento || dataNasc,
        sexo: norm(dAlu.sexo || dFun.sexo || dAtend.sexo || dQue.sexo || dPas.sexo),
        turma: norm(dAlu.turma || dAtend.turma || dQue.turma || dPas.turma || (snapFunc.exists() ? "staff" : "")),
        etnia: norm(dPas.etnia || dAlu.etnia || dFun.etnia || dQue.etnia || dAtend.etnia || ''),
        
        // ✅ PESO E ALTURA: Agora olha também para o histórico de atendimentos (Caso Allan Giromba)
        peso: numParaString(dPas.peso ?? dAlu.peso ?? dAtend.peso ?? dQue.peso ?? dFun.peso),
        altura: numParaString(dPas.altura ?? dAlu.altura ?? dAtend.altura ?? dQue.altura ?? dFun.altura),
        
        // ✅ ALERGIAS: Também olha no atendimento anterior
        alunoPossuiAlergia: norm(dPas.alunoPossuiAlergia || dAtend.alunoPossuiAlergia || dQue.alergias?.possui || dAlu.alunoPossuiAlergia || 'não'),
        qualAlergia: norm(dPas.qualAlergia || dAtend.qualAlergia || dQue.alergias?.detalhes || dAlu.qualAlergia || ''),

        contatos: dQue.contatos || dAtend.contatos || [
          { 
            nome: norm(dPas.contato1_nome || dFun.nomeContato1 || dAlu.contato1_nome || 'não informado'), 
            telefone: dPas.contato1_telefone || dFun.contato || dAlu.contato1_telefone || '' 
          }
        ],
        escolaId: escolaDono || escolaUsuarioId,
        tipoPerfil: dFun.tipoPerfil || dPas.tipoPerfil || dAlu.tipoPerfil || "aluno"
      };

      if (unificado.existe) toast.success("Dados sincronizados!", { icon: '🔄' });
      return unificado;
    } catch (error) {
      console.error("Erro no sincronizador:", error);
      toast.error("Erro ao cruzar dados.");
      return null;
    } finally { setBuscando(false); }
  }, [escolaUsuarioId, isRoot, gerarIdMestre]);

  return { buscando, sugestoes, buscarSugestoes, puxarDadosCompletos, gerarIdMestre };
};