import { auth, db } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const loginService = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 1. Gera um ID de sessão único para este acesso
    const newSessionId = `sess_${Date.now()}`;
    
    // 2. Salva no LocalStorage deste PC (Padrão para verificação de sessão única)
    localStorage.setItem('current_session_id', newSessionId);

    // 🚨 CORREÇÃO: Mudado de "users" para "usuarios"
    const userRef = doc(db, "usuarios", user.uid);
    
    // 3. Verifica se o usuário existe no banco correto antes de atualizar
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      // Se ele não existir em 'usuarios', o login é bloqueado
      throw new Error("Perfil não encontrado na base de dados 'usuarios'.");
    }

    // 4. Atualiza no Firestore para o Dashboard e para o controle de sessão
    await updateDoc(userRef, {
      currentSessionId: newSessionId,
      ultimoLogin: serverTimestamp() // Usando timestamp oficial do Firebase
    });

    return user;
  } catch (error) {
    console.error("Erro no loginService:", error.message);
    throw error;
  }
};