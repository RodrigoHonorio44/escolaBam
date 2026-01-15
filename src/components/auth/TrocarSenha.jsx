import { useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import { updatePassword, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Check, X, LogOut, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const TrocarSenha = () => {
  const { user, handleLogout } = useAuth();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const validacoes = {
    length: novaSenha.length >= 6,
    special: /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha),
    upper: /[A-Z]/.test(novaSenha),
    match: novaSenha === confirmarSenha && novaSenha !== ''
  };

  const podeSalvar = Object.values(validacoes).every(Boolean);

  const handleTroca = async (e) => {
    e.preventDefault();
    if (!podeSalvar) return;

    setLoading(true);
    setErro('');

    try {
      // 1. Atualiza a senha no Firebase Auth
      await updatePassword(auth.currentUser, novaSenha);
      
      // 2. Atualiza o Firestore (Coleção: usuarios)
      const userRef = doc(db, "usuarios", user.uid);
      await updateDoc(userRef, {
        primeiroAcesso: false,
        dataUltimaTroca: new Date().toISOString(),
        status: 'ativo',
        statusLicenca: 'ativa', // Garantindo padronização
        licencaStatus: 'ativa'   // Garantindo padronização
      });

      // 3. LIMPEZA E LOGOUT
      localStorage.removeItem("current_session_id"); // Limpa sessão antiga
      await signOut(auth);

      toast.success("SENHA ALTERADA! FAÇA LOGIN NOVAMENTE.", {
        style: {
          background: '#0f172a',
          color: '#fff',
          fontWeight: '900',
          fontSize: '11px',
          borderRadius: '12px'
        }
      });

      // 4. Redirecionamento limpo para forçar novo login
      setTimeout(() => {
        window.location.replace('/login'); 
      }, 2000);

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setErro("SESSÃO EXPIRADA. POR SEGURANÇA, SAIA E ENTRE NOVAMENTE PARA TROCAR A SENHA.");
      } else {
        setErro("ERRO TÉCNICO: " + err.message.toUpperCase());
      }
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans">
      <Toaster position="top-center" />
      
      <div className="max-w-md w-full bg-white p-8 rounded-[40px] shadow-2xl border border-blue-50/50 relative animate-in fade-in zoom-in duration-300">
        
        <button 
          onClick={handleLogout}
          className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"
          title="Sair do sistema"
        >
          <LogOut size={20} />
        </button>

        <div className="w-20 h-20 bg-blue-600 text-white rounded-[28px] flex items-center justify-center mb-6 mx-auto shadow-xl shadow-blue-200 rotate-3">
          <ShieldCheck size={40} />
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Segurança</h2>
          <p className="text-slate-500 text-sm font-medium mt-1 px-4">
            Olá, <span className="text-blue-600 font-bold">{user?.nome?.split(' ')[0]}</span>. 
            Defina sua senha definitiva para continuar.
          </p>
        </div>

        <form onSubmit={handleTroca} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold transition-all shadow-inner"
              onChange={(e) => setNovaSenha(e.target.value)} 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold transition-all shadow-inner"
              onChange={(e) => setConfirmarSenha(e.target.value)} 
            />
          </div>

          <div className="bg-slate-50 p-5 rounded-3xl space-y-2.5 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 italic">Requisitos:</p>
            
            <div className={`flex items-center gap-3 text-xs font-bold transition-colors ${validacoes.length ? 'text-emerald-500' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validacoes.length ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                {validacoes.length ? <Check size={12} strokeWidth={3}/> : <X size={12}/>}
              </div>
              Mínimo de 6 caracteres
            </div>

            <div className={`flex items-center gap-3 text-xs font-bold transition-colors ${validacoes.upper ? 'text-emerald-500' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validacoes.upper ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                {validacoes.upper ? <Check size={12} strokeWidth={3}/> : <X size={12}/>}
              </div>
              Uma letra MAIÚSCULA
            </div>

            <div className={`flex items-center gap-3 text-xs font-bold transition-colors ${validacoes.special ? 'text-emerald-500' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validacoes.special ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                {validacoes.special ? <Check size={12} strokeWidth={3}/> : <X size={12}/>}
              </div>
              Um símbolo (@, #, !)
            </div>

            <div className={`flex items-center gap-3 text-xs font-bold transition-colors ${validacoes.match ? 'text-emerald-500' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validacoes.match ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                {validacoes.match ? <Check size={12} strokeWidth={3}/> : <X size={12}/>}
              </div>
              As senhas são iguais
            </div>
          </div>

          {erro && (
            <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black border border-red-100 animate-pulse">
              <ShieldAlert size={18} /> {erro}
            </div>
          )}

          <button 
            disabled={!podeSalvar || loading}
            className={`w-full font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-2 ${
              podeSalvar && !loading 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:-translate-y-0.5' 
              : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'SALVAR E FINALIZAR'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrocarSenha;