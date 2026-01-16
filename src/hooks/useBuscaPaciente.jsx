import { useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

export const useBuscaPaciente = () => {
  const [loading, setLoading] = useState(false);

  // --- 1. BUSCA ALUNOS ---
  const buscarAlunos = async (nomeUpper) => {
    try {
      const q = query(collection(db, "alunos"), where("nomeBusca", "==", nomeUpper.toUpperCase()), limit(1));
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  // --- 2. BUSCA FUNCIONÁRIOS ---
  const buscarFuncionarios = async (nomeUpper) => {
    try {
      const q = query(collection(db, "funcionarios"), where("nomeBusca", "==", nomeUpper.toUpperCase()), limit(1));
      const snap = await getDocs(q);
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) { return null; }
  };

  // --- 3. BUSCA QUESTIONÁRIO (SAÚDE) ---
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

  // --- 4. BUSCA ATENDIMENTOS ---
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

  // --- 5. BUSCA COMPLETA (CONSOLIDAÇÃO PASTA DIGITAL) ---
  const buscarDadosCompletos = async (nomePesquisado) => {
    if (!nomePesquisado) return null;
    setLoading(true);
    const nomeUpper = nomePesquisado.trim().toUpperCase();
    const nomeNormal = nomePesquisado.trim();

    try {
      // Executa todas as buscas em paralelo para máxima performance
      const [aluno, funcionario, saude, atendimentos] = await Promise.all([
        buscarAlunos(nomeUpper),
        buscarFuncionarios(nomeUpper),
        buscarQuestionario(nomeNormal),
        buscarAtendimentos(nomeUpper)
      ]);

      const perfil = aluno || funcionario;
      
      // Limpeza de campos sujos para os formulários
      const limparString = (val) => {
        if (!val) return "";
        const proibidos = ["NÃO INFORMADO", "---", "UNDEFINED", "NULL", "NÃO"];
        return proibidos.includes(val.toString().toUpperCase()) ? "" : val;
      };

      const susFinal = limparString(perfil?.cartaoSus) || limparString(saude?.cartaoSus) || "";
      const nomeFinal = perfil?.nome || saude?.alunoNome || nomeNormal;

      return {
        perfil,
        saude,
        atendimentos,
        isFuncionario: !!funcionario,
        
        // Consolidação para Badges e Alertas Visuais
        statusClinico: {
          asma: saude?.asma?.possui || "Não",
          diabetes: saude?.diabetes?.possui || "Não",
          cardiaco: saude?.doencasCardiacas?.possui || "Não",
          epilepsia: saude?.epilepsia?.possui || "Não",
          // Verifica alergia no perfil (aluno/func) OU no questionário
          alergias: (saude?.alergias?.possui === "Sim" || perfil?.alergias?.possui === "Sim") ? "Sim" : "Não",
          alergias_detalhes: saude?.alergias?.detalhes || perfil?.alergias?.detalhes || "Nenhuma registrada",
          restricoes: saude?.restricoesAlimentares?.detalhes || "Nenhuma registrada"
        },

        // Objeto pronto para resetar o formulário de edição
        dadosParaForm: {
          ...saude,
          ...perfil,
          nome: nomeFinal,
          turma: perfil?.turma || (funcionario ? "Funcionário" : "N/A"),
          alunoNome: nomeFinal,
          cartaoSus: susFinal,
          isEdicao: !!(perfil || saude),
          origem: 'pasta_digital'
        }
      };
    } catch (err) {
      console.error("Erro na consolidação dos dados:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { 
    buscarDadosCompletos, 
    buscarAlunos, 
    buscarFuncionarios, 
    buscarQuestionario, 
    buscarAtendimentos, 
    loading 
  };
};