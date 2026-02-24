import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Briefcase, GraduationCap, PlusCircle, ShieldAlert,
  FileSearch, CheckCircle2, ClipboardList, ArrowLeft, 
  X, HeartPulse, FileText, Settings, AlertTriangle,
  Loader2, ShieldCheck, Phone
} from 'lucide-react';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { useBuscaPaciente } from '../hooks/useBuscaPaciente'; 

// Componentes de Cadastro
import ModalDetalhesDigital from './ModalDetalhesDigital';
import FormCadastroAluno from '../pages/cadastros/FormCadastroAluno'; 
import FormCadastroFuncionario from '../pages/cadastros/FormCadastroFuncionario'; 
import QuestionarioSaude from '../pages/cadastros/QuestionarioSaude';

const PastaDigital = ({ user, onVoltar, onNovoAtendimento, alunoParaReabrir }) => {
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [cacheNomes, setCacheNomes] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('geral');
  const [formAtivo, setFormAtivo] = useState(null);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);

  const { buscarDadosCompletos, loading } = useBuscaPaciente();

  // --- UTILS DE FORMATAÇÃO (PADRÃO CAIO GIROMBA) ---
  const paraBanco = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const formatarNomeRS = (str) => {
    if (!str || str === '---') return '---';
    return str.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  // --- CARREGAMENTO DE CACHE COM ISOLAMENTO DE UNIDADE ---
  useEffect(() => {
    const carregarCache = async () => {
      try {
        const isRoot = user?.role === 'root' || user?.email === "rodrigohono21@gmail.com";
        const modoInspecao = localStorage.getItem('modo_inspecao') === 'true';
        let q;

        if (isRoot && !modoInspecao) {
          q = query(collection(db, "pastas_digitais"), orderBy("nomeBusca", "asc"), limit(200));
        } else {
          q = query(
            collection(db, "pastas_digitais"), 
            where("escolaId", "==", user?.escolaId?.toLowerCase()), 
            orderBy("nomeBusca", "asc"), 
            limit(200)
          );
        }

        const snap = await getDocs(q);
        const nomes = snap.docs.map(d => {
          const data = d.data();
          return {
            nome: data.nome || data.nomeBusca || '',
            turma: data.tipoPerfil === 'funcionario' ? (data.cargo || 'staff') : (data.turma || data.serie || '---'),
            tipo: data.tipoPerfil || 'aluno'
          };
        }).filter(item => item.nome !== '');
        setCacheNomes(nomes);
      } catch (e) { 
        console.error("Erro ao carregar cache:", e); 
      }
    };
    carregarCache();
  }, [user]);

  // Reabertura automática quando vem do Dashboard
  useEffect(() => {
    if (alunoParaReabrir?.nome || alunoParaReabrir?.nomeBusca) {
      const nomeParaPesquisa = alunoParaReabrir.nome || alunoParaReabrir.nomeBusca;
      setBusca(formatarNomeRS(nomeParaPesquisa));
      pesquisarPaciente(nomeParaPesquisa);
    }
  }, [alunoParaReabrir]);

  const pesquisarPaciente = async (nomeForcado) => {
    const termo = paraBanco(nomeForcado || busca);
    if (!termo || termo.length < 3) return;
    
    setSugestoes([]);
    try {
      const data = await buscarDadosCompletos(termo);
      if (data) {
        setResultado(data);
        setAbaAtiva('geral');
      } else {
        toast.error("Paciente não encontrado.");
      }
    } catch (e) { 
      toast.error("Erro de conexão.");
    }
  };

  // --- CONSOLIDAÇÃO DE DADOS DE SAÚDE (OBJETOS FIREBASE) ---
  const infoSaude = useMemo(() => {
    if (!resultado) return { alertas: [], listaAlergias: [], listaMedicacao: [], statusDoc: { vacinas: false, emergencia: false } };
    
    const p = resultado.perfil || {};
    const s = resultado.saude || {};
    const alertas = [];
    const listaAlergias = [];
    const listaMedicacao = [];
    const termosNegativos = ["não", "nao", "n", "nenhuma", "negativo", "-", "não informado", "n/a", "sem", "null", "", "não possui", "nada"];

    // Mapeamento de condições crônicas
    const camposSaude = [
      { id: 'diabetes', label: 'Diabetes' },
      { id: 'asma', label: 'Asma' },
      { id: 'epilepsia', label: 'Epilepsia' },
      { id: 'doencasCardiacas', label: 'Cardiopatia' },
      { id: 'diagnosticoNeuro', label: 'Neuro/PCD' }
    ];

    camposSaude.forEach(item => {
      const obj = s[item.id];
      if (obj?.possui === "sim" || paraBanco(p[item.id]) === "sim") {
        const detalhe = obj?.detalhes || obj?.tipo || "";
        alertas.push(detalhe && !termosNegativos.includes(paraBanco(detalhe)) ? `${item.label}: ${detalhe}` : item.label);
      }
    });

    // Alergias
    const alergiasTexto = s.alergias?.detalhes || p.qualAlergia || p.alergias;
    if (alergiasTexto && !termosNegativos.includes(paraBanco(alergiasTexto))) {
      alergiasTexto.split(/[\s,]+/).forEach(a => {
        if (a.length > 2) listaAlergias.push(a.toLowerCase());
      });
    }

    // Medicação
    const medTexto = s.medicacaoContinua?.detalhes || p.medicacao || p.usoMedicamento;
    if (medTexto && !termosNegativos.includes(paraBanco(medTexto))) {
      listaMedicacao.push(medTexto.toLowerCase());
    }

    return { 
      alertas, 
      listaAlergias, 
      listaMedicacao,
      statusDoc: {
        vacinas: s.vacinaStatus === "atualizado" || s.vacinaAtualizada === "sim" || paraBanco(p.vacinaDia) === "sim",
        emergencia: (s.contatos && s.contatos.length > 0) || (!!p.responsavel || !!p.telefone)
      }
    };
  }, [resultado]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 w-full pb-20">
      <Toaster position="top-right" />
      
      {/* HEADER DE BUSCA */}
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-sm">
        <div className="w-full px-8 py-4 flex items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <button onClick={onVoltar} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <ArrowLeft size={24} />
            </button>
            <h1 className="hidden lg:block text-xl font-black italic tracking-tighter uppercase">
              PASTA<span className="text-blue-600">DIGITAL</span>
            </h1>
          </div>

          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-10 text-sm font-bold outline-none focus:ring-2 ring-blue-500/10 focus:bg-white transition-all uppercase"
              placeholder="PESQUISAR PACIENTE..."
              value={busca}
              onChange={(e) => {
                const v = e.target.value;
                setBusca(v);
                const termo = paraBanco(v);
                if(termo.length > 2) {
                  setSugestoes(cacheNomes.filter(p => paraBanco(p.nome).includes(termo)).slice(0, 5));
                } else setSugestoes([]);
              }}
              onKeyDown={(e) => e.key === 'Enter' && pesquisarPaciente()}
            />
            {sugestoes.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[110] animate-in fade-in zoom-in-95 duration-200">
                {sugestoes.map((s, i) => (
                  <button key={i} onClick={() => { setBusca(formatarNomeRS(s.nome)); pesquisarPaciente(s.nome); }} className="w-full p-4 text-left hover:bg-blue-50 border-b border-slate-50 flex justify-between items-center">
                    <span className="font-bold text-xs">{formatarNomeRS(s.nome)}</span>
                    <span className="text-[9px] bg-slate-100 px-2 py-1 rounded font-black text-slate-400 uppercase">{s.turma}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {resultado && (
            <button 
              onClick={() => setFormAtivo('atendimento')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 shadow-lg"
            >
              <PlusCircle size={18} /> NOVO ATENDIMENTO
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-40">
             <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Sincronizando prontuário digital...</p>
           </div>
        ) : resultado ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* COLUNA ESQUERDA: PERFIL */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[35px] flex items-center justify-center mx-auto mb-4 text-blue-600 border-2 border-slate-100">
                  {resultado.isFuncionario ? <Briefcase size={40} /> : <GraduationCap size={40} />}
                </div>
                <h2 className="text-xl font-black italic leading-tight text-slate-900 uppercase">{formatarNomeRS(resultado.perfil?.nome)}</h2>
                <p className="text-[10px] font-black text-blue-600 uppercase mt-3 tracking-widest bg-blue-50 inline-block px-4 py-1.5 rounded-full italic">
                  {resultado.isFuncionario ? formatarNomeRS(resultado.perfil?.cargo) : `turma ${resultado.perfil?.turma || '---'}`}
                </p>
                
                <div className="mt-8 space-y-3">
                  <DataBox label="cartão sus" value={resultado.perfil?.cartaoSus} small />
                  <DataBox label="nascimento" value={resultado.perfil?.dataNascimento} small />
                  <DataBox label="unidade" value={resultado.perfil?.escola || user?.escola} small />
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-3 italic">Checklist Documental</h3>
                <StatusLine label="Vacinas" status={infoSaude.statusDoc.vacinas} />
                <StatusLine label="Contatos Emergência" status={infoSaude.statusDoc.emergencia} />
              </div>
            </div>

            {/* COLUNA DIREITA: DADOS CLÍNICOS */}
            <div className="lg:col-span-9 space-y-6">
              <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                <div className="flex bg-slate-50/50 border-b border-slate-100">
                  <TabButton active={abaAtiva === 'geral'} onClick={() => setAbaAtiva('geral')} label="resumo clínico" icon={<FileText size={18}/>} />
                  <TabButton active={abaAtiva === 'historico'} onClick={() => setAbaAtiva('historico')} label="histórico" icon={<ClipboardList size={18}/>} />
                  <button onClick={() => setFormAtivo('perfil')} className="ml-auto px-8 text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-2 transition-colors">
                    <Settings size={16} /> editar cadastro
                  </button>
                </div>

                <div className="p-10">
                  {abaAtiva === 'geral' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <SectionHeader title="condições de risco" icon={<ShieldAlert className="text-rose-500"/>} />
                        {infoSaude.alertas.length > 0 ? (
                           <div className="grid gap-3">
                             {infoSaude.alertas.map((a, i) => (
                               <div key={i} className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                 <AlertTriangle size={18} className="text-rose-600 shrink-0"/>
                                 <span className="text-[11px] font-black text-rose-900 uppercase italic">{a}</span>
                               </div>
                             ))}
                           </div>
                        ) : (
                          <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                             <p className="text-[10px] font-black text-slate-300 uppercase italic">Nenhuma doença crônica relatada</p>
                          </div>
                        )}

                        <div className="space-y-4 pt-4">
                           <SectionHeader title="emergência" icon={<Phone className="text-slate-400" size={16}/>} />
                           {(resultado.saude?.contatos || []).length > 0 ? (
                             resultado.saude.contatos.map((cont, idx) => (
                               <DataBox 
                                 key={idx}
                                 label={cont.parentesco || "contato"} 
                                 value={`${formatarNomeRS(cont.nome)} • ${cont.telefone}`} 
                               />
                             ))
                           ) : (
                             <DataBox label="Responsável Principal" value={`${formatarNomeRS(resultado.perfil?.responsavel || resultado.perfil?.nomeMae)} • ${resultado.perfil?.telefone || 'sem telefone'}`} />
                           )}
                        </div>
                      </div>

                      <div className="space-y-8">
                         <SectionHeader title="alergias & fármacos" icon={<HeartPulse className="text-blue-500"/>} />
                         <div className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 space-y-8">
                           <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Alergias Detectadas</p>
                               {infoSaude.listaAlergias.length > 0 ? (
                                 <div className="flex flex-wrap gap-2">
                                   {infoSaude.listaAlergias.map((al, idx) => (
                                     <span key={idx} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black text-slate-700 shadow-sm uppercase italic">{al}</span>
                                   ))}
                                 </div>
                               ) : <p className="text-xs font-bold text-slate-400 italic">Sem registros de alergias.</p>}
                           </div>

                           <div className="pt-8 border-t border-slate-200">
                               <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Medicação Contínua</p>
                               {infoSaude.listaMedicacao.length > 0 ? (
                                 <div className="space-y-2">
                                   {infoSaude.listaMedicacao.map((med, idx) => (
                                     <p key={idx} className="text-xs font-black text-slate-600 italic uppercase flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {med}
                                     </p>
                                   ))}
                                 </div>
                               ) : <p className="text-xs font-bold text-slate-400 italic">Nenhum medicamento em uso.</p>}
                           </div>
                         </div>

                         <button onClick={() => setFormAtivo('saude')} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                           ACESSAR QUESTIONÁRIO DE SAÚDE COMPLETO
                         </button>
                      </div>
                    </div>
                  ) : (
                    <HistoricoTable atendimentos={resultado.atendimentos} onSelect={setAtendimentoSelecionado} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 opacity-20">
            <FileSearch size={100} strokeWidth={1} />
            <p className="mt-6 font-black uppercase tracking-[0.5em] text-sm italic">Aguardando pesquisa de paciente...</p>
          </div>
        )}
      </main>

      {/* PAINEL LATERAL (DRAWERS) */}
      {formAtivo && (
        <div className="fixed inset-0 z-[600] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setFormAtivo(null)} />
          <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-slate-200">
             <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10">
                <h2 className="text-lg font-black uppercase italic tracking-tighter">
                  {formAtivo === 'perfil' ? 'Ajustes de Cadastro' : formAtivo === 'saude' ? 'Prontuário de Saúde' : 'Confirmar Atendimento'}
                </h2>
                <button onClick={() => setFormAtivo(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
             </div>
             <div className="p-8">
                {formAtivo === 'perfil' && (
                  resultado.isFuncionario 
                  ? <FormCadastroFuncionario onClose={() => {setFormAtivo(null); pesquisarPaciente();}} dadosEdicao={resultado.perfil} modoPastaDigital={true} />
                  : <FormCadastroAluno onVoltar={() => {setFormAtivo(null); pesquisarPaciente();}} dadosEdicao={resultado.perfil} modoPastaDigital={true} />
                )}
                {formAtivo === 'saude' && (
                  <QuestionarioSaude 
                    onClose={() => {setFormAtivo(null); pesquisarPaciente();}} 
                    dadosEdicao={resultado.saude || {}} 
                    pacienteSelecionado={{ id: resultado.id, nome: resultado.perfil?.nome, tipo: resultado.isFuncionario ? 'funcionario' : 'aluno' }}
                    modoPastaDigital={true} 
                  />
                )}
                {formAtivo === 'atendimento' && (
                  <div className="text-center py-20 bg-blue-50/50 rounded-[40px] border-2 border-dashed border-blue-200">
                    <p className="font-black text-blue-900 text-xl mb-8 uppercase italic px-10">Iniciar triagem para {formatarNomeRS(resultado.perfil?.nome)}?</p>
                    <button 
                        onClick={() => { 
                          onNovoAtendimento({ 
                            tipo: resultado.isFuncionario ? 'funcionario' : 'aluno', 
                            dados: resultado.perfil 
                          }); 
                          setFormAtivo(null); 
                        }} 
                        className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black uppercase text-xs shadow-2xl hover:scale-105 transition-all active:scale-95"
                    >
                        CONFIRMAR ENTRADA NA ENFERMARIA
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {atendimentoSelecionado && (
        <ModalDetalhesDigital atendimento={atendimentoSelecionado} onClose={() => setAtendimentoSelecionado(null)} />
      )}
    </div>
  );
};

// --- SUB-COMPONENTES AUXILIARES ---
const TabButton = ({ active, label, onClick, icon }) => (
  <button onClick={onClick} className={`px-8 py-7 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border-b-2 transition-all ${active ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
    {icon} {label}
  </button>
);

const DataBox = ({ label, value, small }) => (
  <div className={`bg-slate-50 border border-slate-100 rounded-2xl text-left ${small ? 'p-3' : 'p-5'}`}>
    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-tighter">{label}</p>
    <p className={`${small ? 'text-[11px]' : 'text-xs'} font-bold text-slate-800 uppercase`}>{value || '---'}</p>
  </div>
);

const StatusLine = ({ label, status }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 mb-2">
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{label}</span>
    {status ? (
      <ShieldCheck size={20} className="text-emerald-500 fill-emerald-50" />
    ) : (
      <div className="flex items-center gap-2 text-slate-300">
        <span className="text-[8px] font-black uppercase">Pendente</span>
        <ShieldAlert size={20} />
      </div>
    )}
  </div>
);

const SectionHeader = ({ title, icon }) => (
  <h3 className="text-[11px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-2 italic">
    {icon} {title}
  </h3>
);

const HistoricoTable = ({ atendimentos, onSelect }) => (
  <div className="overflow-hidden rounded-[32px] border border-slate-100">
    <table className="w-full text-left text-xs">
      <thead className="bg-slate-50 font-black text-slate-400 uppercase italic">
        <tr>
          <th className="p-6">Data</th>
          <th className="p-6">Queixa Principal</th>
          <th className="p-6">Status</th>
          <th className="p-6 text-right">Ação</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {atendimentos?.length > 0 ? atendimentos.map((atend, i) => (
          <tr key={i} className="hover:bg-slate-50/80 transition-colors">
            <td className="p-6 font-bold text-slate-600">{atend.dataAtendimento || atend.data}</td>
            <td className="p-6 font-black uppercase italic text-slate-800">{atend.queixaPrincipal || atend.motivoAtendimento}</td>
            <td className="p-6">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${atend.horaFinalizacao || atend.horario ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                  {(atend.horaFinalizacao || atend.horario) ? 'Concluído' : 'Em Aberto'}
                </span>
            </td>
            <td className="p-6 text-right">
              <button onClick={() => onSelect(atend)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-600 transition-colors">Ver Ficha</button>
            </td>
          </tr>
        )) : <tr><td colSpan="4" className="p-20 text-center text-slate-300 font-black italic uppercase tracking-widest">Nenhum registro de atendimento localizado.</td></tr>}
      </tbody>
    </table>
  </div>
);

export default PastaDigital;