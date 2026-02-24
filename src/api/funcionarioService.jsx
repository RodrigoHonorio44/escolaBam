import { auth, db } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, query, collection, where, getDocs, serverTimestamp } from "firebase/firestore";

export const funcionarioService = {
  async cadastrar(dados) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        dados.email.toLowerCase().trim(), 
        dados.password || "mudar123" 
      );
      
      const uid = userCredential.user.uid;

      // 🚨 PADRÃO R S: Lowercase e Identidade Vinculada
      const escolaIdFormatado = dados.escolaId ? dados.escolaId.toLowerCase().trim() : 'escola_nao_definida';
      const escolaNomeFormatado = dados.escola ? dados.escola.toLowerCase().trim() : 'escola não definida';

      await setDoc(doc(db, "usuarios", uid), {
        uid: uid,
        nome: dados.nome.toLowerCase().trim(),
        email: dados.email.toLowerCase().trim(),
        role: dados.role.toLowerCase().trim(),
        registroProfissional: dados.registroProfissional || "",
        
        // 🛡️ Vínculo de Unidade (Campos que seu AuthContext consome)
        escolaId: escolaIdFormatado, 
        escola: escolaNomeFormatado,
        unidadeId: escolaIdFormatado, // redundância de segurança
        unidade: escolaNomeFormatado, // redundância de segurança
        
        dataCadastro: serverTimestamp(),
        status: 'ativo',
        statusLicenca: 'ativa',
        licencaStatus: 'ativa',
        currentSessionId: '',
        primeiroAcesso: true,
        
        // Módulos padrão (ajuste conforme necessário)
        modulosSidebar: dados.modulosSidebar || {
          atendimento: true,
          dashboard: true,
          pacientes: true,
          pasta_digital: true
        }
      });

      return uid;
    } catch (error) {
      console.error("Erro ao cadastrar funcionário:", error.message);
      throw error;
    }
  },

  async listarPorEscola(escolaId) {
    try {
      // 🛡️ SEGURANÇA: Bloqueia vazamento de dados se o ID for nulo
      if (!escolaId) {
        console.warn("Tentativa de listagem sem escolaId definido.");
        return [];
      }
      
      const unidadeBusca = escolaId.toLowerCase().trim();
      
      const q = query(
        collection(db, "usuarios"), 
        where("escolaId", "==", unidadeBusca)
      );
      
      const querySnapshot = await getDocs(q);
      // Retorna os dados garantindo que o ID do documento esteja incluso
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erro ao listar funcionários:", error);
      throw error;
    }
  }
};