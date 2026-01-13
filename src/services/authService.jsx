import { auth, db, firebaseConfig } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getAuth } from 'firebase/auth'; 
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';

/**
 * SERVIÇO DE LOGIN COM SESSÃO ÚNICA (KICKOUT)
 */
export const loginService = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 🚨 CORREÇÃO: Mudado de "users" para "usuarios"
    const userRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await signOut(auth);
      throw new Error("Perfil de usuário não encontrado na base 'usuarios'.");
    }

    const userData = userSnap.data();

    // Verificação de Licença
    if (userData.statusLicenca === 'bloqueado' && userData.role !== 'admin_saas') {
      await signOut(auth);
      throw new Error("Acesso suspenso. Entre em contato com a administração.");
    }

    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    // Padronizando a chave do localStorage
    localStorage.setItem('current_session_id', newSessionId);

    await updateDoc(userRef, {
      currentSessionId: newSessionId,
      ultimoLogin: serverTimestamp() // Usando timestamp oficial
    });

    return { ...user, ...userData };
  } catch (error) {
    let message = "Falha ao acessar o sistema.";
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      message = "E-mail ou senha incorretos.";
    } else if (error.code === 'auth/too-many-requests') {
      message = "Muitas tentativas. Tente novamente em instantes.";
    } else if (error.message) {
      message = error.message;
    }
    throw new Error(message);
  }
};

/**
 * SERVIÇO DE CADASTRO (EVITA O LOGOUT DO ADMIN)
 */
export const cadastrarUsuarioService = async (dados) => {
  const tempAppName = `tempApp_${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp); 

  try {
    const userCredential = await createUserWithEmailAndPassword(tempAuth, dados.email, dados.password);
    const newUser = userCredential.user;

    // 🚨 CORREÇÃO: Gravando em "usuarios" e removendo o Hospital Fixo
    await setDoc(doc(db, "usuarios", newUser.uid), {
      nome: dados.nome,
      email: dados.email,
      role: dados.role || 'enfermeiro',
      // 🚨 AGORA SALVA A ESCOLA CERTA (Anísio Teixeira)
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
    await deleteApp(tempApp);
    console.error("Erro no cadastro:", error);
    
    let msg = "Erro ao cadastrar usuário.";
    if (error.code === 'auth/email-already-in-use') msg = "E-mail já cadastrado.";
    
    throw new Error(msg);
  }
};