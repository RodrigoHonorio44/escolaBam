import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig'; 
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
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

  // --- LÓGICA DE SESSÃO ÚNICA (O VIGIA EM TEMPO REAL) ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, "usuarios"), where("email", "==", user.email));
        
        const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const localSessionId = localStorage.getItem("current_session_id");

            if (localSessionId && userData.currentSessionId && userData.currentSessionId !== localSessionId) {
              toast.error("ESTA CONTA FOI CONECTADA EM OUTRO DISPOSITIVO.", {
                duration: 6000,
                icon: '🚫',
                style: { background: '#020617', color: '#fff', fontSize: '12px' }
              });
              
              setTimeout(() => {
                localStorage.removeItem("current_session_id");
                signOut(auth);
                navigate('/login');
              }, 2500);
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

      const newSessionId = Date.now().toString();

      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      // --- LOGICA PARA USUÁRIO ROOT ---
      if (user.email === "rodrigohono21@gmail.com") {
        const rootRef = doc(db, "usuarios", user.uid);
        if (querySnapshot.empty) {
          await setDoc(rootRef, {
            nome: "Rodrigo Honório",
            email: user.email,
            role: "root",
            status: "ativo",
            statusLicenca: "ativa",
            currentSessionId: newSessionId,
            ultimoLogin: serverTimestamp()
          });
        } else {
          await updateDoc(querySnapshot.docs[0].ref, {
            currentSessionId: newSessionId,
            ultimoLogin: serverTimestamp()
          });
        }
        localStorage.setItem("current_session_id", newSessionId);
        navigate('/');
        return "ACESSO MESTRE LIBERADO"; 
      }

      // --- LOGICA PARA USUÁRIOS COMUNS ---
      if (querySnapshot.empty) {
        await signOut(auth);
        throw new Error("USUÁRIO NÃO LOCALIZADO NA BASE DE DADOS");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const isBloqueado = 
        userData.status === "bloqueado" || 
        userData.statusLicenca === "bloqueada" || 
        userData.licencaStatus === "bloqueada";

      if (isBloqueado) {
        await signOut(auth);
        throw new Error("ACESSO SUSPENSO: CONSULTE O ADMINISTRADOR");
      }

      localStorage.setItem("current_session_id", newSessionId);
      await updateDoc(userDoc.ref, {
        currentSessionId: newSessionId,
        ultimoLogin: serverTimestamp(),
        primeiroAcesso: false 
      });

      if (userData.primeiroAcesso === true) {
        navigate('/alterar-senha'); 
        return "PRIMEIRO ACESSO: ALTERE SUA SENHA";
      }

      navigate('/');
      return `BEM-VINDO, ${userData.nome.split(' ')[0].toUpperCase()}`;
    };

    toast.promise(loginLogic(), {
      loading: 'VERIFICANDO CREDENCIAIS...',
      success: (data) => data,
      error: (err) => {
        setLoading(false);
        if (err.code === 'auth/invalid-credential') return "E-MAIL OU SENHA INCORRETOS";
        return err.message.toUpperCase();
      },
    }, {
      style: {
        minWidth: '280px',
        background: '#0f172a',
        color: '#fff',
        borderRadius: '16px',
        fontSize: '10px',
        fontWeight: 'bold',
      },
    });
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden font-sans relative">
      <Toaster position="top-right" />

      {/* --- LADO ESQUERDO: BRANDING CENTRALIZADO --- */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#020617] relative p-8 xl:p-12 flex-col justify-center items-center border-r border-white/5 overflow-hidden">
        {/* Efeitos de Luz de fundo */}
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] bg-indigo-600/10 rounded-full blur-[100px]"></div>

        <div className="relative z-10 w-full flex flex-col items-center text-center max-w-lg">
          {/* Logo Centralizado */}
          <div className="mb-8 animate-in fade-in zoom-in duration-1000">
             <div className="relative inline-block group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <img 
                  src="/logo2.png" 
                  alt="Logo Institucional" 
                  className="relative w-28 xl:w-40 h-auto drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                />
             </div>
          </div>

          {/* Nome da Escola Centralizado */}
          <div className="flex flex-col items-center gap-3 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-2xl border border-white/10">
              <GraduationCap className="text-blue-500" size={24} />
              <h3 className="text-white font-black text-xl xl:text-2xl tracking-[0.1em] uppercase italic leading-none">C . P . T</h3>
            </div>
            <p className="text-blue-400 text-[9px] font-black tracking-[0.4em] uppercase">Unidade Escolar</p>
          </div>

          {/* Título Principal Fluído */}
          <h1 className="text-5xl xl:text-7xl font-black text-white leading-[0.9] tracking-tighter italic uppercase mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            SISTEMA <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">DE SAÚDE</span>
          </h1>

          <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-cyan-500 mb-8 rounded-full"></div>
          
          <p className="text-slate-400 max-w-sm font-medium text-sm xl:text-base leading-relaxed opacity-70 animate-in fade-in duration-1000 delay-500">
            Plataforma inteligente de prontuários e gestão clínica para o ambiente escolar.
          </p>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO (OTIMIZADO) --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 xl:p-12 bg-slate-50/40 relative">
        
        {/* Logo Mobile */}
        <div className="lg:hidden flex flex-col items-center mb-8">
            <img src="/logo2.png" alt="Logo" className="w-20 mb-3" />
            <h2 className="text-2xl font-black text-slate-900 italic uppercase">C.E.P.T <span className="text-blue-600">SAÚDE</span></h2>
        </div>

        <div className="w-full max-w-[360px] xl:max-w-[400px] animate-in fade-in slide-in-from-right duration-700">
          <div className="text-center mb-8 xl:mb-12">
            <h2 className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              RODHON<span className="text-blue-600">SYSTEM</span>
            </h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-4">Painel de Acesso</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 xl:space-y-5">
            <div className="group space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 group-focus-within:text-blue-600 transition-colors">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="email"
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 transition-all shadow-sm text-sm"
                  placeholder="exemplo@rodhon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="group space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 group-focus-within:text-blue-600 transition-colors">Senha de Segurança</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 transition-all shadow-sm text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#020617] text-white py-4 xl:py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-slate-300 mt-6 shadow-xl shadow-slate-900/10"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar no Sistema <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* Rodapé Interno */}
          <div className="mt-12 xl:mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
             <div>
                <p className="text-[10px] text-slate-900 font-black uppercase italic">Rodhon<span className="text-blue-600">Baenf</span></p>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">© 2026 Enterprise Edition</p>
             </div>
             <button onClick={() => setShowSupport(true)} className="flex items-center gap-2 bg-white border border-slate-100 hover:bg-slate-50 px-4 py-2 rounded-full transition-all shadow-sm">
                <LifeBuoy size={14} className="text-blue-600" />
                <span className="text-[9px] font-black uppercase tracking-widest">Suporte</span>
             </button>
          </div>
        </div>
      </div>

      {/* --- MODAL DE SUPORTE (MANTIDO) --- */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative border border-slate-100 animate-in zoom-in duration-300">
            <button onClick={() => setShowSupport(false)} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-900">
              <X size={24} />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-6 shadow-lg shadow-blue-600/30">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic mb-2">Ajuda Especializada</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">Olá Rodrigo! Como podemos ajudar hoje?</p>
              <a href="https://wa.me/5521975966330" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:scale-[1.02] transition-transform">WhatsApp Suporte</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;