import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginService } from '../api/authService';
import { Lock, Mail, Stethoscope } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await loginService(email, password);
      navigate('/');
    } catch (err) {
      setError('Falha na identificação. Verifique seus dados.');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white">
      
      {/* LADO ESQUERDO: INFOMATIVO (AZUL) */}
      <div className="hidden md:flex md:w-[45%] bg-blue-600 p-16 flex-col justify-center text-white relative">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10 bg-white/10 w-fit p-4 rounded-2xl backdrop-blur-md border border-white/20">
            <Stethoscope size={40} strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-lg leading-tight tracking-tight uppercase">Conde Modesto Leal</h3>
              <p className="text-xs font-medium opacity-70">HMCML UNIDADE DE TI</p>
            </div>
          </div>

          <h1 className="text-7xl font-[1000] leading-[0.85] mb-8 tracking-tighter uppercase italic">
            PATRIMÔNIO <br /> 
            <span className="text-blue-200/80">& CHAMADOS</span>
          </h1>

          <p className="text-xl opacity-90 leading-relaxed max-w-md font-medium">
            Plataforma inteligente para gestão de ativos e suporte técnico hospitalar.
          </p>
        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO (ESTRUTURA CORRIGIDA) */}
      <div className="flex-1 flex flex-col justify-between items-center p-8 bg-slate-50">
        
        {/* LOGO SUPERIOR (FORA DO CARD) */}
        <div className="mt-4 text-center">
            <h2 className="text-3xl font-[1000] italic tracking-tighter text-slate-900 leading-none">
                RODHON<span className="text-blue-600">SYSTEM</span>
            </h2>
            <p className="text-[10px] tracking-[0.4em] text-slate-400 font-black uppercase mt-1">Technology Solutions</p>
        </div>

        {/* CARD DO FORMULÁRIO (CENTRALIZADO) */}
        <div className="w-full max-w-[460px] bg-white p-10 md:p-12 rounded-[50px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100">
          <div className="text-center mb-10">
            <span className="text-[11px] font-black tracking-[0.2em] text-slate-300 uppercase">Identificação de Usuário</span>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold border border-red-100 text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase ml-2 tracking-wider">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="email"
                  className="w-full pl-14 pr-6 py-5 bg-slate-100/80 border-none rounded-[22px] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-800 font-bold placeholder:text-slate-400"
                  placeholder="rodrigohono21@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase ml-2 tracking-wider">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="password"
                  className="w-full pl-14 pr-6 py-5 bg-slate-100/80 border-none rounded-[22px] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-800 font-bold"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-5 rounded-[22px] font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/10 active:scale-[0.98] mt-4"
            >
              Acessar Sistema
            </button>
          </form>
        </div>

        {/* FOOTER (NO FUNDO) */}
        <div className="mb-4">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] text-center">
                © 2026 RODHON SYSTEM | Unidade Hospitalar
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;