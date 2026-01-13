import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Lock, Mail, Loader2, GraduationCap, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const userRef = doc(db, "usuarios", user.uid); 
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;

      const sessionId = Date.now().toString();
      localStorage.setItem("current_session_id", sessionId);

      if (user.email === "rodrigohono21@gmail.com") {
        if (!userData) {
          await setDoc(userRef, {
            nome: "Rodrigo Honório",
            email: user.email,
            role: "root",
            status: "ativo",
            statusLicenca: "ativa",
            currentSessionId: sessionId,
            dataExpiracao: "2039-12-31T23:59:59Z",
            ultimoLogin: serverTimestamp()
          });
        } else {
          await updateDoc(userRef, {
            currentSessionId: sessionId,
            ultimoLogin: serverTimestamp()
          });
        }
        navigate('/');
        return;
      }

      if (!userData) throw new Error("Acesso negado: Perfil não encontrado.");
      
      const isBloqueado = userData.status === "bloqueado" || userData.statusLicenca === "bloqueada";
      if (isBloqueado) throw new Error("Acesso suspenso pelo administrador.");

      await updateDoc(userRef, {
        currentSessionId: sessionId,
        ultimoLogin: serverTimestamp()
      });

      navigate('/');
      
    } catch (err) {
      toast.error(err.message || "Erro ao entrar no sistema.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 overflow-hidden font-sans">
      <Toaster position="top-right" />
      
      {/* LADO ESQUERDO: Branding e Impacto */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#0f172a] relative p-16 flex-col justify-between overflow-hidden">
        {/* Elementos Decorativos (Blur) */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px]"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20">
              <GraduationCap className="text-white" size={32} />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tighter uppercase italic">Anísio Teixeira</h3>
              <p className="text-blue-400 text-[10px] font-black tracking-[0.3em] uppercase">Unidade Escolar</p>
            </div>
          </div>

          <h1 className="text-8xl font-black text-white leading-[0.9] tracking-tighter italic uppercase">
            SISTEMA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">DE SAÚDE</span>
          </h1>
          <p className="mt-6 text-slate-400 max-w-md font-medium text-lg leading-relaxed">
            Plataforma inteligente para gestão de prontuários e atendimentos em unidades escolares.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-slate-500">
           <div className="flex flex-col">
              <span className="text-white font-bold text-2xl">2026</span>
              <span className="text-[10px] uppercase tracking-widest font-black">Versão Atualizada</span>
           </div>
           <div className="h-10 w-px bg-slate-800"></div>
           <div className="flex items-center gap-2">
              <ShieldCheck className="text-blue-500" size={20} />
              <span className="text-[10px] uppercase tracking-widest font-black">Acesso Criptografado</span>
           </div>
        </div>
      </div>

      {/* LADO DIREITO: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-[420px] space-y-10">
          
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic mb-2">
              RODHON<span className="text-blue-600">SYSTEM</span>
            </h2>
            <p className="text-slate-500 font-bold text-sm">Bem-vindo. Identifique-se para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="email"
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="password"
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Acessar Painel'}
            </button>
          </form>

          <div className="pt-10 border-t border-slate-100">
             <div className="flex justify-between items-center">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">© 2026 Rodhon Inc.</p>
                <a href="#" className="text-[9px] text-blue-600 font-black uppercase tracking-widest hover:underline">Suporte Técnico</a>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;