import { useEffect, useState } from 'react';
import { db } from '../../firebase/firebaseConfig'; 
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, deleteField, serverTimestamp, addDoc } from 'firebase/firestore'; 
import { 
  Users, Trash2, CheckCircle, XCircle, Search, 
  LayoutDashboard, UserRound, Stethoscope, ClipboardList, Lock, FolderSearch 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const GestaoUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const q = query(collection(db, "usuarios"), where("role", "!=", "root"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const registrarLog = async (usuarioNome, acao) => {
    try {
      await addDoc(collection(db, "logs_gestao"), {
        admin: "Rodrigo Root",
        usuarioAfetado: usuarioNome,
        acao: acao,
        data: serverTimestamp()
      });
    } catch (e) { console.error("Erro ao salvar log"); }
  };

  const toggleModulo = async (userId, modulo, valorAtual) => {
    const usuarioAlvo = usuarios.find(u => u.id === userId);
    try {
      // Usando notação de ponto para evitar erros com campos aninhados
      const updates = {
        [`modulosSidebar.${modulo}`]: !valorAtual,
        currentSessionId: usuarioAlvo?.currentSessionId || ""
      };

      if (modulo === 'relatorios') {
        updates['modulosSidebar.triagem'] = deleteField();
      }

      await updateDoc(doc(db, "usuarios", userId), updates);
      toast.success(`Módulo atualizado`);
    } catch (error) {
      toast.error("Erro ao alterar módulo");
    }
  };

  const alternarStatus = async (id, statusAtual, nome) => {
    const novoStatus = statusAtual === 'ativo' ? 'bloqueado' : 'ativo';
    const statusLicenca = novoStatus === 'ativo' ? 'ativa' : 'bloqueada';
    const liberado = novoStatus === 'ativo';
    const usuarioAlvo = usuarios.find(u => u.id === id);
    const sessaoAtual = usuarioAlvo?.currentSessionId || "";
    
    try {
      // ✅ CORREÇÃO: Usando chaves diretas (dot notation) para permitir o deleteField()
      await updateDoc(doc(db, "usuarios", id), { 
        "status": novoStatus,
        "statusLicenca": statusLicenca,
        "currentSessionId": sessaoAtual,
        "modulosSidebar.dashboard": liberado,
        "modulosSidebar.atendimento": liberado,
        "modulosSidebar.pasta_digital": liberado,
        "modulosSidebar.pacientes": liberado,
        "modulosSidebar.relatorios": liberado,
        "modulosSidebar.triagem": deleteField() 
      });
      
      registrarLog(nome, `Alterou status para ${novoStatus}`);
      
      toast.success(`${nome} agora está ${novoStatus}`, {
        icon: novoStatus === 'ativo' ? '✅' : '🚫',
        style: { background: '#0f172a', color: '#fff', borderRadius: '15px' }
      });
    } catch (error) {
      console.error("Erro Firebase:", error);
      toast.error("Falha ao atualizar permissões");
    }
  };

  const deletarUsuario = async (id, nome) => {
    if (window.confirm(`⚠️ PERIGO: Excluir permanentemente ${nome}?`)) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        toast.success(`Acesso removido`);
      } catch (e) { toast.error("Erro ao deletar"); }
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.escolaId?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Toaster position="top-right" />
      
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-slate-900 text-white p-4 rounded-2xl"><Users size={28} /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic">Controle de Acessos</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Painel Administrativo</p>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar profissional..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs shadow-inner"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trava de Módulos</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gestão de Conta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="3" className="p-20 text-center text-slate-400">Carregando usuários...</td></tr>
              ) : usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-700 uppercase italic text-sm">{u.nome}</span>
                      <span className="text-[10px] text-blue-500 font-bold uppercase">{u.escolaId || 'Sem Unidade'}</span>
                    </div>
                  </td>

                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <ModuloBtn label="Dashboard" icon={<LayoutDashboard size={16} />} ativo={u.modulosSidebar?.dashboard} onClick={() => toggleModulo(u.id, 'dashboard', u.modulosSidebar?.dashboard)} />
                      <ModuloBtn label="Atendimento" icon={<Stethoscope size={16} />} ativo={u.modulosSidebar?.atendimento} onClick={() => toggleModulo(u.id, 'atendimento', u.modulosSidebar?.atendimento)} />
                      <ModuloBtn label="Pasta Digital" icon={<FolderSearch size={16} />} ativo={u.modulosSidebar?.pasta_digital} onClick={() => toggleModulo(u.id, 'pasta_digital', u.modulosSidebar?.pasta_digital)} />
                      <ModuloBtn label="Cadastros" icon={<UserRound size={16} />} ativo={u.modulosSidebar?.pacientes} onClick={() => toggleModulo(u.id, 'pacientes', u.modulosSidebar?.pacientes)} />
                      <ModuloBtn label="BAMs Antigos" icon={<ClipboardList size={16} />} ativo={u.modulosSidebar?.relatorios ?? u.modulosSidebar?.triagem} onClick={() => toggleModulo(u.id, 'relatorios', u.modulosSidebar?.relatorios ?? u.modulosSidebar?.triagem)} />
                    </div>
                  </td>

                  <td className="p-6">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => alternarStatus(u.id, u.status, u.nome)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all
                          ${u.status === 'ativo' ? 'bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white' : 'bg-emerald-500 text-white'}
                        `}
                      >
                        {u.status === 'ativo' ? <><XCircle size={14} /> Suspender</> : <><CheckCircle size={14} /> Reativar</>}
                      </button>
                      <button onClick={() => deletarUsuario(u.id, u.nome)} className="p-3 text-slate-300 hover:text-rose-600 transition-all">
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

const ModuloBtn = ({ icon, ativo, onClick, label }) => (
  <button 
    onClick={onClick}
    title={label}
    className={`p-2.5 rounded-xl border-2 transition-all duration-300 ${
      ativo 
        ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' 
        : 'border-slate-100 bg-slate-50 text-slate-300'
    }`}
  >
    {ativo ? icon : <Lock size={16} />}
  </button>
);

export default GestaoUsuarios;