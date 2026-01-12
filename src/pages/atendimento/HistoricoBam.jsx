import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { Search, Calendar, Filter, Eye } from 'lucide-react';

const HistoricoBam = () => {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Busca as ocorrências ordenadas pela data mais recente
    const q = query(collection(db, "ocorrencias"), orderBy("dataOcorrencia", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOcorrencias(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtro em tempo real por nome do aluno
  const filteredOcorrencias = ocorrencias.filter(oc => 
    oc.aluno_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Histórico de Atendimentos (BAM)</h1>
        <p className="text-gray-500">Consulte e faça a gestão de todos os boletins registados.</p>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome do aluno..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition">
          <Filter size={18} />
          Filtros Avançados
        </button>
      </div>

      {/* Tabela de Ocorrências */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                <th className="p-4 font-semibold">Data/Hora</th>
                <th className="p-4 font-semibold">Aluno</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400">Carregando dados...</td></tr>
              ) : filteredOcorrencias.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400">Nenhuma ocorrência encontrada.</td></tr>
              ) : (
                filteredOcorrencias.map((oc) => (
                  <tr key={oc.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-sm text-gray-600 flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(oc.dataOcorrencia)}
                    </td>
                    <td className="p-4 font-medium text-gray-800">{oc.aluno_nome}</td>
                    <td className="p-4">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800 uppercase">
                        {oc.tipo}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        oc.status === 'pendente' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {oc.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 transition p-1" title="Ver detalhes">
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoricoBam;