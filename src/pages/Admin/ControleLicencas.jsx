import { useEffect, useState } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { DollarSign, Clock, CheckCircle, Ban } from 'lucide-react';

const ControleLicencas = () => {
  const [usuarios, setUsuarios] = useState([]);
  const PRECO_MENSAL = 150.00; // Valor base da sua licença

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsuarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const faturamentoPrevisto = usuarios.filter(u => u.licencaStatus === 'ativo').length * PRECO_MENSAL;

  return (
    <div className="space-y-6">
      {/* Dashboard Master de Faturamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-blue-900/20">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Faturamento Estimado</p>
          <div className="flex items-center gap-2">
            <DollarSign className="text-emerald-400" />
            <h3 className="text-3xl font-black">R$ {faturamentoPrevisto.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Acessos Ativos</p>
          <h3 className="text-3xl font-black text-slate-800">{usuarios.filter(u => u.licencaStatus === 'ativo').length}</h3>
        </div>
      </div>

      {/* Lista de Controle com Log de Acesso */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Cliente</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Último Acesso</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Módulos</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <p className="font-bold text-slate-700 text-sm">{u.nome}</p>
                  <p className="text-[10px] text-slate-400">{u.email}</p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Clock size={14} /> {u.lastAccess ? new Date(u.lastAccess).toLocaleDateString() : 'Nunca logou'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-1 flex-wrap">
                    {u.modulos?.map(m => (
                      <span key={m} className="bg-blue-50 text-blue-600 text-[9px] px-2 py-0.5 rounded-md font-black uppercase">{m}</span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => updateDoc(doc(db, "users", u.id), { licencaStatus: 'ativo' })} className="text-emerald-500 hover:bg-emerald-50 p-2 rounded-lg"><CheckCircle size={18} /></button>
                    <button onClick={() => updateDoc(doc(db, "users", u.id), { licencaStatus: 'bloqueado' })} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Ban size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ControleLicencas;