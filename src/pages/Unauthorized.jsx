import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';

const Unauthorized = () => {
  const navigate = useNavigate();

  // Função para garantir que o usuário saia totalmente se houver erro de permissão persistente
  const handleLogout = async () => {
    localStorage.clear(); // Limpa IDs de inspeção e sessões fantasmas
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-md w-full border border-gray-100">
        <ShieldAlert size={80} className="text-red-500 mb-6 animate-pulse" />
        
        <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">
          Acesso Negado
        </h1>
        
        <p className="text-gray-500 mt-4 text-center leading-relaxed">
          Sua licença atual ou nível de perfil não permite o acesso a este módulo. 
          Certifique-se de estar na unidade correta.
        </p>

        <div className="flex flex-col w-full gap-3 mt-8">
          <Link 
            to="/" 
            className="flex items-center justify-center bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg active:scale-95"
          >
            Voltar para o Dashboard
          </Link>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-gray-400 text-sm font-medium hover:text-red-600 transition-colors mt-2"
          >
            <LogOut size={16} />
            Sair e trocar de conta
          </button>
        </div>

        <p className="mt-8 text-[10px] text-gray-300 font-bold uppercase italic tracking-widest">
          Rodhon Security · System Protection
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;