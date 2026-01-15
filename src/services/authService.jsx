import { auth, db, firebaseConfig } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getAuth } from 'firebase/auth'; 
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';

/**
 * SERVIÇO DE LOGIN COM SESSÃO ÚNICA E TRAVA DE EXPIRAÇÃO
 */
export const loginService = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await signOut(auth);
      throw new Error("Perfil de usuário não encontrado na base 'usuarios'.");
    }

    const userData = userSnap.data();

    // 🛡️ VERIFICAÇÃO DE EXPIRAÇÃO DE LICENÇA
    if (userData.dataExpiracao) {
      const dataAtual = new Date();
      const dataExpiracao = new Date(userData.dataExpiracao);
      if (dataAtual > dataExpiracao) {
        await updateDoc(userRef, { status: 'bloqueado', statusLicenca: 'expirada' });
        await signOut(auth);
        throw new Error("Sua licença expirou. Entre em contato com a administração.");
      }
    }

    // Verificação de Status Suspenso
    if (userData.statusLicenca === 'bloqueado' && userData.role !== 'admin_saas') {
      await signOut(auth);
      throw new Error("Acesso suspenso. Entre em contato com a administração.");
    }

    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    localStorage.setItem('current_session_id', newSessionId);

    await updateDoc(userRef, {
      currentSessionId: newSessionId,
      ultimoLogin: serverTimestamp()
    });

    return { ...user, ...userData };
  } catch (error) {
    let message = "Falha ao acessar o sistema.";
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      message = "E-mail ou senha incorretos.";
    } else if (error.message) {
      message = error.message;
    }
    throw new Error(message);
  }
};

/**
 * SERVIÇO DE CADASTRO (DINÂMICO - SALVA TODOS OS CAMPOS DO FORMULÁRIO)
 */
export const cadastrarUsuarioService = async (dados) => {
  const tempAppName = `tempApp_${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp); 

  try {
    const userCredential = await createUserWithEmailAndPassword(tempAuth, dados.email, dados.password);
    const newUser = userCredential.user;

    // 1. Separamos a senha para não salvar no Firestore
    const { password, ...dadosParaSalvar } = dados;

    // 2. Gravamos em "usuarios" usando o spread (...dadosParaSalvar)
    // Isso garante que modulosSidebar e registroProfissional sejam incluídos!
    await setDoc(doc(db, "usuarios", newUser.uid), {
      ...dadosParaSalvar, // <--- AQUI ENTRA O COREN E OS MÓDULOS
      uid: newUser.uid,
      escolaId: dados.escolaId || 'E. M. Anísio Teixeira', 
      statusLicenca: 'ativa',
      status: 'ativo',
      primeiroAcesso: true,
      dataCadastro: serverTimestamp()
    });

    await signOut(tempAuth);
    await deleteApp(tempApp);

    return { success: true, uid: newUser.uid };
  } catch (error) {
    if (tempApp) await deleteApp(tempApp);
    console.error("Erro no cadastro:", error);
    let msg = error.code === 'auth/email-already-in-use' ? "E-mail já cadastrado." : "Erro ao cadastrar.";
    throw new Error(msg);
  }
};