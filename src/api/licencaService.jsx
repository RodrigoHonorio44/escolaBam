export const monitorarLicenca = (userId, onBlock) => {
  if (!userId) return;

  const userDoc = doc(db, "usuarios", userId);

  return onSnapshot(userDoc, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // 🛡️ SEGURANÇA ROOT: Rodrigo Honorío imune a bloqueios
      // Usamos o e-mail como trava mestre conforme seu AuthContext
      if (data.email === "rodrigohono21@gmail.com" || data.role === 'root') return;

      const hoje = new Date();
      
      // Converte timestamp do Firebase ou string para objeto Date
      const dataExp = data.dataExpiracao?.seconds 
        ? new Date(data.dataExpiracao.seconds * 1000) 
        : new Date(data.dataExpiracao);

      // ✅ PADRÃO R S: Verificação em lowercase absoluto
      const statusBloqueado = 
        data.licencaStatus?.toLowerCase().trim() === 'bloqueada' || 
        data.licencaStatus?.toLowerCase().trim() === 'bloqueado' || 
        data.status?.toLowerCase().trim() === 'bloqueado' ||
        data.statusLicenca?.toLowerCase().trim() === 'bloqueada';

      // 🚨 CRITÉRIOS DE EXPULSÃO
      const expirou = data.dataExpiracao && hoje > dataExp;

      if (statusBloqueado || expirou) {
        console.warn(`🚫 Bloqueio Ativo para: ${data.nome} | Motivo: ${expirou ? 'Expiração' : 'Status'}`);
        onBlock(); // Esta função deve executar o handleLogout do seu Context
      }
    }
  });
};