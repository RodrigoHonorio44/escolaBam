import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Lock, Mail, Loader2, GraduationCap, ShieldCheck, X, MessageSquare, LifeBuoy } from 'lucide-react'; // Adicionei ícones aqui
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false); // Estado para o Modal
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const loginLogic = async () => {
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
        return "ACESSO MESTRE LIBERADO"; 
      }

      if (!userData) throw new Error("PERFIL NÃO LOCALIZADO NO SISTEMA");
      
      const isBloqueado = userData.status === "bloqueado" || userData.statusLicenca === "bloqueada";
      if (isBloqueado) throw new Error("ACESSO SUSPENSO PELO ADMINISTRADOR");

      await updateDoc(userRef, {
        currentSessionId: sessionId,
        ultimoLogin: serverTimestamp()
      });

      navigate('/');
      return `BEM-VINDO, ${userData.nome.split(' ')[0].toUpperCase()}`;
    };

    toast.promise(loginLogic(), {
      loading: 'VERIFICANDO CREDENCIAIS...',
      success: (data) => data,
      error: (err) => {
        if (err.code === 'auth/invalid-credential') return "E-MAIL OU SENHA INCORRETOS";
        if (err.code === 'auth/user-not-found') return "USUÁRIO NÃO CADASTRADO";
        if (err.code === 'auth/too-many-requests') return "ACESSO BLOQUEADO TEMPORARIAMENTE";
        return err.message.toUpperCase();
      },
    }, {
      style: {
        minWidth: '250px',
        background: '#0f172a',
        color: '#fff',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '900',
        letterSpacing: '1px',
        border: '1px solid rgba(255,255,255,0.1)'
      },
      success: {
        iconTheme: { primary: '#3b82f6', secondary: '#fff' },
      },
    });

    setLoading(false);
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 overflow-hidden font-sans relative">
      <Toaster position="top-center" />

      {/* MODAL DE SUPORTE TÉCNICO */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowSupport(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <X size={20} />
            </button>

            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg shadow-blue-600/20">
                <LifeBuoy className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Suporte Técnico</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">Escolha um canal para falar com o desenvolvedor do sistema.</p>

              <div className="space-y-3">
                <a 
                  href="https://wa.me/5521975966330?text=Olá!%20Preciso%20de%20suporte%20no%20sistema%20Rodhon%20MedSys." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform shadow-lg shadow-green-500/20"
                >
                  <MessageSquare size={16} fill="currentColor" /> WhatsApp Direto
                </a>

                <a 
                  href="mailto:rodrigohono21@gmail.com" 
                  className="flex items-center justify-center gap-3 w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-colors"
                >
                  <Mail size={16} /> rodrigohono21@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* LADO ESQUERDO: Branding */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#0f172a] relative p-16 flex-col justify-between overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-125 h-125 bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-100 h-100 bg-indigo-600/20 rounded-full blur-[100px]"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20">
              <GraduationCap className="text-white" size={32} />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tighter uppercase italic"> E.M.  Anísio Teixeira</h3>
              <p className="text-blue-400 text-[10px] font-black tracking-[0.3em] uppercase">Unidade Escolar</p>
            </div>
          </div>

          <h1 className="text-8xl font-black text-white leading-[0.9] tracking-tighter italic uppercase">
            SISTEMA <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">DE SAÚDE</span>
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

      {/* LADO DIREITO: Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-105 space-y-10">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic mb-2">
              RODHON<span className="text-blue-600">SYSTEM</span>
            </h2>
            <p className="text-slate-500 font-bold text-sm">Identifique-se para continuar.</p>
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
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-slate-300"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Acessar Painel'}
            </button>
          </form>

          <div className="pt-10 border-t border-slate-100">
             <div className="flex justify-between items-center">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">© 2026 Rodhon Inc.</p>
                {/* BOTÃO ATUALIZADO ABAIXO */}
                <button 
                  onClick={() => setShowSupport(true)} 
                  className="text-[9px] text-blue-600 font-black uppercase tracking-widest hover:underline cursor-pointer"
                >
                  Suporte Técnico
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;