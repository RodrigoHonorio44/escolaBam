import { auth, db, firebaseConfig } from '../firebase/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  getAuth 
} from 'firebase/auth';
import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';

/**
 * LOGIN COM TRAVA DE EXPIRAÇÃO
 */
export const loginService = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await signOut(auth);
      throw new Error("Perfil não encontrado.");
    }

    const userData = userSnap.data();

    // 🛡️ TRAVA: Verificação de Licença Expirada
    if (userData.dataExpiracao) {
      const dataAtual = new Date();
      const dataExpiracao = new Date(userData.dataExpiracao);
      if (dataAtual > dataExpiracao) {
        await updateDoc(userRef, { status: 'bloqueado', statusLicenca: 'expirada' });
        await signOut(auth);
        throw new Error("Licença expirada. Contate o administrador.");
      }
    }

    if (userData.status === 'bloqueado') {
      await signOut(auth);
      throw new Error("Acesso bloqueado.");
    }

    const newSessionId = `sess_${Date.now()}`;
    localStorage.setItem('current_session_id', newSessionId);

    await updateDoc(userRef, {
      currentSessionId: newSessionId,
      ultimoLogin: serverTimestamp()
    });

    return { ...user, ...userData };
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * CADASTRO SEM DESLOGAR O ADMIN (USANDO APP TEMPORÁRIO)
 * Salva Coren, Módulos e Prazos via ...dadosParaSalvar
 */
export const cadastrarUsuarioService = async (dados) => {
  // 1. Criamos uma instância temporária para o cadastro não afetar o seu login
  const tempAppName = `tempApp_${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp); 

  try {
    const userCredential = await createUserWithEmailAndPassword(
      tempAuth, 
      dados.email, 
      dados.password
    );
    const newUser = userCredential.user;

    // 2. Removemos a senha para não salvar no banco
    const { password, ...dadosParaSalvar } = dados;

    // 3. Salvamos TUDO no banco (Coren, Módulos, etc)
    const userRef = doc(db, "usuarios", newUser.uid);
    await setDoc(userRef, {
      ...dadosParaSalvar, // <--- Aqui entra o Coren e os Módulos marcados
      uid: newUser.uid,
      currentSessionId: "", 
      dataCadastro: serverTimestamp(), 
    });

    // 4. Limpamos a instância temporária
    await signOut(tempAuth);
    await deleteApp(tempApp);

    return { success: true, uid: newUser.uid };
  } catch (error) {
    if (tempApp) await deleteApp(tempApp);
    console.error("Erro no cadastro:", error);
    throw new Error(error.code === 'auth/email-already-in-use' ? "E-mail já cadastrado." : "Erro ao cadastrar.");
  }
};