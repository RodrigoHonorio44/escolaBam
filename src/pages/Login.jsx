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

  // --- LÓGICA DE SESSÃO ÚNICA (MANTIDA) ---
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
            ultimoLogin: serverTimestamp(),
            createdAt: new Date().toISOString()
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

      if (querySnapshot.empty) {
        await signOut(auth);
        throw new Error("USUÁRIO NÃO LOCALIZADO NA BASE DE DADOS");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const isBloqueado = userData.status === "bloqueado" || userData.statusLicenca === "bloqueada" || userData.licencaStatus === "bloqueada";

      if (isBloqueado) {
        await signOut(auth);
        throw new Error("ACESSO SUSPENSO: CONSULTE O ADMINISTRADOR");
      }

      localStorage.setItem("current_session_id", newSessionId);
      await updateDoc(userDoc.ref, {
        currentSessionId: newSessionId,
        ultimoLogin: serverTimestamp()
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
      style: { minWidth: '280px', background: '#0f172a', color: '#fff', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' },
    });
  };

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden font-sans relative">
      <Toaster position="top-right" />

      {/* --- LADO ESQUERDO: BRANDING ATUALIZADO --- */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#020617] relative p-12 flex-col justify-center items-center">
        {/* Efeitos de luz de fundo */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px]"></div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          {/* Logo Centralizado */}
          <div className="mb-8 animate-in fade-in zoom-in duration-1000">
            <div className="relative inline-block group">
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/40 transition duration-700"></div>
              <img 
                src="/logo2.png" 
                alt="Logo Institucional" 
                className="relative w-40 xl:w-52 h-auto drop-shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>

          {/* Nome da Unidade */}
          <div className="flex flex-col items-center gap-2 mb-10 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
                <GraduationCap className="text-white" size={24} />
              </div>
              <h3 className="text-white font-black text-2xl tracking-[0.1em] uppercase italic leading-none">C . E . P . T</h3>
            </div>
            <p className="text-blue-400 text-[10px] font-black tracking-[0.5em] uppercase">Unidade Escolar</p>
          </div>

          {/* Título Principal */}
          <h1 className="text-7xl xl:text-8xl font-black text-white leading-[0.85] tracking-tighter italic uppercase mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            SISTEMA <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 drop-shadow-sm">DE SAÚDE</span>
          </h1>
          
          <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-transparent mb-8"></div>

          <p className="text-slate-400 max-w-sm font-medium text-lg leading-relaxed opacity-90 animate-in fade-in duration-1000 delay-500">
            Plataforma inteligente de prontuários e gestão clínica para o ambiente escolar.
          </p>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO ATUALIZADO --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50/40 backdrop-blur-sm">
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right duration-700">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
               {/* Substituir pelo ícone do logo se disponível */}
               <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <Lock size={24} />
               </div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">RODHON<span className="text-blue-600">SYSTEM</span></h2>
            <div className="flex items-center justify-center gap-3 mt-4">
               <div className="h-[2px] w-6 bg-slate-200"></div>
               <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em]">Painel de Acesso</p>
               <div className="h-[2px] w-6 bg-slate-200"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 group-focus-within:text-blue-600 transition-colors">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="email"
                  className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[22px] outline-none font-bold text-slate-700 focus:border-blue-600 transition-all shadow-sm group-hover:border-slate-200"
                  placeholder="exemplo@rodhon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="group space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 group-focus-within:text-blue-600 transition-colors">Senha de Segurança</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-16 pr-14 py-5 bg-white border-2 border-slate-100 rounded-[22px] outline-none font-bold text-slate-700 focus:border-blue-600 transition-all shadow-sm group-hover:border-slate-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#020617] text-white py-5 rounded-[22px] font-black uppercase tracking-[0.2em] text-[12px] hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-slate-300 mt-10 shadow-xl shadow-blue-900/10"
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : <>{'Entrar no Sistema'} <ArrowRight size={20} /></>}
            </button>
          </form>

          <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-900 font-black uppercase italic">Rodhon<span className="text-blue-600">Baenf</span></p>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">© 2026 Enterprise Edition</p>
              </div>
              <button onClick={() => setShowSupport(true)} className="group flex items-center gap-2 bg-white border border-slate-100 hover:bg-blue-600 hover:text-white px-5 py-3 rounded-full transition-all shadow-sm">
                <LifeBuoy size={14} className="group-hover:rotate-45 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Suporte</span>
              </button>
          </div>
        </div>
      </div>

      {/* --- MODAL DE SUPORTE (MANTIDO) --- */}
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