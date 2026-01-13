import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Monitora o status da licença em tempo real.
 * Se o admin bloquear ou a data expirar, executa o callback.
 */
export const monitorarLicenca = (userId, onBlock) => {
  if (!userId) return;

  const userDoc = doc(db, "usuarios", userId);

  return onSnapshot(userDoc, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const hoje = new Date();
      const dataExp = new Date(data.dataExpiracao);

      // Bloqueia se o status for 'bloqueado' OU se a data de expiração passou
      if (data.licencaStatus === 'bloqueado' || hoje > dataExp) {
        onBlock();
      }
    }
  });
};