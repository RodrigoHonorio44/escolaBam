import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar fixa na esquerda (64px = 16rem) */}
      <Sidebar />

      {/* Área da Direita: Header + Conteúdo + Footer */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* Header no topo da área de conteúdo */}
        <Header />

        {/* Conteúdo principal dinâmico */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Aqui o React Router renderiza as páginas (Dashboard, etc) */}
            <Outlet /> 
          </div>
        </main>

        {/* Footer no final da área de conteúdo */}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;