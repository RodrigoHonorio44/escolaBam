import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
      <ShieldAlert size={80} className="text-red-600 mb-4" />
      <h1 className="text-3xl font-bold text-gray-800">Acesso Negado</h1>
      <p className="text-gray-600 mt-2 text-center">
        A sua licença ou nível de acesso não permite visualizar esta página.
      </p>
      <Link 
        to="/" 
        className="mt-6 bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition"
      >
        Voltar para o Início
      </Link>
    </div>
  );
};

export default Unauthorized;