import { useState, useCallback } from 'react';
import { db } from '../firebase/firebaseConfig';
import { 
  doc, getDoc, query, collection, where, getDocs, limit, orderBy, startAt, endAt
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export const usePacienteSinc = () => {
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);

  const gerarIdMestre = (nome, dataNasc) => {
    if (!nome || !dataNasc) return null;
    const nomeSlug = nome.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, '-');
    const dataRef = dataNasc.replace(/-/g, '');
    return `${nomeSlug}-${dataRef}`;
  };

  // BUSCA GLOBAL DE SUGESTÕES (OLHA PARA TODAS AS ENTRADAS)
  const buscarSugestoes = async (termo) => {
    const busca = termo.trim().toLowerCase();
    if (busca.length < 3) {
      setSugestoes([]);
      return;
    }

    try {
      // Lista de coleções onde o paciente pode estar
      const colecoes = ["alunos", "pastas_digitais", "questionarios_saude", "atendimentos_enfermagem"];
      let resultadosBrutos = [];

      // Criamos promessas de busca para todas as coleções simultaneamente
      const buscas = colecoes.map(async (colNome) => {
        // Nota: 'nome' para alunos/atendimentos, 'nomeBusca' para pastas, 'alunoNome' para questionarios
        const campoBusca = colNome === "pastas_digitais" ? "nomeBusca" : 
                           colNome === "questionarios_saude" ? "alunoNome" : "nome";
        
        const q = query(
          collection(db, colNome),
          orderBy(campoBusca),
          startAt(busca),
          endAt(busca + "\uf8ff"),
          limit(5)
        );
        
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
          id: d.id,
          // Normalizamos o nome para o componente de UI
          nome: d.data()[campoBusca] || d.data().nome || d.data().nomePaciente,
          dataNascimento: d.data().dataNascimento || "",
          origem: colNome,
          ...d.data()
        }));
      });

      const retornoBuscas = await Promise.all(buscas);
      resultadosBrutos = retornoBuscas.flat();

      // REMOVE DUPLICADOS (pelo nome e data de nascimento ou ID)
      const unificados = resultadosBrutos.filter((valor, index, self) =>
        index === self.findIndex((t) => (
          t.nome === valor.nome && t.dataNascimento === valor.dataNascimento
        ))
      );

      setSugestoes(unificados.slice(0, 8)); // Retorna as 8 melhores sugestões
    } catch (error) {
      console.error("Erro na busca global:", error);
    }
  };

  const puxarDadosCompletos = useCallback(async (nome, dataNasc) => {
    const idMestre = gerarIdMestre(nome, dataNasc);
    if (!idMestre) return null;

    setBuscando(true);
    try {
      const [snapAluno, snapPasta, snapQuest] = await Promise.all([
        getDoc(doc(db, "alunos", idMestre)),
        getDoc(doc(db, "pastas_digitais", idMestre)),
        getDoc(doc(db, "questionarios_saude", idMestre))
      ]);

      const dAlu = snapAluno.exists() ? snapAluno.data() : {};
      const dPas = snapPasta.exists() ? snapPasta.data() : {};
      const dQue = snapQuest.exists() ? snapQuest.data() : {};

      const norm = (val) => (val ? String(val).toLowerCase().trim() : '');

      let etniaFinal = norm(dPas.etnia || dAlu.etnia || dQue.etnia || dQue.raca || '');
      
      // Busca no histórico de atendimentos se a etnia ainda estiver vazia
      if (!etniaFinal) {
        try {
          const qAtend = query(
            collection(db, "atendimentos_enfermagem"),
            where("pacienteId", "==", idMestre),
            limit(1) 
          );
          const snapAtend = await getDocs(qAtend);
          if (!snapAtend.empty) {
            etniaFinal = norm(snapAtend.docs[0].data().etnia);
          }
        } catch (err) {
          console.warn("Histórico inacessível:", err.message);
        }
      }

      const unificado = {
        id: idMestre,
        existe: snapAluno.exists() || snapPasta.exists() || snapQuest.exists(),
        nome: norm(dAlu.nome || dQue.alunoNome || dPas.nomeBusca || nome),
        dataNascimento: dAlu.dataNascimento || dQue.dataNascimento || dataNasc,
        sexo: norm(dAlu.sexo || dQue.sexo || dPas.sexo),
        turma: norm(dAlu.turma || dQue.turma || dPas.turma),
        etnia: etniaFinal,
        // Mantém os tipos originais do Firebase (Numbers)
        peso: dPas.peso || dQue.peso || '',
        altura: dPas.altura || dQue.altura || '',
        imc: dPas.imc || dQue.imc || '',
        alunoPossuiAlergia: norm(dPas.alunoPossuiAlergia || dQue.alergias?.possui || dAlu.alunoPossuiAlergia || 'não'),
        qualAlergia: norm(dPas.qualAlergia || dQue.alergias?.detalhes || dAlu.qualAlergia || ''),
        contatos: dQue.contatos || [
          { nome: norm(dPas.responsavel || dAlu.responsavel || ''), telefone: dPas.contato || dAlu.contato || '' }
        ],
        temQuestionario: snapQuest.exists(),
        temPastaDigital: snapPasta.exists()
      };

      if (unificado.existe) toast.success("perfil sincronizado!");
      return unificado;

    } catch (error) {
      console.error("Erro fatal no cruzamento:", error);
      toast.error("erro ao cruzar dados");
      return null;
    } finally {
      setBuscando(false);
    }
  }, []);

  return { buscando, sugestoes, buscarSugestoes, puxarDadosCompletos, gerarIdMestre };
};