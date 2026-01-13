import { useEffect, useState } from 'react';
import { db, auth } from '../firebase/firebaseConfig'; // Correto (C maiúsculo)
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { History, Search, FileText, Calendar, User, ArrowRight } from 'lucide-react';

const HistoricoAtendimentos = ({ user }) => {
  const [atendimentos, setAtendimentos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarHistorico = async () => {
      try {
        setLoading(true);
        // Busca atendimentos filtrados pela unidade do usuário logado
        const q = query(
          collection(db, "atendimentos"),
          where("escolaId", "==", user.escolaId),
          orderBy("dataAtendimento", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        setAtendimentos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.escolaId) buscarHistorico();
  }, [user.escolaId]);

  const filtrados = atendimentos.filter(a => 
    a.pacienteNome?.toLowerCase().includes(filtro.toLowerCase()) ||
    a.pacienteId?.includes(filtro)
  );

  // Função para formatar a data de forma segura
  const formatarData = (data) => {
    if (!data) return "Data N/A";
    // Se for Timestamp do Firebase
    if (data.seconds) return new Date(data.seconds * 1000).toLocaleDateString();
    // Se for String ou Date padrão
    return new Date(data).toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER E BUSCA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase italic flex items-center gap-3 tracking-tighter">
            <History className="text-blue-600" size={32} /> Histórico Geral
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-11">
            {user.escolaId}
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Nome do paciente ou CPF..." 
            className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold text-xs transition-all"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional Responsável</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.length > 0 ? filtrados.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar size={16} className="text-slate-300 mb-1" />
                      <span className="font-black text-slate-700 text-xs">{formatarData(item.dataAtendimento)}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 uppercase text-sm italic tracking-tight">{item.pacienteNome}</p>
                        <p className="text-[10px] text-slate-400 font-bold">ID: {item.pacienteId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600/10 text-blue-700 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase italic border border-blue-100">
                        {item.profissionalNome || 'Não informado'}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <button className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-90 shadow-sm">
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="p-32 text-center">
                    {loading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando Histórico...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <History size={48} />
                        <span className="font-black text-xs uppercase tracking-[0.3em]">Nenhum atendimento registrado</span>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* RODAPÉ INFORMATIVO */}
      <div className="flex justify-between items-center px-6">
         <p className="text-[10px] font-bold text-slate-400 uppercase italic">
           Total de registros nesta unidade: {atendimentos.length}
         </p>
         <button className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 hover:underline">
           Exportar Relatório Mensal <ArrowRight size={14} />
         </button>
      </div>
    </div>
  );
};

export default HistoricoAtendimentos;