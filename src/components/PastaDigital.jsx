import React, { useState, useEffect } from 'react';
import { 
  Search, User, Briefcase, GraduationCap, Clock, 
  ChevronRight, FileText, AlertCircle, Calendar, 
  MapPin, Activity, Loader2, ArrowLeft, PlusCircle, ShieldAlert,
  ChevronLeft, X, Heart, Thermometer, Info, Phone, Stethoscope, Syringe
} from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { useBuscaPaciente } from '../hooks/useBuscaPaciente'; 

// ✅ PROPS ATUALIZADAS PARA O PADRÃO DO DASHBOARD
const PastaDigital = ({ onVoltar, onNovoAtendimento }) => {
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [cacheNomes, setCacheNomes] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const itensPorPagina = 5;

  const { buscarDadosCompletos, loading } = useBuscaPaciente();

  useEffect(() => {
    const carregarNomesRecentes = async () => {
      try {
        const q = query(collection(db, "atendimentos_enfermagem"), orderBy("createdAt", "desc"), limit(100));
        const snap = await getDocs(q);
        const nomes = snap.docs.map(d => ({
          nome: d.data().nomePaciente || '',
          turma: d.data().turma || ''
        })).filter(item => item.nome !== '');
        const unicos = nomes.filter((v, i, a) => a.findIndex(t => t.nome === v.nome) === i);
        setCacheNomes(unicos);
      } catch (e) { console.error("Erro cache:", e); }
    };
    carregarNomesRecentes();
  }, []);

  const pesquisarPaciente = async (nomeSelecionado) => {
    const nomeFinal = nomeSelecionado || busca;
    if (!nomeFinal.trim()) return;
    setSugestoes([]);
    setPaginaAtual(1);
    const data = await buscarDadosCompletos(nomeFinal);
    if (data) {
      setResultado(data);
      toast.success("Sincronização concluída!");
    } else {
      toast.error("Paciente não encontrado");
    }
  };

  // ✅ FUNÇÃO CORRIGIDA: AGORA CHAMA onNovoAtendimento
  const handleAcaoRegistro = () => {
    if (!resultado?.dadosParaForm) return;

    const d = resultado.dadosParaForm;
    const camposVazios = [];

    if (!d.cartaoSus) camposVazios.push("CARTÃO SUS");
    if (!d.dataNascimento && !d.nascimento) camposVazios.push("DATA NASCIMENTO");
    
    if (!resultado.isFuncionario && !d.responsavel) {
      camposVazios.push("RESPONSÁVEL");
    }

    if (camposVazios.length > 0) {
      toast((t) => (
        <span className="flex flex-col gap-1">
          <b className="text-orange-400 font-black text-[10px] uppercase flex items-center gap-1">
            <AlertCircle size={12}/> Campos Pendentes!
          </b>
          <span className="text-[9px] font-bold text-slate-200">
            Faltam: {camposVazios.join(", ")}
          </span>
          <span className="text-[8px] italic text-blue-400">Complete no formulário de cadastro.</span>
        </span>
      ), {
        duration: 4000,
        style: { background: '#020617', color: '#fff', borderRadius: '20px', border: '1px solid #1e293b' }
      });
    }

    // ✅ DISPARA O SINAL PARA O DASHBOARD ABRIR O FORMULÁRIO
    setTimeout(() => {
      onNovoAtendimento({
        tipo: resultado.isFuncionario ? 'FUNCIONARIO' : 'ALUNO',
        dados: d
      });
    }, 600);
  };

  const totalPaginas = resultado ? Math.ceil(resultado.atendimentos.length / itensPorPagina) : 0;
  const atendimentosPaginados = resultado ? resultado.atendimentos.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina) : [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans bg-slate-50/50 min-h-screen">
      <Toaster position="top-center" />
      
      {/* HEADER DE BUSCA */}
      <div className="bg-[#020617] rounded-[40px] p-8 text-white mb-8 shadow-2xl border-b-4 border-blue-600">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col">
            <button onClick={onVoltar} className="flex items-center gap-2 text-slate-500 hover:text-blue-400 text-[10px] font-black uppercase mb-2">
              <ArrowLeft size={14} /> Painel Principal
            </button>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Prontuário <span className="text-blue-600">Digital</span></h2>
          </div>
          
          <div className="flex flex-1 max-w-2xl w-full gap-2 relative">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="BUSCAR NOME DO ALUNO OU FUNCIONÁRIO..."
                className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 px-12 text-sm font-bold focus:bg-white focus:text-slate-900 outline-none uppercase transition-all"
                value={busca}
                onChange={(e) => {
                  const val = e.target.value;
                  setBusca(val);
                  if(val.length > 2) {
                    setSugestoes(cacheNomes.filter(p => p.nome.toLowerCase().includes(val.toLowerCase())));
                  } else setSugestoes([]);
                }}
                onKeyDown={(e) => e.key === 'Enter' && pesquisarPaciente()}
              />
              {sugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-[100] overflow-hidden border border-slate-100">
                  {sugestoes.slice(0, 5).map((s, i) => (
                    <div key={i} onClick={() => { setBusca(s.nome); pesquisarPaciente(s.nome); }} className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 flex justify-between items-center transition-colors">
                      <span className="font-black text-xs text-slate-900 uppercase">{s.nome}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-black uppercase">{s.turma}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => pesquisarPaciente()} className="bg-blue-600 px-8 rounded-2xl font-black text-xs uppercase italic hover:bg-blue-700 transition-all flex items-center justify-center min-w-[140px] shadow-lg">
              {loading ? <Loader2 className="animate-spin" /> : 'Sincronizar'}
            </button>
          </div>
        </div>
      </div>

      {resultado && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm text-center relative overflow-hidden">
              {resultado.statusClinico.alergias === "Sim" && (
                <div className="absolute top-0 inset-x-0 bg-red-600 text-white text-[8px] font-black uppercase py-1 animate-pulse flex items-center justify-center gap-1">
                  <ShieldAlert size={10} /> Alergias Detectadas
                </div>
              )}
              <div className={`w-24 h-24 rounded-[32px] mx-auto flex items-center justify-center mb-4 mt-2 shadow-2xl ${resultado.isFuncionario ? 'bg-slate-900' : 'bg-blue-600'} text-white`}>
                {resultado.isFuncionario ? <Briefcase size={48} /> : <GraduationCap size={48} />}
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic leading-tight">{resultado.dadosParaForm.nome}</h3>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                {resultado.isFuncionario ? (resultado.perfil?.cargo || 'FUNCIONÁRIO') : `TURMA ${resultado.dadosParaForm.turma}`}
              </p>
              
              <div className="mt-6 space-y-2 text-left bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <InfoRow label="Cartão SUS" value={resultado.dadosParaForm.cartaoSus} icon={<FileText size={10}/>} />
                <InfoRow label="Nascimento" value={resultado.saude?.dataNascimento || resultado.perfil?.nascimento || 'Não informado'} icon={<Calendar size={10}/>} />
                {!resultado.isFuncionario && <InfoRow label="Responsável" value={resultado.perfil?.responsavel} icon={<User size={10}/>} />}
              </div>

              {/* ✅ BOTÃO QUE AGORA DISPARA A AÇÃO CORRETA */}
              <button onClick={handleAcaoRegistro} className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg">
                <PlusCircle size={16} /> {resultado.dadosParaForm.isEdicao ? 'Atualizar Dados' : 'Criar Cadastro'}
              </button>
            </div>

            <Section title="Contatos de Emergência">
              <div className="space-y-3">
                {resultado.saude?.contatos?.length > 0 ? resultado.saude.contatos.map((c, i) => (
                  <div key={i} className="flex flex-col border-b border-slate-50 pb-2 last:border-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase">{c.parentesco || 'Contato'}</span>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 uppercase">{c.nome}</span>
                      <a href={`tel:${c.telefone}`} className="text-xs font-black text-blue-600 hover:underline">{c.telefone}</a>
                    </div>
                  </div>
                )) : <p className="text-[10px] text-slate-400 font-bold uppercase italic text-center">Nenhum contato salvo</p>}
              </div>
            </Section>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Histórico Clínico">
                <div className="grid grid-cols-2 gap-3">
                  <HealthStatusBadge label="Asma" status={resultado.statusClinico.asma} />
                  <HealthStatusBadge label="Diabetes" status={resultado.statusClinico.diabetes} />
                  <HealthStatusBadge label="Cardíaco" status={resultado.statusClinico.cardiaco} />
                  <HealthStatusBadge label="Epilepsia" status={resultado.statusClinico.epilepsia} />
                </div>
              </Section>

              <Section title="Alergias e Restrições">
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl border-2 ${resultado.statusClinico.alergias === "Sim" ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                    <p className="text-[9px] font-black text-red-400 uppercase flex items-center gap-1"><AlertCircle size={10}/> Alergias</p>
                    <p className="text-xs font-black text-red-700 uppercase italic mt-1">{resultado.statusClinico.alergias_detalhes}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50/50">
                    <p className="text-[9px] font-black text-orange-400 uppercase">Restrição Alimentar</p>
                    <p className="text-xs font-black text-orange-700 uppercase italic mt-1">{resultado.statusClinico.restricoes}</p>
                  </div>
                </div>
              </Section>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DocStatus label="Vacinação" status={resultado.saude?.vacinaAtualizada} />
                <DocStatus label="Atestado Físico" status={resultado.saude?.atestadoAtividadeFisica} />
                <DocStatus label="Medicamento" status={resultado.saude?.medicacaoContinua?.possui || "Não"} />
                <DocStatus label="Emergência" status={resultado.saude?.autorizacaoEmergencia ? 'Autorizado' : 'Não'} highlight />
            </div>

            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-lg font-black uppercase italic flex items-center gap-2 text-slate-900">
                  <Stethoscope className="text-blue-600" size={24} /> Histórico de Atendimentos
                </h4>
                <div className="flex items-center gap-3">
                    <button onClick={() => setPaginaAtual(p => Math.max(1, p-1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={18}/></button>
                    <span className="text-[10px] font-black uppercase text-slate-400">{paginaAtual} de {totalPaginas || 1}</span>
                    <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p+1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={18}/></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50">
                    <tr className="text-[9px] font-black text-slate-400 uppercase text-left">
                      <th className="px-8 py-4">Data / Hora</th>
                      <th className="px-8 py-4">Motivo / Queixa</th>
                      <th className="px-8 py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {atendimentosPaginados.map((atend) => (
                      <tr key={atend.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="text-xs font-black text-slate-800">{atend.dataAtendimento}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{atend.horario}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${atend.encaminhadoHospital === 'sim' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                            <span className="text-xs font-black text-slate-700 uppercase italic truncate max-w-xs">{atend.motivoAtendimento}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => setAtendimentoSelecionado(atend)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-600 transition-all">Ver Ficha</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {atendimentoSelecionado && (
        <div className="fixed inset-0 z-[200] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-xl h-full rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black text-blue-500 uppercase">Documento Oficial</span>
                    <h3 className="text-xl font-black italic uppercase">{atendimentoSelecionado.baenf}</h3>
                  </div>
                  <button onClick={() => setAtendimentoSelecionado(null)} className="p-2 hover:bg-red-500 rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                     <VitalCard icon={<Thermometer size={14} className="text-orange-500"/>} label="TEMP" value={`${atendimentoSelecionado.temperatura || '--'}°C`} />
                     <VitalCard icon={<Clock size={14} className="text-blue-500"/>} label="HORA" value={atendimentoSelecionado.horario} />
                     <VitalCard icon={<MapPin size={14} className="text-green-500"/>} label="DESTINO" value={atendimentoSelecionado.destinoHospital || 'Escola'} />
                  </div>
                  <Section title="Evolução do Caso">
                     <p className="text-sm font-black text-slate-800 uppercase italic mb-2">{atendimentoSelecionado.motivoAtendimento}</p>
                     <div className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-600 font-bold uppercase leading-relaxed">
                        {atendimentoSelecionado.observacoes || "Nenhuma observação."}
                     </div>
                  </Section>
                  <Section title="Procedimentos Realizados">
                     <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-[11px] text-blue-900 font-black uppercase italic">
                        {atendimentoSelecionado.procedimentos || "Não informados."}
                     </div>
                  </Section>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Profissional Responsável</p>
                    <p className="text-xs font-black text-slate-900 uppercase italic">{atendimentoSelecionado.profissionalNome}</p>
                  </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTES AUXILIARES
const Section = ({ title, children }) => (
  <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
      <div className="w-1 h-3 bg-blue-600 rounded-full"></div> {title}
    </h4>
    {children}
  </div>
);

const HealthStatusBadge = ({ label, status }) => (
  <div className={`p-3 rounded-2xl border ${status === 'Sim' ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'}`}>
    <div className="flex justify-between items-center">
      <span className="text-[9px] font-black text-slate-400 uppercase">{label}</span>
      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${status === 'Sim' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {status === 'Sim' ? 'SIM' : 'NÃO'}
      </span>
    </div>
  </div>
);

const DocStatus = ({ label, status, highlight }) => (
  <div className={`p-4 rounded-[24px] border ${highlight ? 'bg-blue-600 text-white border-blue-400 shadow-lg' : 'bg-white border-slate-200'}`}>
    <p className={`text-[8px] font-black uppercase mb-1 ${highlight ? 'text-blue-200' : 'text-slate-400'}`}>{label}</p>
    <p className="text-[10px] font-black uppercase italic">{status === 'Sim' || status === true || status === 'Autorizado' ? 'SIM' : 'NÃO'}</p>
  </div>
);

const InfoRow = ({ label, value, icon }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-200/50 last:border-none">
    <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">{icon}{label}</span>
    <span className="text-[10px] font-black text-slate-700 uppercase italic truncate max-w-[140px]">{value || '---'}</span>
  </div>
);

const VitalCard = ({ icon, label, value }) => (
  <div className="bg-slate-50 p-3 rounded-2xl flex flex-col items-center gap-1 border border-slate-100 shadow-sm text-center">
    <div className="p-1.5 bg-white rounded-lg shadow-sm mb-1">{icon}</div>
    <p className="text-[7px] font-black text-slate-400 uppercase">{label}</p>
    <p className="text-[10px] font-black text-slate-800 uppercase italic">{value}</p>
  </div>
);

export default PastaDigital;