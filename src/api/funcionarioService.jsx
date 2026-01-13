import { db, auth } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const funcionarioService = {
  // Cadastrar novo funcionário e criar conta de acesso
  async cadastrar(dados) {
    try {
      // 1. Cria o usuário no Firebase Authentication (Login)
      // Usamos a senha vinda do formulário ou a padrão
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        dados.email, 
        dados.password || "mudar123" 
      );
      
      const uid = userCredential.user.uid;

      // 🚨 CORREÇÃO: Salvando na coleção "usuarios" e garantindo escolaId correto
      await setDoc(doc(db, "usuarios", uid), {
        nome: dados.nome,
        email: dados.email,
        role: dados.role,
        // Garante que salve a escola correta ou a unidade Anísio Teixeira
        escolaId: dados.escolaId || 'E. M. Anísio Teixeira', 
        dataCadastro: serverTimestamp(),
        status: 'ativo',
        statusLicenca: 'ativa',
        currentSessionId: '',
        primeiroAcesso: true
      });

      return uid;
    } catch (error) {
      console.error("Erro ao cadastrar funcionário:", error.message);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Este e-mail já está em uso.");
      }
      throw error;
    }
  },

  // 🚨 CORREÇÃO CRUCIAL: Estava buscando em "users", mudei para "usuarios"
  async listarPorEscola(escolaId) {
    try {
      // Se não passar escolaId, ele busca da Anísio Teixeira por padrão
      const unidadeBusca = escolaId || 'E. M. Anísio Teixeira';
      
      const q = query(
        collection(db, "usuarios"), 
        where("escolaId", "==", unidadeBusca)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erro ao listar funcionários:", error);
      throw error;
    }
  }
};