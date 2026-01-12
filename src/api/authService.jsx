import { auth, db } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export const loginService = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 1. Gera um ID de sessão único para este acesso
    const newSessionId = `sess_${Date.now()}`;
    
    // 2. Salva no LocalStorage deste PC
    localStorage.setItem('sessionId', newSessionId);

    // 3. Atualiza no Firestore para "derrubar" outros PCs
    const userRef = doc(db, "users", user.uid);
    
    // Verifica se o usuário existe no banco antes de atualizar
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("Usuário não cadastrado no banco de dados.");
    }

    await updateDoc(userRef, {
      currentSessionId: newSessionId,
      lastLogin: new Date().toISOString()
    });

    return user;
  } catch (error) {
    console.error("Erro no login:", error.message);
    throw error;
  }
};