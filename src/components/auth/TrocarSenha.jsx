import { useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Lock, Check, X, LogOut, ShieldCheck } from 'lucide-react';

const TrocarSenha = () => {
  const { user, handleLogout } = useAuth(); // Importamos o logout do contexto
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Validações rigorosas: 6 dígitos, 1 especial, 1 maiúscula
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
      // 1. Atualiza no Firebase Auth (Sessão atual do navegador)
      await updatePassword(auth.currentUser, novaSenha);
      
      // 2. Atualiza no Firestore para liberar o status de primeiro acesso
      await updateDoc(doc(db, "users", user.uid), {
        primeiroAcesso: false,
        dataUltimaTroca: new Date().toISOString()
      });

      // Recarrega para que o AuthContext pegue o novo statusAcesso: 'ativo'
      window.location.reload(); 
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setErro("Sessão expirada. Saia e faça login novamente para trocar a senha.");
      } else {
        setErro("Erro técnico. Tente novamente em instantes.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[40px] shadow-2xl border border-blue-50/50 relative">
        
        {/* Botão Sair */}
        <button 
          onClick={handleLogout}
          className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors"
          title="Sair do sistema"
        >
          <LogOut size={20} />
        </button>

        <div className="w-20 h-20 bg-blue-600 text-white rounded-[28px] flex items-center justify-center mb-6 mx-auto shadow-xl shadow-blue-200">
          <ShieldCheck size={40} />
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-800">Nova Senha</h2>
          <p className="text-slate-500 text-sm font-medium mt-1 px-4">
            Olá, <span className="text-blue-600 font-bold">{user?.nome?.split(' ')[0]}</span>. 
            Crie sua senha definitiva para acessar o painel.
          </p>
        </div>

        <form onSubmit={handleTroca} className="space-y-4">
          <div className="space-y-1">
            <input 
              type="password" 
              placeholder="Sua nova senha" 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white font-bold transition-all"
              onChange={(e) => setNovaSenha(e.target.value)} 
            />
          </div>
          
          <div className="space-y-1">
            <input 
              type="password" 
              placeholder="Confirme a nova senha" 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white font-bold transition-all"
              onChange={(e) => setConfirmarSenha(e.target.value)} 
            />
          </div>

          {/* Checklist de Requisitos */}
          <div className="bg-slate-50 p-5 rounded-3xl space-y-2.5 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Requisitos de Segurança</p>
            
            <div className={`flex items-center gap-3 text-xs font-bold transition-colors ${validacoes.length ? 'text-emerald-500' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validacoes.length ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                {validacoes.length ? <Check size={12}/> : <X size={12}/>}
              </div>
              Pelo menos 6 caracteres
            </div>

            <div className={`flex items-center gap-3 text-xs font-bold transition-colors ${validacoes.upper ? 'text-emerald-500' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validacoes.upper ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                {validacoes.upper ? <Check size={12}/> : <X size={12}/>}
              </div>
              Uma letra MAIÚSCULA
            </div>

            <div className={`flex items-center gap-3 text-xs font-bold transition-colors ${validacoes.special ? 'text-emerald-500' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validacoes.special ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                {validacoes.special ? <Check size={12}/> : <X size={12}/>}
              </div>
              Um caractere especial (@, #, !, $)
            </div>

            <div className={`flex items-center gap-3 text-xs font-bold transition-colors ${validacoes.match ? 'text-emerald-500' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validacoes.match ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                {validacoes.match ? <Check size={12}/> : <X size={12}/>}
              </div>
              As senhas são iguais
            </div>
          </div>

          {erro && (
            <div className="p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-600 text-[11px] font-bold border border-red-100">
              <ShieldAlert size={14} /> {erro}
            </div>
          )}

          <button 
            disabled={!podeSalvar || loading}
            className={`w-full font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg ${
              podeSalvar && !loading 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? 'Processando...' : 'Finalizar Configuração'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrocarSenha;