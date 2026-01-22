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
 * SERVIÇO DE LOGIN COM SESSÃO ÚNICA E TRAVA DE EXPIRAÇÃO
 * Sincronizado com Perfil Root e Verificação ISO Date
 */
export const loginService = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    const userRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userRef);

    // 1. Verificação de Perfil Existente
    if (!userSnap.exists()) {
      // Bypas para criar o perfil Root caso ele não exista no Firestore
      if (user.email === "rodrigohono21@gmail.com") {
        const rootData = {
          nome: "Rodrigo Honório",
          email: user.email,
          role: "root",
          status: "ativo",
          statusLicenca: "ativa",
          dataExpiracao: "2039-12-31T23:59:59Z",
          primeiroAcesso: false
        };
        await setDoc(userRef, rootData);
        return { ...user, ...rootData };
      }
      await signOut(auth);
      throw new Error("Perfil de usuário não encontrado.");
    }

    const userData = userSnap.data();
    const isRoot = userData.role === 'root' || user.email === "rodrigohono21@gmail.com";

    // 🛡️ TRAVA: Verificação de Licença (IGNORA SE FOR ROOT)
    if (!isRoot && userData.dataExpiracao) {
      const dataAtual = new Date();
      const dataExpiracao = new Date(userData.dataExpiracao);
      
      if (dataAtual > dataExpiracao) {
        await updateDoc(userRef, { 
          status: 'bloqueado', 
          statusLicenca: 'expirada',
          licencaStatus: 'bloqueada' 
        });
        await signOut(auth);
        throw new Error("Sua licença expirou. Entre em contato com a administração.");
      }
    }

    // 🛡️ TRAVA: Verificação de Status Suspenso (IGNORA SE FOR ROOT)
    const isBloqueado = 
      userData.status === 'bloqueado' || 
      userData.statusLicenca === 'bloqueada' || 
      userData.licencaStatus === 'bloqueada';

    if (!isRoot && isBloqueado) {
      await signOut(auth);
      throw new Error("Acesso suspenso ou bloqueado.");
    }

    // 🔑 GERAÇÃO DE SESSÃO ÚNICA
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    localStorage.setItem('current_session_id', newSessionId);

    await updateDoc(userRef, {
      currentSessionId: newSessionId,
      ultimoLogin: serverTimestamp()
    });

    return { ...user, ...userData };
  } catch (error) {
    console.error("Erro no loginService:", error);
    let message = "Falha ao acessar o sistema.";
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = "E-mail ou senha incorretos.";
    } else if (error.message) {
      message = error.message.toUpperCase();
    }
    throw new Error(message);
  }
};

/**
 * SERVIÇO DE CADASTRO DINÂMICO
 * Salva Coren, Módulos e Prazos via ...dadosParaSalvar
 */
export const cadastrarUsuarioService = async (dados) => {
  const tempAppName = `tempApp_${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp); 

  try {
    const userCredential = await createUserWithEmailAndPassword(tempAuth, dados.email, dados.password);
    const newUser = userCredential.user;

    // 1. Removemos a senha para segurança
    const { password, ...dadosParaSalvar } = dados;

    // 2. Gravamos no Firestore (Preservando todos os campos dinâmicos)
    const userRef = doc(db, "usuarios", newUser.uid);
    await setDoc(userRef, {
      ...dadosParaSalvar,       // <--- Salva automaticamente Modulos, Coren, etc.
      uid: newUser.uid,
      status: 'ativo',
      statusLicenca: 'ativa',
      primeiroAcesso: true,     // Obriga a troca de senha
      dataCadastro: serverTimestamp(),
      currentSessionId: ""      // Inicia vazio
    });

    // 3. Limpeza
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