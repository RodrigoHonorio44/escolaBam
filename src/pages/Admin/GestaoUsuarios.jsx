import { useEffect, useState } from 'react';
import { db } from '../../firebase/firebaseConfig'; 
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, deleteField, serverTimestamp, addDoc } from 'firebase/firestore'; 
import { 
  Users, Trash2, CheckCircle, XCircle, Search, 
  LayoutDashboard, UserRound, Stethoscope, ClipboardList, Lock, FolderSearch,
  LogOut, HeartPulse, BarChart3 
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

  const derrubarSessao = async (id, nome) => {
    if (window.confirm(`Deseja desconectar a sessão ativa de ${nome}?`)) {
      try {
        await updateDoc(doc(db, "usuarios", id), {
          currentSessionId: "" 
        });
        registrarLog(nome, "Sessão encerrada forçadamente pelo Admin");
        toast.success(`Sessão de ${nome} encerrada!`, {
          icon: '🔌',
          style: { background: '#0f172a', color: '#fff' }
        });
      } catch (error) {
        toast.error("Erro ao derrubar sessão");
      }
    }
  };

  const toggleModulo = async (userId, modulo, valorAtual) => {
    const usuarioAlvo = usuarios.find(u => u.id === userId);
    try {
      const updates = {
        [`modulosSidebar.${modulo}`]: !valorAtual,
        currentSessionId: usuarioAlvo?.currentSessionId || ""
      };
      if (modulo === 'relatorios') { updates['modulosSidebar.triagem'] = deleteField(); }
      
      await updateDoc(doc(db, "usuarios", userId), updates);
      toast.success(`Módulo atualizado`);
    } catch (error) { toast.error("Erro ao alterar módulo"); }
  };

  // FUNÇÃO ATUALIZADA AQUI
  const alternarStatus = async (id, statusAtual, nome) => {
    const novoStatus = statusAtual === 'ativo' ? 'bloqueado' : 'ativo';
    const textoLicenca = novoStatus === 'ativo' ? 'ativa' : 'bloqueada';
    const liberado = novoStatus === 'ativo';
    const usuarioAlvo = usuarios.find(u => u.id === id);
    
    // Se estiver bloqueando, mata a sessão na hora
    const sessaoAtualizada = novoStatus === 'ativo' ? (usuarioAlvo?.currentSessionId || "") : "";
    
    try {
      await updateDoc(doc(db, "usuarios", id), { 
        "status": novoStatus,
        "statusLicenca": textoLicenca, // Atualiza campo 1
        "licencaStatus": textoLicenca, // Atualiza campo 2 (conforme seu log)
        "currentSessionId": sessaoAtualizada,
        "modulosSidebar.dashboard": liberado,
        "modulosSidebar.atendimento": liberado,
        "modulosSidebar.pasta_digital": liberado,
        "modulosSidebar.pacientes": liberado,
        "modulosSidebar.relatorios": liberado,
        "modulosSidebar.saude_escolar": liberado, 
        "modulosSidebar.triagem": deleteField() 
      });
      
      registrarLog(nome, `Alterou status para ${novoStatus}`);
      toast.success(`${nome} agora está ${novoStatus}`, {
        icon: novoStatus === 'ativo' ? '✅' : '🚫'
      });
    } catch (error) { 
      console.error("Erro ao atualizar:", error);
      toast.error("Falha ao atualizar"); 
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
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-slate-900 text-white p-4 rounded-2xl"><Users size={28} /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic">Controle de Acessos</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestão de Sessões e Permissões</p>
          </div>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Buscar profissional..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs shadow-inner"
            value={filtro} onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional / Status</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acesso aos Módulos</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações de Segurança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="3" className="p-20 text-center text-slate-400">Carregando base...</td></tr>
              ) : usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <span className="font-black text-slate-700 uppercase italic text-sm">{u.nome}</span>
                         {u.currentSessionId && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sessão Ativa"></span>}
                      </div>
                      <span className="text-[10px] text-blue-500 font-bold uppercase">{u.escolaId || 'Sem Unidade'}</span>
                      {/* Badge Visual do Status da Licença */}
                      <span className={`text-[8px] font-black uppercase mt-1 ${u.statusLicenca === 'ativa' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        Licença: {u.statusLicenca}
                      </span>
                    </div>
                  </td>

                  <td className="p-6 text-center">
                    <div className="flex justify-center gap-2">
                      <ModuloBtn label="Dash" icon={<LayoutDashboard size={16} />} ativo={u.modulosSidebar?.dashboard} onClick={() => toggleModulo(u.id, 'dashboard', u.modulosSidebar?.dashboard)} />
                      <ModuloBtn label="Atend" icon={<Stethoscope size={16} />} ativo={u.modulosSidebar?.atendimento} onClick={() => toggleModulo(u.id, 'atendimento', u.modulosSidebar?.atendimento)} />
                      <ModuloBtn label="Saúde" icon={<HeartPulse size={16} />} ativo={u.modulosSidebar?.saude_escolar} onClick={() => toggleModulo(u.id, 'saude_escolar', u.modulosSidebar?.saude_escolar)} />
                      <ModuloBtn label="Pasta" icon={<FolderSearch size={16} />} ativo={u.modulosSidebar?.pasta_digital} onClick={() => toggleModulo(u.id, 'pasta_digital', u.modulosSidebar?.pasta_digital)} />
                      <ModuloBtn label="Cads" icon={<UserRound size={16} />} ativo={u.modulosSidebar?.pacientes} onClick={() => toggleModulo(u.id, 'pacientes', u.modulosSidebar?.pacientes)} />
                      <ModuloBtn label="BAENF" icon={<ClipboardList size={16} />} ativo={u.modulosSidebar?.relatorios ?? u.modulosSidebar?.triagem} onClick={() => toggleModulo(u.id, 'relatorios', u.modulosSidebar?.relatorios ?? u.modulosSidebar?.triagem)} />
                    </div>
                  </td>

                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        disabled={!u.currentSessionId}
                        onClick={() => derrubarSessao(u.id, u.nome)}
                        className={`p-2.5 rounded-xl transition-all ${u.currentSessionId ? 'bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white' : 'bg-slate-50 text-slate-200 cursor-not-allowed'}`}
                        title="Desconectar Máquina"
                      >
                        <LogOut size={16} />
                      </button>

                      <button 
                        onClick={() => alternarStatus(u.id, u.status, u.nome)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all
                          ${u.status === 'ativo' ? 'bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white' : 'bg-emerald-500 text-white'}
                        `}
                      >
                        {u.status === 'ativo' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        {u.status === 'ativo' ? 'Bloquear' : 'Ativar'}
                      </button>

                      <button onClick={() => deletarUsuario(u.id, u.nome)} className="p-2 text-slate-300 hover:text-rose-600 transition-all">
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
    onClick={onClick} title={label}
    className={`p-2 rounded-xl border-2 transition-all duration-300 ${ativo ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-300'}`}
  >
    {ativo ? icon : <Lock size={16} />}
  </button>
);

export default GestaoUsuarios;