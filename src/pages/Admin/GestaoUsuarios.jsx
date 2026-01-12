import { useEffect, useState } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Users, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const GestaoUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const alternarStatus = async (id, statusAtual) => {
    const novoStatus = statusAtual === 'ativo' ? 'bloqueado' : 'ativo';
    try {
      await updateDoc(doc(db, "users", id), { licencaStatus: novoStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const deletarUsuario = async (id) => {
    if (window.confirm("⚠️ EXCLUIR DEFINITIVAMENTE? Esta ação não pode ser desfeita.")) {
      await deleteDoc(doc(db, "users", id));
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Controle de Acessos</h2>
          <p className="text-slate-500 text-sm font-medium">Gerencie quem pode entrar no Rodhon System.</p>
        </div>
        <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-100">
          <Users size={24} />
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Unidade</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações de Segurança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{u.nome}</span>
                      <span className="text-xs text-slate-400">{u.email}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-blue-600 uppercase">{u.role}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{u.escolaId || 'Sede'}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-center gap-4">
                      
                      {/* BOTÃO ÚNICO DINÂMICO */}
                      {u.licencaStatus === 'ativo' ? (
                        <button 
                          onClick={() => alternarStatus(u.id, u.licencaStatus)}
                          className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <XCircle size={14} /> BLOQUEAR ACESSO
                        </button>
                      ) : (
                        <button 
                          onClick={() => alternarStatus(u.id, u.licencaStatus)}
                          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        >
                          <CheckCircle size={14} /> DESBLOQUEAR
                        </button>
                      )}

                      {/* BOTÃO DELETAR */}
                      <button 
                        onClick={() => deletarUsuario(u.id)}
                        className="p-2.5 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                        title="Remover permanentemente"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestaoUsuarios;