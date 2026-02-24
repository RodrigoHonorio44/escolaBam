import { useEffect, useState, useMemo } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, onSnapshot, query, where, getDocs, writeBatch, doc } from 'firebase/firestore'; 
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast'; 
import * as XLSX from 'xlsx'; // ✅ Importação para Backup
import { 
  Users, ShieldCheck, Activity, Calendar, 
  AlertCircle, ArrowRight, Loader2, Eye, LayoutDashboard, Undo2, Zap, Settings2, Download
} from "lucide-react"; // ✅ Corrigido para lucide-react

// ✅ Componente que será "enganado" pela identidade injetada
import DashboardEnfermeiro from './DashboardEnfermeiro'; 

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, ativos: 0, bloqueados: 0 });
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false); 
  const [modoVisualizacao, setModoVisualizacao] = useState(false);
  
  // ✅ 1. SELETOR DE UNIDADE (Padrão Lowercase para busca no banco)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState({
    id: 'cept-anisio-teixeira',
    nome: 'cept anísio teixeira'
  });

  const unidadesDisponiveis = [
    { id: 'cept-anisio-teixeira', nome: 'cept anísio teixeira' },
    { id: 'em-pioneira', nome: 'e. m. pioneira' },
    { 
      id: 'centro-educacional-joana-benedicta-rangel', 
      nome: 'centro educacional joana benedicta rangel' 
    },
  ];

  // 📥 FUNÇÃO DE BACKUP EM EXCEL (SEGURANÇA ANTES DA MIGRAÇÃO)
  const baixarBackupExcel = async () => {
    const colecoes = ["alunos", "atendimentos_enfermagem", "funcionarios", "pastas_digitais", "questionarios_saude", "usuarios", "tratativas_auditoria"];
    const tid = toast.loading("Gerando backup de segurança...");
    
    try {
      const workbook = XLSX.utils.book_new();
      for (const col of colecoes) {
        const snap = await getDocs(collection(db, col));
        const dadosJson = snap.docs.map(d => ({ 
          id_firebase: d.id, 
          ...d.data() 
        }));

        if (dadosJson.length > 0) {
          const tratados = dadosJson.map(item => {
            const novoItem = { ...item };
            for (let k in novoItem) {
              if (novoItem[k]?.seconds) novoItem[k] = new Date(novoItem[k].seconds * 1000).toLocaleString();
            }
            return novoItem;
          });
          const ws = XLSX.utils.json_to_sheet(tratados);
          XLSX.utils.book_append_sheet(workbook, ws, col);
        }
      }
      XLSX.writeFile(workbook, `backup_medsys_root_${new Date().getTime()}.xlsx`);
      toast.success("Backup baixado com sucesso!", { id: tid });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar backup.", { id: tid });
    }
  };

  // ✅ 2. FUNÇÕES DE CONTROLE DE INSPEÇÃO
  const ativarInspecao = () => {
    localStorage.setItem('inspecao_unidade_nome', unidadeSelecionada.nome.toLowerCase().trim());
    setModoVisualizacao(true);
    toast.success(`Acessando: ${unidadeSelecionada.nome.toUpperCase()}`);
  };

  const desativarInspecao = () => {
    localStorage.removeItem('inspecao_unidade_nome');
    setModoVisualizacao(false);
  };

  // 🚀 FUNÇÃO DE MIGRAÇÃO DINÂMICA (MANUTENÇÃO COM BLINDAGEM DE ID)
  const executarMigracaoDinamica = async () => {
    const { id, nome } = unidadeSelecionada;
    const colecoes = ["alunos", "atendimentos_enfermagem", "funcionarios", "pastas_digitais", "questionarios_saude", "tratativas_auditoria"];

    if (!window.confirm(`MANUTENÇÃO CRÍTICA: Deseja vincular registros à unidade ${id.toUpperCase()}?`)) return;

    setIsMigrating(true);
    const toastId = toast.loading(`Limpando e Vinculando ao: ${nome}...`);

    try {
      for (const nomeCol of colecoes) {
        const snap = await getDocs(collection(db, nomeCol));
        let batch = writeBatch(db);
        let count = 0;

        for (const documento of snap.docs) {
          const data = documento.data();
          const idAntigo = documento.id;

          const nomeLower = (data.nome || data.nomePaciente || data.alunoNome || "").toLowerCase().trim();
          const dataNasc = (data.dataNascimento || "0000").replace(/-/g, '');
          
          const novoId = idAntigo.startsWith(id) 
            ? idAntigo 
            : `${id}-${nomeLower.replace(/\s+/g, '-')}-${dataNasc}`;

          const docNovoRef = doc(db, nomeCol, novoId);
          const docAntigoRef = doc(db, nomeCol, idAntigo);

          const payload = { 
            ...data,
            escolaId: id.toLowerCase(), 
            escola: nome.toLowerCase().trim(),
            unidade: nome.toLowerCase().trim(),
            nome: nomeLower,
            nomeBusca: nomeLower,
            pacienteId: novoId,
            updatedAt: new Date()
          };

          batch.set(docNovoRef, payload);
          if (novoId !== idAntigo) batch.delete(docAntigoRef); 
          
          count++;
          if (count === 400) { 
            await batch.commit(); 
            batch = writeBatch(db); 
            count = 0; 
          }
        }
        if (count > 0) await batch.commit();
      }
      
      const snapUser = await getDocs(collection(db, "usuarios"));
      let batchUser = writeBatch(db);
      snapUser.forEach(d => {
        batchUser.update(doc(db, "usuarios", d.id), { 
          escolaId: id.toLowerCase(), 
          escola: nome.toLowerCase().trim(),
          unidadeId: id.toLowerCase()
        });
      });
      await batchUser.commit();

      toast.success(`Base blindada e sincronizada!`, { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Erro na migração.", { id: toastId });
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "usuarios"), where("role", "!=", "root"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => d.data());
      setStats({
        total: docs.length,
        ativos: docs.filter(d => d.statusLicenca === 'ativa' && d.status === 'ativo').length,
        bloqueados: docs.filter(d => d.statusLicenca === 'bloqueada' || d.status === 'bloqueado').length
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const formatarValidade = (data) => {
    if (!data) return "VITALÍCIO";
    const d = new Date(data);
    return d.getFullYear();
  };

  const nomeExibicao = user?.nome 
    ? user.nome.split(' ')[0].charAt(0).toUpperCase() + user.nome.split(' ')[0].slice(1)
    : 'Admin';

  if (modoVisualizacao) {
    return (
      <div className="relative min-h-screen bg-slate-50">
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase py-1 text-center z-[10000] tracking-widest animate-pulse">
          AMBIENTE DE TESTE ATIVO: {unidadeSelecionada.nome.toUpperCase()}
        </div>
        <button 
          onClick={desativarInspecao}
          className="fixed bottom-8 right-8 z-[10001] bg-rose-600 hover:bg-rose-700 text-white px-8 py-5 rounded-[25px] shadow-2xl flex items-center gap-3 font-black uppercase italic tracking-tighter transition-all hover:scale-105 active:scale-95 border-4 border-white/20"
        >
          <Undo2 size={24} />
          Sair da Unidade
        </button>
        <DashboardEnfermeiro 
          user={{
            ...user, 
            escolaId: unidadeSelecionada.id, 
            escola: unidadeSelecionada.nome.toLowerCase().trim(),
            unidade: unidadeSelecionada.nome.toLowerCase().trim(),
            role: 'enfermeiro'
          }} 
        />
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm">
        <div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">
              Olá, {nomeExibicao}!
            </h2>
            <div className="flex flex-col gap-3 mt-2">
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                Painel de Manutenção Root
              </p>
              
              {/* ✅ BOTÃO AGORA DENTRO DO HEADER PARA NÃO SUMIR */}
              <button 
                onClick={baixarBackupExcel}
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md w-fit"
              >
                <Download size={14} /> Baixar Backup Geral (Excel)
              </button>
            </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col w-full md:w-64">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-2 italic">Unidade Alvo</label>
            <select 
              value={unidadeSelecionada.id}
              onChange={(e) => {
                const item = unidadesDisponiveis.find(u => u.id === e.target.value);
                setUnidadeSelecionada(item);
              }}
              className="bg-slate-100 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer"
            >
              {unidadesDisponiveis.map(u => (
                <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <button 
              onClick={ativarInspecao}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-[11px] uppercase italic tracking-widest hover:bg-blue-600 transition-all shadow-xl"
          >
              <Eye size={18} /> Acessar Unidade
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm group">
          <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Usuários</p>
          <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
            {loading ? <Loader2 className="animate-spin text-slate-200" size={24}/> : stats.total}
          </h3>
        </div>

        <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm group">
          <div className="bg-emerald-500 text-white w-10 h-10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ShieldCheck size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Licenças Ativas</p>
          <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{stats.ativos}</h3>
        </div>

        <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm group">
          <div className="bg-rose-500 text-white w-10 h-10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <AlertCircle size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloqueados</p>
          <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{stats.bloqueados}</h3>
        </div>

        <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm group">
          <div className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Calendar size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato Master</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter mt-1">
            {formatarValidade(user?.dataExpiracao)}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={ativarInspecao}
          className="cursor-pointer bg-blue-600 p-10 rounded-[45px] text-white flex flex-col justify-between min-h-[340px] shadow-2xl relative overflow-hidden group transition-all"
        >
            <div className="z-10 bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
              <LayoutDashboard size={28} className="text-white"/>
            </div>
            <div className="z-10">
              <h3 className="text-4xl font-black italic mb-2 tracking-tighter leading-tight">Entrar na Unidade</h3>
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Testar como: {unidadeSelecionada.nome}</p>
              <div className="mt-8 flex items-center gap-3 text-[11px] font-black uppercase text-white group-hover:gap-5 transition-all">
                Abrir Sistema <ArrowRight size={16}/>
              </div>
            </div>
            <LayoutDashboard size={200} className="absolute -right-12 -bottom-12 text-white/10 rotate-12" />
        </div>

        <Link to="/usuarios" className="bg-[#0f172a] p-10 rounded-[45px] text-white flex flex-col justify-between min-h-[320px] shadow-2xl relative overflow-hidden group">
            <div className="z-10 bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Activity size={24} className="text-blue-400"/>
            </div>
            <div className="z-10">
              <h3 className="text-3xl font-black italic mb-2 tracking-tighter">Gestão Usuários</h3>
              <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-blue-400 group-hover:gap-4 transition-all">
                  Gerenciar Rede <ArrowRight size={14}/>
              </div>
            </div>
        </Link>

        <div 
          onClick={!isMigrating ? executarMigracaoDinamica : null}
          className={`cursor-pointer ${isMigrating ? 'bg-orange-400 animate-pulse' : 'bg-orange-600 hover:bg-orange-700'} p-10 rounded-[45px] text-white flex flex-col justify-between min-h-[320px] shadow-2xl relative overflow-hidden group transition-all`}
        >
            <div className="z-10 bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              {isMigrating ? <Loader2 size={24} className="animate-spin" /> : <Settings2 size={24} className="text-orange-200"/>}
            </div>
            <div className="z-10">
              <h3 className="text-3xl font-black italic mb-2 tracking-tighter leading-tight text-white">Blindar Vínculos</h3>
              <p className="text-orange-100 text-[9px] font-bold uppercase leading-tight mt-2">
                Recriar IDs únicos para: <br/>
                <span className="text-white underline font-black tracking-tighter">{unidadeSelecionada.id}</span>
              </p>
              <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-white group-hover:gap-4 transition-all">
                Sincronizar e Deletar Soltos <ArrowRight size={14}/>
              </div>
            </div>
            <Zap size={180} className="absolute -right-10 -bottom-10 text-white/10 rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;