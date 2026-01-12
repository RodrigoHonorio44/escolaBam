import { db, auth } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const funcionarioService = {
  // Cadastrar novo funcionário e criar conta de acesso
  async cadastrar(dados) {
    try {
      // 1. Cria o usuário no Firebase Authentication (Login)
      // Nota: A senha temporária padrão aqui é 'mudar123', você pode ajustar.
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        dados.email, 
        "mudar123" 
      );
      
      const uid = userCredential.user.uid;

      // 2. Salva os detalhes do perfil no Firestore usando o UID do Auth como ID do documento
      // Usamos setDoc em vez de addDoc para que o ID do documento seja igual ao UID
      await setDoc(doc(db, "users", uid), {
        nome: dados.nome,
        email: dados.email,
        role: dados.role,
        escolaId: dados.escolaId || 'escola_padrao', // ID da licença SaaS
        dataCadastro: new Date().toISOString(),
        licencaStatus: 'ativo',
        currentSessionId: ''
      });

      return uid;
    } catch (error) {
      console.error("Erro ao cadastrar funcionário:", error.message);
      // Tratamento de erros comuns
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Este e-mail já está em uso.");
      }
      throw error;
    }
  },

  // Listar funcionários da mesma unidade/escola
  async listarPorEscola(escolaId) {
    try {
      const q = query(collection(db, "users"), where("escolaId", "==", escolaId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erro ao listar funcionários:", error);
      throw error;
    }
  }
};