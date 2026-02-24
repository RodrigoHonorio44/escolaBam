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
 * SERVIÇO DE LOGIN COM SESSÃO ÚNICA E LIMPEZA DE UNIDADE
 */
export const loginService = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    const userRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userRef);

    // 1. Verificação de Perfil Existente
    if (!userSnap.exists()) {
      if (user.email === "rodrigohono21@gmail.com") {
        const rootData = {
          nome: "rodrigo honório", // R S: Salvo em lowercase
          email: user.email.toLowerCase(),
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

    // 🛡️ TRAVA: Verificação de Status Suspenso
    const statusLimpo = userData.status?.toLowerCase();
    if (!isRoot && statusLimpo === 'bloqueado') {
      await signOut(auth);
      throw new Error("Acesso suspenso ou bloqueado.");
    }

    // 🧹 LIMPEZA DE "FANTASMAS" DE UNIDADE (O segredo para parar de ver o CEPT)
    // Isso garante que ao logar, o sistema esqueça qualquer escola anterior do cache
    localStorage.removeItem('inspecao_unidade_id');
    localStorage.removeItem('inspecao_unidade_nome');
    localStorage.setItem('modo_inspecao', 'false');

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
 * SERVIÇO DE CADASTRO DINÂMICO (Padronizado Lowercase)
 */
export const cadastrarUsuarioService = async (dados) => {
  const tempAppName = `tempApp_${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp); 

  try {
    const userCredential = await createUserWithEmailAndPassword(tempAuth, dados.email, dados.password);
    const newUser = userCredential.user;

    const { password, ...dadosParaSalvar } = dados;

    // Normalizando dados para o seu padrão "R S" (tudo lowercase)
    const dadosNormalizados = Object.keys(dadosParaSalvar).reduce((acc, key) => {
      const valor = dadosParaSalvar[key];
      acc[key] = typeof valor === 'string' ? valor.toLowerCase().trim() : valor;
      return acc;
    }, {});

    const userRef = doc(db, "usuarios", newUser.uid);
    await setDoc(userRef, {
      ...dadosNormalizados,
      uid: newUser.uid,
      status: 'ativo',
      statusLicenca: 'ativa',
      primeiroAcesso: true,
      dataCadastro: serverTimestamp(),
      currentSessionId: ""
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