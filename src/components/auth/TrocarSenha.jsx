import { useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import { updatePassword, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Check, X, LogOut, ShieldCheck, ShieldAlert, Loader2, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const TrocarSenha = () => {
  const { user, handleLogout } = useAuth();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
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
    if (!podeSalvar) return;
    setLoading(true);

    try {
      await updatePassword(auth.currentUser, novaSenha);
      await updateDoc(doc(db, "usuarios", user.uid), {
        primeiroAcesso: false,
        dataUltimaTroca: new Date().toISOString()
      });
      await signOut(auth);
      toast.success("SENHA ATUALIZADA!");
      setTimeout(() => window.location.replace('/login'), 1500);
    } catch (err) {
      setErro("ERRO: REFAÇA O LOGIN PARA TROCAR A SENHA.");
      setLoading(false);
    }
  };

  return (
    // 'fixed inset-0' garante que ele cubra a Sidebar e o Header se o Layout tentar aparecer
    <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-[360px] bg-white p-6 rounded-[30px] shadow-2xl border border-slate-100 relative my-auto">
        
        <button onClick={handleLogout} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors">
          <LogOut size={18} />
        </button>

        <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-xl rotate-3">
          <ShieldCheck size={30} />
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">Segurança</h2>
          <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">
            Olá, <span className="text-blue-600">{user?.nome?.split(' ')[0]}</span>. Defina sua senha definitiva.
          </p>
        </div>

        <form onSubmit={handleTroca} className="space-y-4">
          <div className="space-y-1 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
            <input 
              type={showPass ? "text" : "password"} 
              className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-sm transition-all"
              onChange={(e) => setNovaSenha(e.target.value)} 
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-[38px] text-slate-400">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <div className="space-y-1 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar</label>
            <input 
              type={showConfirm ? "text" : "password"} 
              className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-sm transition-all"
              onChange={(e) => setConfirmarSenha(e.target.value)} 
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[38px] text-slate-400">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
            {[
              { label: '6+ Caracteres', val: validacoes.length },
              { label: 'Uma Maiúscula', val: validacoes.upper },
              { label: 'Um Símbolo', val: validacoes.special },
              { label: 'Senhas Iguais', val: validacoes.match }
            ].map((req, i) => (
              <div key={i} className={`flex items-center gap-2 text-[10px] font-bold ${req.val ? 'text-emerald-500' : 'text-slate-300'}`}>
                {req.val ? <Check size={12} strokeWidth={3}/> : <X size={12}/>} {req.label}
              </div>
            ))}
          </div>

          <button 
            disabled={!podeSalvar || loading}
            className={`w-full font-black py-4 rounded-xl transition-all uppercase tracking-widest text-[11px] shadow-lg flex items-center justify-center gap-2 ${
              podeSalvar && !loading ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-300'
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