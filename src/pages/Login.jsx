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
        // Monitoramos o documento que possui o e-mail do usuário logado
        const q = query(collection(db, "usuarios"), where("email", "==", user.email));
        
        const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const localSessionId = localStorage.getItem("current_session_id");

            // Se o ID no banco mudou e não coincide com o desta máquina, desloga
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

      // Verificação de Bloqueio
      const isBloqueado = 
        userData.status === "bloqueado" || 
        userData.statusLicenca === "bloqueada" || 
        userData.licencaStatus === "bloqueada";

      if (isBloqueado) {
        await signOut(auth);
        throw new Error("ACESSO SUSPENSO: CONSULTE O ADMINISTRADOR");
      }

      // Salva sessão localmente e no Firestore
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
    <div className="h-screen w-full flex bg-white overflow-hidden font-sans relative">
      <Toaster position="top-right" />

      {/* --- LADO ESQUERDO: BRANDING --- */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#020617] relative p-12 xl:p-20 flex-col justify-center items-center border-r border-white/5">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]"></div>

        <div className="relative z-10 w-full max-w-xl">
          <div className="flex items-center gap-4 mb-12 animate-in fade-in slide-in-from-left duration-700">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-[22px] shadow-2xl rotate-3 transition-transform hover:rotate-0">
              <GraduationCap className="text-white" size={36} />
            </div>
            <div>
              <h3 className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none">E.M. Anísio Teixeira</h3>
              <p className="text-blue-400 text-[9px] font-black tracking-[0.4em] uppercase mt-1">Unidade Escolar</p>
            </div>
          </div>

          <h1 className="text-6xl xl:text-8xl font-black text-white leading-[0.85] tracking-tighter italic uppercase mb-8">
            SISTEMA <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">DE SAÚDE</span>
          </h1>
          <p className="text-slate-400 max-w-md font-medium text-lg leading-relaxed mb-12 opacity-80">Plataforma inteligente de prontuários e gestão clínica para o ambiente escolar.</p>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50/30">
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right duration-700">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">RODHON<span className="text-blue-600">SYSTEM</span></h2>
            <div className="flex items-center justify-center gap-2 mt-3">
               <div className="h-px w-4 bg-slate-200"></div>
               <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">Painel de Acesso</p>
               <div className="h-px w-4 bg-slate-200"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="email"
                  className="w-full pl-14 pr-7 py-5 bg-white border-2 border-slate-100 rounded-[22px] outline-none font-bold text-slate-700 focus:border-blue-600 transition-all shadow-sm"
                  placeholder="exemplo@rodhon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="group space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Senha de Segurança</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-14 pr-14 py-5 bg-white border-2 border-slate-100 rounded-[22px] outline-none font-bold text-slate-700 focus:border-blue-600 transition-all shadow-sm"
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
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#020617] text-white py-5 rounded-[22px] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-slate-300 mt-8 shadow-xl shadow-slate-900/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>{'Entrar no Sistema'} <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
             <div>
                <p className="text-[10px] text-slate-900 font-black uppercase italic">Rodhon<span className="text-blue-600">Baenf</span></p>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">© 2026 Enterprise Edition</p>
             </div>
             <button onClick={() => setShowSupport(true)} className="group flex items-center gap-2 bg-slate-100 hover:bg-blue-600 hover:text-white px-5 py-2.5 rounded-full transition-all">
                <LifeBuoy size={14} className="group-hover:rotate-45 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Suporte</span>
             </button>
          </div>
        </div>
      </div>

      {/* --- MODAL DE SUPORTE --- */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] p-12 shadow-2xl relative border border-slate-100 overflow-hidden">
            <button onClick={() => setShowSupport(false)} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-900 transition-colors">
              <X size={24} />
            </button>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-[28px] flex items-center justify-center mx-auto mb-8 rotate-6 shadow-xl shadow-blue-600/30">
                <MessageSquare size={36} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 uppercase italic mb-3">Ajuda Especializada</h3>
              <p className="text-slate-500 text-sm font-medium mb-10">Olá! Sou o Rodrigo. Como posso ajudar você hoje?</p>
              <div className="space-y-4">
                <a href="https://wa.me/5521975966330" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-5 rounded-[22px] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-green-500/20 hover:scale-[1.02] transition-transform">Chamado via WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;