import React, { useState, useEffect } from 'react';
import { 
  Search, Briefcase, GraduationCap, PlusCircle, ShieldAlert,
  FileSearch, CheckCircle2, ClipboardList, ArrowLeft, 
  X, HeartPulse, FileText, Settings, AlertTriangle,
  Loader2 // Importação adicionada para corrigir a tela branca
} from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { useBuscaPaciente } from '../hooks/useBuscaPaciente'; 

// Componentes de Cadastro
import ModalDetalhesDigital from './ModalDetalhesDigital';
import FormCadastroAluno from '../pages/cadastros/FormCadastroAluno'; 
import FormCadastroFuncionario from '../pages/cadastros/FormCadastroFuncionario'; 
import QuestionarioSaude from '../pages/cadastros/QuestionarioSaude';

const PastaDigital = ({ onVoltar, onNovoAtendimento, alunoParaReabrir }) => {
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [cacheNomes, setCacheNomes] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('geral');
  const [formAtivo, setFormAtivo] = useState(null);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);

  const { buscarDadosCompletos, loading } = useBuscaPaciente();

  // --- FUNÇÕES DE NORMALIZAÇÃO (Padrão Caio Giromba) ---
  const paraBanco = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // Carrega cache para sugestão rápida
  useEffect(() => {
    const carregarCache = async () => {
      try {
        const q = query(collection(db, "pastas_digitais"), orderBy("nomeBusca", "asc"), limit(200));
        const snap = await getDocs(q);
        const nomes = snap.docs.map(d => {
          const data = d.data();
          return {
            nome: paraBanco(data.nome || data.nomeBusca || ''),
            turma: paraBanco(data.tipoPerfil === 'funcionario' ? (data.cargo || 'staff') : (data.turma || data.serie || '---')),
            tipo: paraBanco(data.tipoPerfil || 'aluno')
          };
        }).filter(item => item.nome !== '');
        setCacheNomes(nomes);
      } catch (e) { 
        console.error("erro ao carregar cache:", e); 
      }
    };
    carregarCache();
  }, []);

  // Reabertura automática
  useEffect(() => {
    if (alunoParaReabrir?.nomePaciente || alunoParaReabrir?.nome) {
      const nome = paraBanco(alunoParaReabrir.nomePaciente || alunoParaReabrir.nome);
      setBusca(nome);
      pesquisarPaciente(nome);
    }
  }, [alunoParaReabrir]);

  const pesquisarPaciente = async (nomeForcado) => {
    const termo = paraBanco(nomeForcado || busca);
    if (!termo) return;
    setSugestoes([]);
    try {
      const data = await buscarDadosCompletos(termo);
      if (data) {
        setResultado(data);
      } else {
        toast.error("paciente não encontrado.");
      }
    } catch (e) { 
      toast.error("erro de conexão.");
    }
  };

  const consolidarSaude = () => {
    if (!resultado) return { alertas: [], listaAlergias: [], listaMedicacao: [] };
    
    const p = resultado.perfil || {};
    const s = resultado.saude || {};
    const alertas = [];
    const listaAlergias = [];
    const listaMedicacao = [];
    
    const termosNegativos = ["não", "nao", "n", "nenhuma", "negativo", "-", "não informado", "n/a", "sem", "null", "", "não possui", "nada"];

    const doencas = [
      { id: 'diabetes', label: 'diabetes' },
      { id: 'asma', label: 'asma' },
      { id: 'epilepsia', label: 'epilepsia' },
      { id: 'doencasCardiacas', label: 'cardiopata' }
    ];

    doencas.forEach(d => {
      const status = paraBanco(s[d.id]?.possui || p[d.id]);
      if (status === "sim") {
        const detalhe = paraBanco(s[d.id]?.detalhes);
        alertas.push(!termosNegativos.includes(detalhe) ? `${d.label}: ${detalhe}` : d.label);
      }
    });

    [p.qualAlergia, s.alergias?.detalhes, p.alergias].forEach(val => {
      const normal = paraBanco(val);
      if (normal && !termosNegativos.includes(normal)) {
        if (!listaAlergias.includes(normal)) listaAlergias.push(normal);
      }
    });

    [s.medicacaoContinua?.detalhes, p.medicacao, p.usoMedicamento].forEach(val => {
      const normal = paraBanco(val);
      if (normal && !termosNegativos.includes(normal)) {
        if (!listaMedicacao.includes(normal)) listaMedicacao.push(normal);
      }
    });

    return { alertas, listaAlergias, listaMedicacao };
  };

  const infoSaude = consolidarSaude();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 w-full">
      <Toaster position="top-right" />
      
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-sm">
        <div className="w-full px-8 py-4 flex items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <button onClick={onVoltar} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <ArrowLeft size={24} />
            </button>
            <div className="hidden lg:block">
              <h1 className="text-xl font-black italic tracking-tighter uppercase">
                PASTA<span className="text-blue-600">DIGITAL</span>
              </h1>
            </div>
          </div>

          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-10 text-sm font-bold outline-none focus:ring-2 ring-blue-500/10 focus:bg-white transition-all lowercase"
              placeholder="pesquisar paciente..."
              value={busca}
              onChange={(e) => {
                const v = paraBanco(e.target.value);
                setBusca(v);
                if(v.length > 2) setSugestoes(cacheNomes.filter(p => p.nome.includes(v)));
                else setSugestoes([]);
              }}
              onKeyDown={(e) => e.key === 'Enter' && pesquisarPaciente()}
            />
            {sugestoes.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[110]">
                {sugestoes.slice(0, 5).map((s, i) => (
                  <button key={i} onClick={() => { setBusca(s.nome); pesquisarPaciente(s.nome); }} className="w-full p-4 text-left hover:bg-blue-50 border-b border-slate-50 flex justify-between items-center transition-colors">
                    <span className="font-bold text-xs lowercase">{s.nome}</span>
                    <span className="text-[10px] text-slate-400 font-black lowercase">{s.turma}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {resultado && (
            <button 
              onClick={() => setFormAtivo('atendimento')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
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
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">sincronizando dados...</p>
           </div>
        ) : resultado ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-[35px] flex items-center justify-center mx-auto mb-4 text-slate-400">
                  {resultado.isFuncionario ? <Briefcase size={40} /> : <GraduationCap size={40} />}
                </div>
                <h2 className="text-xl font-black italic leading-tight text-slate-900 lowercase">{resultado.perfil?.nome}</h2>
                <p className="text-[10px] font-black text-blue-600 uppercase mt-2 tracking-widest bg-blue-50 inline-block px-3 py-1 rounded-full">
                  {paraBanco(resultado.isFuncionario ? resultado.perfil?.cargo : `turma ${resultado.perfil?.turma || '---'}`)}
                </p>
                
                <div className="mt-8 space-y-3">
                  <DataBox label="cartão sus" value={resultado.perfil?.cartaoSus} small />
                  <DataBox label="nascimento" value={resultado.perfil?.dataNascimento} small />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-3">documentação</h3>
                <StatusLine label="vacinas" status={paraBanco(resultado.perfil?.vacinaDia) === "sim" || paraBanco(resultado.perfil?.carteiraVacina) === "sim"} />
                <StatusLine label="emergência" status={resultado.perfil?.autorizacaoEmergencia === true || paraBanco(resultado.perfil?.autorizacaoHospitalar) === "sim"} />
              </div>
            </div>

            <div className="lg:col-span-9 space-y-6">
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden h-full">
                <div className="flex bg-slate-50/50 border-b border-slate-100">
                  <TabButton active={abaAtiva === 'geral'} onClick={() => setAbaAtiva('geral')} label="resumo clínico" icon={<FileText size={18}/>} />
                  <TabButton active={abaAtiva === 'historico'} onClick={() => setAbaAtiva('historico')} label="histórico" icon={<ClipboardList size={18}/>} />
                  <button onClick={() => setFormAtivo('perfil')} className="ml-auto px-8 text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-2">
                    <Settings size={16} /> ajustes
                  </button>
                </div>

                <div className="p-10">
                  {abaAtiva === 'geral' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <SectionHeader title="alertas médicos" icon={<ShieldAlert className="text-rose-500"/>} />
                        {infoSaude.alertas.length > 0 ? (
                           <div className="grid gap-3">
                             {infoSaude.alertas.map((a, i) => (
                               <div key={i} className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                 <AlertTriangle size={18} className="text-rose-600 shrink-0"/>
                                 <span className="text-xs font-black text-rose-900 uppercase italic">{a}</span>
                               </div>
                             ))}
                           </div>
                        ) : (
                          <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                             <p className="text-[10px] font-black text-slate-300 uppercase italic">sem doenças crônicas</p>
                          </div>
                        )}

                        <div className="space-y-4">
                           <DataBox label="responsável" value={resultado.perfil?.nomeMae || resultado.perfil?.responsavel} />
                           <DataBox label="contato" value={resultado.perfil?.telefone || resultado.perfil?.contato} />
                        </div>
                      </div>

                      <div className="space-y-8">
                         <SectionHeader title="alergias & farmácia" icon={<HeartPulse className="text-blue-500"/>} />
                         <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-8">
                           <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">alergias detectadas</p>
                               {infoSaude.listaAlergias.length > 0 ? (
                                 <div className="flex flex-wrap gap-2">
                                   {infoSaude.listaAlergias.map((al, idx) => (
                                     <span key={idx} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black text-slate-700 shadow-sm lowercase">{al}</span>
                                   ))}
                                 </div>
                               ) : <p className="text-xs font-bold text-slate-400 italic">sem registro.</p>}
                           </div>

                           <div className="pt-8 border-t border-slate-200">
                               <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">medicação contínua</p>
                               {infoSaude.listaMedicacao.length > 0 ? (
                                 <div className="space-y-2">
                                   {infoSaude.listaMedicacao.map((med, idx) => (
                                     <p key={idx} className="text-xs font-black text-slate-600 italic lowercase">● {med}</p>
                                   ))}
                                 </div>
                               ) : <p className="text-xs font-bold text-slate-400 italic">nenhuma em uso.</p>}
                           </div>
                         </div>

                         <button onClick={() => setFormAtivo('saude')} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
                           VER QUESTIONÁRIO
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
            <p className="mt-6 font-black uppercase tracking-[0.5em] text-sm">aguardando pesquisa...</p>
          </div>
        )}
      </main>

      {/* DRAWER LATERAL */}
      {formAtivo && (
        <div className="fixed inset-0 z-[600] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setFormAtivo(null)} />
          <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500">
             <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10">
                <h2 className="text-lg font-black uppercase italic tracking-tighter">
                  {formAtivo === 'perfil' ? 'ajustes de cadastro' : formAtivo === 'saude' ? 'prontuário de saúde' : 'novo atendimento'}
                </h2>
                <button onClick={() => setFormAtivo(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
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
                  <div className="text-center py-20 bg-blue-50 rounded-[40px] border-2 border-dashed border-blue-200">
                    <p className="font-black text-blue-900 text-lg mb-8 uppercase italic px-10">iniciar triagem para {resultado.perfil?.nome}?</p>
                    <button 
                        onClick={() => { 
                          onNovoAtendimento({ 
                            tipo: resultado.isFuncionario ? 'funcionario' : 'aluno', 
                            dados: resultado.perfil 
                          }); 
                          setFormAtivo(null); 
                        }} 
                        className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition-transform"
                    >
                        CONFIRMAR ENTRADA
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

// SUB-COMPONENTES
const TabButton = ({ active, label, onClick, icon }) => (
  <button onClick={onClick} className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border-b-2 transition-all ${active ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
    {icon} {label}
  </button>
);

const DataBox = ({ label, value, small }) => (
  <div className={`bg-slate-50 border border-slate-100 rounded-2xl text-left ${small ? 'p-3' : 'p-5'}`}>
    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-tighter">{label}</p>
    <p className={`${small ? 'text-[11px]' : 'text-xs'} font-bold text-slate-800 lowercase`}>{value || '---'}</p>
  </div>
);

const StatusLine = ({ label, status }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-[10px] font-black text-slate-500 uppercase">{label}</span>
    {status ? <CheckCircle2 size={18} className="text-emerald-500" /> : <ShieldAlert size={18} className="text-slate-200" />}
  </div>
);

const SectionHeader = ({ title, icon }) => (
  <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
    {icon} {title}
  </h3>
);

const HistoricoTable = ({ atendimentos, onSelect }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-100">
    <table className="w-full text-left text-xs">
      <thead className="bg-slate-50 font-black text-slate-400 uppercase">
        <tr>
          <th className="p-5">data</th>
          <th className="p-5">queixa</th>
          <th className="p-5">status</th>
          <th className="p-5 text-right">ação</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {atendimentos?.length > 0 ? atendimentos.map((atend, i) => (
          <tr key={i} className="hover:bg-slate-50 transition-colors">
            <td className="p-5 font-bold text-slate-600">{atend.dataAtendimento || atend.data}</td>
            <td className="p-5 font-black uppercase italic text-slate-800 lowercase">{atend.queixaPrincipal || atend.motivoAtendimento}</td>
            <td className="p-5">
               <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${atend.horaFinalizacao || atend.horario ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                 {(atend.horaFinalizacao || atend.horario) ? 'concluído' : 'em aberto'}
               </span>
            </td>
            <td className="p-5 text-right">
              <button onClick={() => onSelect(atend)} className="text-blue-600 font-black uppercase hover:underline">ver ficha</button>
            </td>
          </tr>
        )) : <tr><td colSpan="4" className="p-10 text-center text-slate-300 font-black italic">nenhum registro.</td></tr>}
      </tbody>
    </table>
  </div>
);

export default PastaDigital;