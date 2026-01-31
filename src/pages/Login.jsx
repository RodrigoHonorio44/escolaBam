import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig'; 
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  Lock, Mail, Loader2, GraduationCap, X, 
  MessageSquare, LifeBuoy, ArrowRight, Eye, EyeOff 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // --- 1. MONITORAMENTO EM TEMPO REAL (EXPULSÃO) ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const localSessionId = localStorage.getItem("current_session_id");

            // A) TRAVA DE SESSÃO ÚNICA (Derruba se IDs forem diferentes)
            // Se for 'root' (Rodrigo), ele é IMUNE a essa trava para facilitar testes
            if (userData.role !== 'root' && localSessionId && userData.currentSessionId && userData.currentSessionId !== localSessionId) {
              toast.error("ACESSO ENCERRADO: OUTRO DISPOSITIVO CONECTOU.", {
                duration: 8000,
                icon: '🚫',
                style: { background: '#991b1b', color: '#fff', fontWeight: 'bold' }
              });
              setTimeout(() => {
                localStorage.clear();
                signOut(auth);
                navigate('/login');
              }, 3000);
              return;
            }

            // B) TRAVA DE BLOQUEIO EM TEMPO REAL
            const isBloqueado = 
              userData.status === "bloqueado" || 
              userData.statusLicenca === "bloqueada" || 
              userData.licencaStatus === "bloqueada";

            if (isBloqueado && userData.role !== 'root') {
              toast.error("ACESSO SUSPENSO PELO ADMINISTRADOR.", { icon: '🛑' });
              localStorage.clear();
              signOut(auth);
              navigate('/login');
            }
          }
        });

        return () => unsubscribeSnapshot();
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const loginLogic = async () => {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      const newSessionId = `sess_${Date.now()}`;
      const userDocRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userDocRef);

      // --- LOGICA PARA USUÁRIO ROOT (RODRIGO) ---
      if (user.email === "rodrigohono21@gmail.com") {
        if (!userSnap.exists()) {
          await setDoc(userDocRef, {
            nome: "Rodrigo Honório",
            email: user.email,
            role: "root",
            status: "ativo",
            statusLicenca: "ativa",
            currentSessionId: newSessionId,
            ultimoLogin: serverTimestamp()
          });
        } else {
          await updateDoc(userDocRef, {
            currentSessionId: newSessionId,
            ultimoLogin: serverTimestamp(),
            role: "root" // Garante que o role seja root no banco
          });
        }
        localStorage.setItem("current_session_id", newSessionId);
        navigate('/');
        return "ACESSO MESTRE LIBERADO"; 
      }

      // --- LOGICA PARA USUÁRIOS COMUNS ---
      if (!userSnap.exists()) {
        await signOut(auth);
        throw new Error("USUÁRIO NÃO LOCALIZADO NA BASE DE DADOS");
      }

      const userData = userSnap.data();

      // Checar Bloqueios
      const isBloqueado = userData.status === "bloqueado" || userData.statusLicenca === "bloqueada";
      if (isBloqueado) {
        await signOut(auth);
        throw new Error("ACESSO SUSPENSO: CONSULTE O ADMINISTRADOR");
      }

      // Gravar sessão e entrar
      localStorage.setItem("current_session_id", newSessionId);
      await updateDoc(userDocRef, {
        currentSessionId: newSessionId,
        ultimoLogin: serverTimestamp(),
        primeiroAcesso: false 
      });

      if (!userData.dataUltimaTroca || userData.primeiroAcesso === true) {
        navigate('/trocar-senha'); 
        return "SEGURANÇA: ALTERE SUA SENHA INICIAL";
      }

      navigate('/');
      return `BEM-VINDO, ${userData.nome.split(' ')[0].toUpperCase()}`;
    };

    toast.promise(loginLogic(), {
      loading: 'AUTENTICANDO...',
      success: (data) => data,
      error: (err) => {
        setLoading(false);
        if (err.code === 'auth/invalid-credential') return "E-MAIL OU SENHA INCORRETOS";
        return err.message.toUpperCase();
      },
    }, {
      style: { minWidth: '280px', background: '#0f172a', color: '#fff', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold' }
    });
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden font-sans relative">
      <Toaster position="top-right" />

      {/* LADO ESQUERDO: BRANDING (Reativado os textos explicativos) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#020617] relative p-8 xl:p-12 flex-col justify-center items-center border-r border-white/5 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] bg-indigo-600/10 rounded-full blur-[100px]"></div>

        <div className="relative z-10 w-full flex flex-col items-center text-center max-w-lg">
          <img src="/logo2.png" alt="Logo" className="w-32 xl:w-40 h-auto mb-8 drop-shadow-2xl" />
          
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-2xl border border-white/10">
              <GraduationCap className="text-blue-500" size={24} />
              <h3 className="text-white font-black text-xl xl:text-2xl tracking-[0.1em] uppercase italic leading-none">C . E . P . T</h3>
            </div>
            <p className="text-blue-400 text-[9px] font-black tracking-[0.4em] uppercase">Unidade Escolar</p>
          </div>

          <h1 className="text-5xl xl:text-7xl font-black text-white leading-[0.9] tracking-tighter italic uppercase mb-8">
            SISTEMA <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">DE SAÚDE</span>
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-cyan-500 mb-8 rounded-full"></div>
          
          {/* TEXTO EXPLICATIVO REATIVADO */}
          <p className="text-slate-400 max-w-sm font-medium text-sm xl:text-base leading-relaxed opacity-70">
            Plataforma inteligente de prontuários e gestão clínica para o ambiente escolar.
          </p>
        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-slate-50/40 relative">
        <div className="w-full max-w-[360px]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 italic uppercase leading-none">
              RODHON<span className="text-blue-600">SYSTEM</span>
            </h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-4">Painel de Acesso</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="email"
                  className="w-full pl-13 pr-6 py-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 transition-all text-sm"
                  placeholder="admin@rodhon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Senha de Segurança</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-13 pr-12 py-4.5 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#020617] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-blue-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300 shadow-xl mt-6 active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar no Sistema <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
             <div className="text-[8px] text-slate-400 font-bold uppercase leading-tight">
                Rodhon Intelligence<br/>Enterprise 2026
             </div>
             <button onClick={() => setShowSupport(true)} className="flex items-center gap-2 bg-white border border-slate-100 px-4 py-2 rounded-full shadow-sm hover:bg-slate-50 transition-all">
                <LifeBuoy size={14} className="text-blue-600" />
                <span className="text-[9px] font-black uppercase tracking-widest">Suporte</span>
             </button>
          </div>
        </div>
      </div>

      {/* MODAL SUPORTE */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[30px] p-10 relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowSupport(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30"><MessageSquare size={28} /></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic">Suporte</h3>
              <p className="text-slate-500 text-sm mt-2 mb-8">Central de Suporte Intelligence: Como podemos otimizar sua gestão hoje?</p>
              <a href="https://wa.me/5521975966330" target="_blank" rel="noreferrer" className="flex items-center justify-center w-full bg-[#25D366] text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:scale-[1.02] transition-transform">WhatsApp</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;