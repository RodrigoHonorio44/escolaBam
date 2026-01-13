import { useEffect, useState } from 'react';
// CORREÇÃO: Caminho relativo estável para o seu ambiente Windows
import { db } from '../../firebase/firebaseConfig'; 
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Users, Trash2, CheckCircle, XCircle, ShieldAlert, Search, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const GestaoUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    // SEGURANÇA MÁXIMA: Filtra 'root' direto na query do Firebase
    const q = query(collection(db, "usuarios"), where("role", "!=", "root"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(docs);
      setLoading(false);
    }, (error) => {
      console.error("Erro Firestore:", error);
      toast.error("Erro na sincronização de dados");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ALTERNAR STATUS (Ativo/Bloqueado)
  const alternarStatus = async (id, statusAtual, nome) => {
    const novoStatus = statusAtual === 'ativo' ? 'bloqueado' : 'ativo';
    // Sincroniza status do usuário com status da licença
    const statusLicenca = novoStatus === 'ativo' ? 'ativa' : 'bloqueada';
    
    try {
      await updateDoc(doc(db, "usuarios", id), { 
        status: novoStatus,
        statusLicenca: statusLicenca
      });
      
      toast.success(`${nome} agora está ${novoStatus}`, {
        icon: novoStatus === 'ativo' ? '✅' : '🚫',
        style: { background: '#0f172a', color: '#fff', borderRadius: '15px' }
      });
    } catch (error) {
      toast.error("Falha ao atualizar permissões");
    }
  };

  // DELETAR USUÁRIO
  const deletarUsuario = async (id, nome) => {
    if (window.confirm(`⚠️ PERIGO: Deseja excluir permanentemente o acesso de ${nome}?`)) {
      const toastId = toast.loading(`Processando remoção...`);
      try {
        await deleteDoc(doc(db, "usuarios", id));
        toast.success(`Acesso removido com sucesso`, { id: toastId });
      } catch (e) {
        toast.error("Erro ao deletar: Verifique suas permissões", { id: toastId });
      }
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.escolaId?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Toaster position="top-right" />
      
      {/* HEADER DE GESTÃO */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg shadow-slate-200">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Controle de Acessos</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Rede Municipal de Maricá</p>
          </div>
        </div>

        {/* CAMPO DE BUSCA */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nome, email ou unidade..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500/20 focus:bg-white font-bold text-xs transition-all shadow-inner"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* LISTAGEM PRINCIPAL */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profissional</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unidade e Cargo</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="3" className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={32} />
                    <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Sincronizando banco...</span>
                  </td>
                </tr>
              ) : usuariosFiltrados.length > 0 ? usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-700 uppercase italic text-sm group-hover:text-blue-600 transition-colors">{u.nome || 'Sem Identificação'}</span>
                      <span className="text-[11px] text-slate-400 font-bold">{u.email}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{u.role?.replace('_', ' ')}</span>
                      <span className="text-[11px] text-slate-500 font-bold uppercase italic">{u.escolaId || 'Sede Central'}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => alternarStatus(u.id, u.status, u.nome)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95
                          ${u.status === 'ativo' 
                            ? 'bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white' 
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 shadow-lg'
                          }`}
                      >
                        {u.status === 'ativo' ? (
                          <><XCircle size={14} /> Bloquear</>
                        ) : (
                          <><CheckCircle size={14} /> Ativar</>
                        )}
                      </button>

                      <button 
                        onClick={() => deletarUsuario(u.id, u.nome)}
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Remover Permanentemente"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="p-20 text-center">
                    <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">Nenhum registro localizado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BANNER DE AUDITORIA */}
      <div className="bg-amber-50/50 border border-amber-200/50 p-6 rounded-[24px] flex items-center gap-5 shadow-sm">
        <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
          <ShieldAlert size={20} />
        </div>
        <p className="text-[10px] text-amber-800 font-black leading-relaxed uppercase tracking-tight opacity-80">
          Auditoria Ativa: Alterações de status são registradas no log do sistema. 
          O bloqueio preserva o histórico do profissional, enquanto a exclusão remove todos os dados permanentemente.
        </p>
      </div>
    </div>
  );
};

export default GestaoUsuarios;