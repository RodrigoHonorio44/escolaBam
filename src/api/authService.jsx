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
 * LOGIN COM TRAVA DE EXPIRAÇÃO E SESSÃO ÚNICA
 */
export const loginService = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    const userRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userRef);

    // 1. Se o usuário não existe no Firestore (Excessão para o Root Criar o Perfil)
    if (!userSnap.exists()) {
      if (user.email === "rodrigohono21@gmail.com") {
        const rootData = {
          nome: "Rodrigo Honório",
          email: user.email,
          role: "root",
          status: "ativo",
          statusLicenca: "ativa",
          dataExpiracao: "2039-12-31T23:59:59Z", // Data vitalícia
          primeiroAcesso: false
        };
        await setDoc(userRef, rootData);
        return { ...user, ...rootData };
      } else {
        await signOut(auth);
        throw new Error("Perfil não encontrado no banco de dados.");
      }
    }

    const userData = userSnap.data();

    // 🛡️ TRAVA: Verificação de Licença (IGNORA SE FOR ROOT)
    if (userData.role !== 'root' && userData.dataExpiracao) {
      const dataAtual = new Date();
      const dataExpiracao = new Date(userData.dataExpiracao);
      
      if (dataAtual > dataExpiracao) {
        await updateDoc(userRef, { 
          status: 'bloqueado', 
          statusLicenca: 'expirada',
          licencaStatus: 'bloqueada' 
        });
        await signOut(auth);
        throw new Error("Licença expirada. Contate o administrador.");
      }
    }

    // 🛡️ TRAVA: Verificação de Bloqueio Manual (IGNORA SE FOR ROOT)
    if (userData.role !== 'root' && userData.status === 'bloqueado') {
      await signOut(auth);
      throw new Error("Seu acesso foi suspenso pelo administrador.");
    }

    // 🔑 GERAÇÃO DE SESSÃO ÚNICA
    const newSessionId = `sess_${Date.now()}`;
    localStorage.setItem('current_session_id', newSessionId);

    await updateDoc(userRef, {
      currentSessionId: newSessionId,
      ultimoLogin: serverTimestamp()
    });

    return { ...user, ...userData };
  } catch (error) {
    console.error("Erro no loginService:", error);
    if (error.code === 'auth/invalid-credential') throw new Error("E-mail ou senha inválidos.");
    throw new Error(error.message);
  }
};

/**
 * CADASTRO SEM DESLOGAR O ADMIN
 */
export const cadastrarUsuarioService = async (dados) => {
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

    const { password, ...dadosParaSalvar } = dados;

    const userRef = doc(db, "usuarios", newUser.uid);
    
    // Salvando com campos padrão de segurança
    await setDoc(userRef, {
      ...dadosParaSalvar,
      uid: newUser.uid,
      status: dadosParaSalvar.status || "ativo",
      statusLicenca: dadosParaSalvar.statusLicenca || "ativa",
      primeiroAcesso: true, // Força a tela de TrocarSenha no primeiro login
      currentSessionId: "", 
      dataCadastro: serverTimestamp(),
    });

    await signOut(tempAuth);
    await deleteApp(tempApp);

    return { success: true, uid: newUser.uid };
  } catch (error) {
    if (tempApp) await deleteApp(tempApp);
    console.error("Erro no cadastro:", error);
    
    let mensagem = "Erro ao cadastrar usuário.";
    if (error.code === 'auth/email-already-in-use') mensagem = "Este e-mail já está em uso.";
    if (error.code === 'auth/weak-password') mensagem = "A senha deve ter pelo menos 6 caracteres.";
    
    throw new Error(mensagem);
  }
};