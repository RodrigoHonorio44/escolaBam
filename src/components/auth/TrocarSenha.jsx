import { useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import { updatePassword, signOut } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Check, X, LogOut, ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const TrocarSenha = () => {
  const { user, handleLogout } = useAuth();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validacoes = {
    length: novaSenha.length >= 6,
    special: /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha),
    upper: /[A-Z]/.test(novaSenha),
    match: novaSenha === confirmarSenha && novaSenha !== ''
  };

  const podeSalvar = Object.values(validacoes).every(Boolean);

  const handleTroca = async (e) => {
    e.preventDefault();
    if (!podeSalvar || loading) return;
    setLoading(true);

    try {
      // 1. Atualiza no Auth do Firebase
      await updatePassword(auth.currentUser, novaSenha);

      // 2. Prepara a atualização no Firestore
      const userDocRef = doc(db, "usuarios", user.uid);
      
      // CRÍTICO: Geramos um novo Session ID aqui para o snapshot do login não expulsar você
      const syncSessionId = `sess_${Date.now()}`;
      localStorage.setItem("current_session_id", syncSessionId);

      await updateDoc(userDocRef, {
        primeiroAcesso: false,
        dataUltimaTroca: new Date().toISOString(),
        currentSessionId: syncSessionId, // Sincroniza a trava de sessão
        ultimoLogin: serverTimestamp()
      });

      toast.success("SENHA DEFINIDA COM SUCESSO!", {
        duration: 3000,
        style: { background: '#020617', color: '#fff', fontWeight: 'bold' }
      });

      // 3. Aguarda o toast e limpa tudo para novo login
      setTimeout(async () => {
        localStorage.clear();
        await signOut(auth);
        window.location.replace('/login');
      }, 2000);

    } catch (err) {
      console.error("Erro na troca:", err);
      setLoading(false);
      
      if (err.code === 'auth/requires-recent-login') {
        toast.error("SESSÃO EXPIRADA. SAIA E ENTRE NOVAMENTE.");
      } else {
        toast.error("ERRO AO SALVAR. TENTE NOVAMENTE.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-[360px] bg-white p-8 rounded-[35px] shadow-2xl border border-white/20 relative my-auto animate-in zoom-in duration-300">
        
        <button 
          onClick={handleLogout} 
          className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors p-2"
        >
          <LogOut size={20} />
        </button>

        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl rotate-3">
          <ShieldCheck size={32} />
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Segurança</h2>
          <p className="text-slate-500 text-[10px] font-bold mt-2 uppercase tracking-widest leading-relaxed">
            Olá, <span className="text-blue-600">{user?.nome?.split(' ')[0]}</span>.<br/>
            Sua conta é nova. Defina uma senha definitiva.
          </p>
        </div>

        <form onSubmit={handleTroca} className="space-y-4">
          <div className="space-y-1 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
            <input 
              type={showPass ? "text" : "password"} 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm transition-all"
              placeholder="••••••••"
              onChange={(e) => setNovaSenha(e.target.value)} 
              required
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-[42px] text-slate-300 hover:text-blue-600">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <div className="space-y-1 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
            <input 
              type={showConfirm ? "text" : "password"} 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm transition-all"
              placeholder="••••••••"
              onChange={(e) => setConfirmarSenha(e.target.value)} 
              required
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-[42px] text-slate-300 hover:text-blue-600">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            {[
              { label: '6+ Caracteres', val: validacoes.length },
              { label: 'Uma Maiúscula', val: validacoes.upper },
              { label: 'Um Símbolo (!@#)', val: validacoes.special },
              { label: 'Senhas Iguais', val: validacoes.match }
            ].map((req, i) => (
              <div key={i} className={`flex items-center gap-2 text-[10px] font-bold ${req.val ? 'text-emerald-500' : 'text-slate-300'}`}>
                {req.val ? <Check size={14} strokeWidth={4}/> : <X size={14} strokeWidth={4}/>} 
                <span className="uppercase">{req.label}</span>
              </div>
            ))}
          </div>

          <button 
            disabled={!podeSalvar || loading}
            type="submit"
            className={`w-full font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[11px] shadow-lg flex items-center justify-center gap-2 mt-4 ${
              podeSalvar && !loading ? 'bg-[#020617] text-white hover:bg-blue-600 hover:-translate-y-1' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'FINALIZAR CONFIGURAÇÃO'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrocarSenha;