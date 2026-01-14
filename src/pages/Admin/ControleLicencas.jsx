import { useEffect, useState } from 'react';
import { db } from '../../firebase/firebaseConfig'; 
import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { DollarSign, Ban, Zap, ShieldCheck, Loader2, Calendar, Award } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ControleLicencas = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const PRECO_MENSAL = 150.00;

  useEffect(() => {
    const q = query(collection(db, "usuarios"), where("role", "!=", "root"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(lista);
      setLoading(false);
    }, (error) => {
      console.error("Erro Master Panel:", error);
      toast.error("Erro na sincronização");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- FUNÇÃO DE RENOVAÇÃO DINÂMICA ---
  const renovarLicenca = async (id, nome, dias) => {
    try {
      const novaData = new Date();
      novaData.setDate(novaData.getDate() + dias);
      
      await updateDoc(doc(db, "usuarios", id), {
        licencaStatus: 'ativa',
        statusLicenca: 'ativa',
        dataExpiracao: novaData.toISOString(),
        status: 'ativo'
      });
      
      const textoPrazo = dias === 365 ? "1 ANO" : `${dias} DIAS`;
      toast.success(`${nome} renovado por ${textoPrazo}!`, {
        icon: '🚀',
        style: { background: '#0f172a', color: '#fff', borderRadius: '15px' }
      });
    } catch (err) {
      toast.error("Erro ao processar renovação");
    }
  };

  const usuariosAtivos = usuarios.filter(u => 
    u.statusLicenca === 'ativa' || u.licencaStatus === 'ativa' || u.status === 'ativo'
  );
  const faturamentoPrevisto = usuariosAtivos.length * PRECO_MENSAL;

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
        <p className="font-black uppercase text-[10px] tracking-widest animate-pulse">Acessando Camada Master...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Toaster position="top-right" />
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f172a] p-8 rounded-[40px] text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Previsão Mensal (BR)</p>
            <h3 className="text-4xl font-black italic">
              R$ {faturamentoPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <DollarSign className="absolute -right-6 -bottom-6 text-white/5 group-hover:text-blue-500/10 transition-all duration-500 scale-110" size={140} />
        </div>
        
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Licenças Operacionais</p>
          <div className="flex items-center gap-3">
            <h3 className="text-4xl font-black text-slate-800">{usuariosAtivos.length}</h3>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">
              {usuarios.length > 0 ? Math.round((usuariosAtivos.length / usuarios.length) * 100) : 0}% Ativas
            </span>
          </div>
        </div>
      </div>

      {/* PAINEL DE CONTROLE */}
      <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl italic">Controle de Assinaturas</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Gestão Multi-Prazos (30D a 1 Ano)</p>
          </div>
          <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-blue-200">
            <ShieldCheck size={14}/> Root Authorization: Rodrigo
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade / Responsável</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vencimento</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Planos de Renovação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usuarios.map(u => {
                const dataExp = u.dataExpiracao ? new Date(u.dataExpiracao) : null;
                const isVencido = dataExp && dataExp < new Date();
                const statusAtivo = u.statusLicenca === 'ativa' || u.licencaStatus === 'ativa' || u.status === 'ativo';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${statusAtivo ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                          {u.nome?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-black text-slate-700 text-sm uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{u.nome || 'Cadastro Incompleto'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase italic">{u.escolaId || 'Sem Unidade'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center">
                        <div className={`flex items-center gap-1 text-xs font-black px-3 py-1 rounded-xl shadow-sm ${isVencido ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                          <Calendar size={12} />
                          {dataExp ? dataExp.toLocaleDateString('pt-BR') : 'N/A'}
                        </div>
                        <span className={`text-[9px] font-black uppercase italic mt-1.5 tracking-widest ${statusAtivo ? 'text-emerald-500' : 'text-rose-400'}`}>
                          {statusAtivo ? '● Licença Regular' : '○ Acesso Suspenso'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-wrap justify-center gap-2">
                        {/* BOTÕES DE PRAZO */}
                        {[30, 60, 90].map((dias) => (
                          <button 
                            key={dias}
                            onClick={() => renovarLicenca(u.id, u.nome, dias)} 
                            className="group/btn flex items-center gap-1 bg-white border-2 border-slate-100 text-slate-600 px-3 py-2 rounded-xl text-[9px] font-black uppercase hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
                          >
                            <Zap size={10} className="group-hover/btn:animate-pulse" /> {dias}D
                          </button>
                        ))}
                        
                        {/* BOTÃO ESPECIAL 1 ANO */}
                        <button 
                          onClick={() => renovarLicenca(u.id, u.nome, 365)} 
                          className="flex items-center gap-1 bg-amber-50 text-amber-600 border-2 border-amber-100 px-3 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-amber-600 hover:text-white transition-all active:scale-95 shadow-sm"
                        >
                          <Award size={10} /> 1 Ano
                        </button>

                        <div className="w-px h-8 bg-slate-100 mx-1"></div>

                        {/* BOTÃO DE BLOQUEIO */}
                        <button 
                          onClick={() => updateDoc(doc(db, "usuarios", u.id), { statusLicenca: 'bloqueada', status: 'bloqueado' })} 
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Suspender acesso agora"
                        >
                          <Ban size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ControleLicencas;