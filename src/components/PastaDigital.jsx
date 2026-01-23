import React, { useState, useEffect } from 'react';
import { 
  Search, Briefcase, GraduationCap, PlusCircle, ShieldAlert,
  Edit3, FileSearch, CheckCircle2, ClipboardList, ArrowLeft, 
  Loader2, X, HeartPulse, User, FileText, Settings, AlertTriangle
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

  useEffect(() => {
    const carregarCache = async () => {
      try {
        const q = query(collection(db, "pastas_digitais"), orderBy("nome", "asc"), limit(200));
        const snap = await getDocs(q);
        const nomes = snap.docs.map(d => ({
          nome: d.data().nome || '',
          turma: d.data().tipoPerfil === 'funcionario' ? (d.data().cargo || 'Staff') : (d.data().turma || d.data().serie),
          tipo: d.data().tipoPerfil
        })).filter(item => item.nome !== '');
        setCacheNomes(nomes);
      } catch (e) { console.error("Erro ao carregar cache:", e); }
    };
    carregarCache();
  }, []);

  useEffect(() => {
    if (alunoParaReabrir?.nomePaciente || alunoParaReabrir?.nome) {
      const nome = alunoParaReabrir.nomePaciente || alunoParaReabrir.nome;
      setBusca(nome);
      pesquisarPaciente(nome);
    }
  }, [alunoParaReabrir]);

  const pesquisarPaciente = async (nomeForcado) => {
    const termo = nomeForcado || busca;
    if (!termo.trim()) return;
    setSugestoes([]);
    try {
      const data = await buscarDadosCompletos(termo);
      if (data) {
        setResultado(data);
      } else {
        toast.error("Paciente não encontrado no sistema.");
      }
    } catch (e) { 
      toast.error("Erro ao conectar com o banco de dados.");
    }
  };

  const consolidarSaude = () => {
    if (!resultado) return { alertas: [], listaAlergias: [], listaMedicacao: [], restricoes: [], necessidades: [] };
    const p = resultado.perfil || {};
    const s = resultado.saude || {};
    const alertas = [];
    const listaAlergias = [];
    const listaMedicacao = [];
    const restricoes = [];
    const necessidades = [];
    const normalizar = (txt) => txt?.toString().toLowerCase().trim();
    const termosNegativos = ["não", "nao", "n", "nenhuma", "negativo", "-", "não informado", "n/a", "sem", "null", ""];
    const doencas = [
      { id: 'diabetes', label: 'DIABETES' },
      { id: 'asma', label: 'ASMA' },
      { id: 'epilepsia', label: 'EPILEPSIA' },
      { id: 'doencasCardiacas', label: 'CARDIOPATA' }
    ];
    doencas.forEach(d => {
      if (s[d.id]?.possui === "Sim" || p[d.id] === "Sim") {
        const detalhe = s[d.id]?.detalhes;
        alertas.push(detalhe && !termosNegativos.includes(normalizar(detalhe)) ? `${d.label}: ${detalhe}` : d.label);
      }
    });
    const fontesAlergia = [p.qualAlergia, s.alergias?.detalhes];
    fontesAlergia.forEach(val => {
      if (val && !termosNegativos.includes(normalizar(val))) {
        if (!listaAlergias.includes(val)) listaAlergias.push(val);
      }
    });
    if (s.restricoesAlimentares?.detalhes && !termosNegativos.includes(normalizar(s.restricoesAlimentares.detalhes))) {
        restricoes.push(s.restricoesAlimentares.detalhes);
    }
    if (s.necessidadesEspeciais?.detalhes && !termosNegativos.includes(normalizar(s.necessidadesEspeciais.detalhes))) {
        necessidades.push(s.necessidadesEspeciais.detalhes);
    }
    const fontesMed = [s.medicacaoContinua?.detalhes, p.medicacao];
    fontesMed.forEach(val => {
      if (val && !termosNegativos.includes(normalizar(val))) {
        if (!listaMedicacao.includes(val)) listaMedicacao.push(val);
      }
    });
    return { alertas, listaAlergias, listaMedicacao, restricoes, necessidades };
  };

  const infoSaude = consolidarSaude();

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-slate-800 w-full overflow-x-hidden">
      <Toaster position="top-right" />
      
      {/* HEADER ATUALIZADA: SAIU AZUL ESCURO, ENTROU CLARO */}
      <header className="sticky top-0 z-[100] bg-white text-slate-900 shadow-md w-full border-b border-slate-200">
        <div className="w-full px-8 py-6 flex items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <button onClick={onVoltar} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-blue-600 border border-slate-100">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic hidden lg:block">
              DIGITAL<span className="text-blue-600">ARCHIVE</span>
            </h1>
          </div>

          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
            <input 
              type="text"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-16 text-lg font-black outline-none focus:bg-white focus:ring-2 ring-blue-500/20 transition-all uppercase placeholder:text-slate-400 tracking-tight"
              placeholder="BUSCAR NOME DO PACIENTE..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                if(e.target.value.length > 2) setSugestoes(cacheNomes.filter(p => p.nome.toLowerCase().includes(e.target.value.toLowerCase())));
                else setSugestoes([]);
              }}
              onKeyDown={(e) => e.key === 'Enter' && pesquisarPaciente()}
            />
            {loading && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={20} />}
            
            {sugestoes.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-900 border border-slate-200">
                {sugestoes.slice(0, 5).map((s, i) => (
                  <div key={i} onClick={() => { setBusca(s.nome); pesquisarPaciente(s.nome); }} className="p-5 hover:bg-blue-50 cursor-pointer border-b border-slate-50 flex justify-between items-center">
                    <span className="font-black text-sm uppercase italic">{s.nome}</span>
                    <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-lg font-black uppercase">{s.turma}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {resultado && (
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-5 border-l border-slate-200 pl-8">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                  {resultado.isFuncionario ? <Briefcase size={28} /> : <GraduationCap size={28} />}
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-xl font-black uppercase italic leading-none text-slate-900">{resultado.perfil?.nome || resultado.nome}</h2>
                  <p className="text-[10px] text-blue-600 font-black uppercase mt-2 tracking-widest">
                    {resultado.isFuncionario ? resultado.perfil?.cargo : `TURMA ${resultado.perfil?.turma || '---'}`}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setFormAtivo('atendimento')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95"
              >
                <PlusCircle size={20} /> NOVO ATENDIMENTO
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="w-full p-8">
        {resultado ? (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500 min-h-[70vh]">
            <nav className="flex px-10 border-b border-slate-100 bg-slate-50/50">
              <TabButton active={abaAtiva === 'geral'} onClick={() => setAbaAtiva('geral')} label="VISÃO GERAL" icon={<FileText size={20}/>} />
              <TabButton active={abaAtiva === 'historico'} onClick={() => setAbaAtiva('historico')} label="HISTÓRICO DE CONSULTAS" icon={<ClipboardList size={20}/>} />
              <div className="ml-auto flex items-center">
                <button onClick={() => setFormAtivo('perfil')} className="text-xs font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-2 transition-colors px-6">
                  <Settings size={20} /> EDITAR CADASTRO
                </button>
              </div>
            </nav>

            <div className="p-12">
              {abaAtiva === 'geral' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                  <div className="space-y-10">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-3 border-l-4 border-blue-500 pl-4">
                      <User size={18}/> DADOS PESSOAIS
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <DataBox label="CARTÃO DO SUS" value={resultado.perfil?.cartaoSus} />
                      <DataBox label="DATA DE NASCIMENTO" value={resultado.perfil?.dataNascimento} />
                      <DataBox label="RESPONSÁVEL / CONTATO" value={resultado.perfil?.nomeMae || resultado.perfil?.responsavel} />
                      <DataBox label="TELEFONE EMERGÊNCIA" value={resultado.perfil?.telefone || resultado.perfil?.contato} />
                    </div>
                  </div>

                  <div className="space-y-10">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-3 border-l-4 border-slate-800 pl-4">
                      <HeartPulse size={18} className="text-slate-800"/> CONDIÇÕES DE SAÚDE
                    </h3>
                    <div className="space-y-6">
                      <div className="flex flex-col gap-3">
                        {infoSaude.alertas.map((a, i) => (
                           <div key={i} className="flex items-center gap-3">
                             <AlertTriangle size={16} className="text-red-500 shrink-0"/>
                             <span className="text-sm font-black text-slate-600 uppercase italic tracking-tight">
                               {a}
                             </span>
                           </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-4">
                        {infoSaude.listaAlergias.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">ALERGIAS</p>
                            {infoSaude.listaAlergias.map((al, idx) => (
                              <p key={idx} className="text-sm font-black text-slate-600 uppercase italic">● {al}</p>
                            ))}
                          </div>
                        )}
                        {infoSaude.listaMedicacao.length > 0 && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">MEDICAÇÃO CONTÍNUA</p>
                            {infoSaude.listaMedicacao.map((med, idx) => (
                              <p key={idx} className="text-sm font-black text-slate-600 uppercase italic">● {med}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      <button onClick={() => setFormAtivo('saude')} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-3xl text-xs font-black text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all uppercase italic">
                        ABRIR QUESTIONÁRIO DE SAÚDE COMPLETO
                      </button>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                      <CheckCircle2 size={18}/> STATUS DOCUMENTAL
                    </h3>
                    <div className="space-y-4">
                       <StatusLine label="VACINAÇÃO EM DIA" status={resultado.perfil?.vacinaDia === "Sim" || resultado.perfil?.carteiraVacina === "Sim"} />
                       <StatusLine label="AUTORIZAÇÃO HOSPITALAR" status={resultado.perfil?.autorizacaoEmergencia === true || resultado.perfil?.autorizacaoHospitalar === "Sim"} />
                       <StatusLine label="FICHA MÉDICA PREENCHIDA" status={!!resultado.saude} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-xs font-black text-slate-400 uppercase">
                        <th className="px-8 py-6">DATA / HORÁRIOS</th>
                        <th className="px-8 py-6">QUEIXA PRINCIPAL</th>
                        <th className="px-8 py-6">CONDUTA / STATUS</th>
                        <th className="px-8 py-6 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {resultado.atendimentos?.length > 0 ? resultado.atendimentos.map((atend, i) => {
                        const statusTexto = (atend.statusAtendimento || "").toLowerCase();
                        const estaAberto = statusTexto.includes("aberto") || statusTexto.includes("aguardando") || !atend.horaFinalizacao;
                        const foiParaHospital = atend.destinoHospital?.toLowerCase().includes("hospital") || atend.tipoRegistro === "hospital";
                        const queixaDisplay = atend.queixaPrincipal || atend.motivoAtendimento || "NÃO INFORMADA";
                        const hInicio = atend.horaInicio || atend.horario || atend.horarioReferencia || "--:--";
                        const hFim = atend.horaFinalizacao || null;

                        return (
                          <tr key={i} className={`hover:bg-blue-50/30 transition-colors ${estaAberto ? 'bg-orange-50/30' : ''}`}>
                            <td className="px-8 py-8 text-sm font-bold text-slate-600">
                              <div className="flex flex-col gap-1">
                                <span className="tabular-nums">{atend.dataAtendimento}</span>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-black">
                                    INÍCIO: {hInicio}
                                  </span>
                                  {hFim && (
                                    <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded text-blue-600 font-black">
                                      FIM: {hFim}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-8 py-8">
                              <div className="flex flex-col gap-1">
                                <span className="text-base font-black text-slate-800 uppercase italic tracking-tight">
                                  {queixaDisplay}
                                </span>
                                {estaAberto && (
                                  <span className="flex items-center gap-1 text-[9px] font-black text-orange-600 uppercase italic">
                                    <AlertTriangle size={12} className="animate-pulse" /> Aguardando Desfecho
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-8 py-8">
                               <div className="flex flex-col gap-2">
                                  <span className={`text-[10px] font-black px-4 py-2 rounded-xl border w-fit ${
                                    estaAberto 
                                      ? 'bg-white text-orange-500 border-orange-200' 
                                      : foiParaHospital 
                                        ? 'bg-orange-50 text-orange-600 border-orange-200' 
                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                  }`}>
                                    {estaAberto ? 'STATUS: EM ABERTO' : foiParaHospital ? 'ENCAMINHADO HOSPITAL' : 'ALTA AMBULATORIAL'}
                                  </span>
                               </div>
                            </td>

                            <td className="px-8 py-8 text-right">
                              <button 
                                onClick={() => setAtendimentoSelecionado(atend)} 
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 transition-all shadow-md active:scale-95"
                              >
                                {estaAberto ? 'DETALHAR' : 'VER FICHA'}
                              </button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan="4" className="p-20 text-center font-black text-slate-300 uppercase italic">Nenhum atendimento registrado nesta pasta</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-52 text-center">
             <FileSearch size={80} className="text-slate-100 mx-auto mb-8" />
             <p className="text-slate-400 font-black uppercase italic text-sm tracking-[0.4em]">INFORME O NOME PARA ACESSAR A PASTA DIGITAL</p>
          </div>
        )}
      </main>

      {formAtivo && (
        <div className="fixed inset-0 z-[600] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setFormAtivo(null)} />
          <div className="relative w-full max-w-5xl bg-white shadow-2xl h-full overflow-y-auto animate-in slide-in-from-right duration-500">
             <div className="p-8 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                  {formAtivo === 'perfil' && 'Ajustes de Registro'}
                  {formAtivo === 'saude' && 'Ficha de Saúde Completa'}
                  {formAtivo === 'atendimento' && 'Abertura de Atendimento'}
                </h2>
                <button onClick={() => setFormAtivo(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X size={32}/></button>
             </div>
             <div className="p-8">
                {formAtivo === 'perfil' && (
                  resultado.isFuncionario 
                  ? <FormCadastroFuncionario onClose={() => {setFormAtivo(null); pesquisarPaciente();}} dadosEdicao={resultado.perfil || resultado} modoPastaDigital={true} />
                  : <FormCadastroAluno onVoltar={() => {setFormAtivo(null); pesquisarPaciente();}} dadosEdicao={resultado.perfil || resultado} modoPastaDigital={true} />
                )}
                
                {formAtivo === 'saude' && (
                  <QuestionarioSaude 
                    onClose={() => {setFormAtivo(null); pesquisarPaciente();}} 
                    dadosEdicao={resultado.saude || {}} 
                    pacienteSelecionado={{
                        id: resultado.id,
                        nome: resultado.perfil?.nome || resultado.nome,
                        tipo: resultado.isFuncionario ? 'funcionario' : 'aluno'
                    }}
                    modoPastaDigital={true} 
                  />
                )}

                {formAtivo === 'atendimento' && (
                  <div className="text-center py-32 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                    <p className="font-black text-slate-400 text-lg mb-10 uppercase italic tracking-widest px-10">Confirmar entrada na enfermagem para {resultado.perfil?.nome}?</p>
                    <button 
                        onClick={() => { 
                            onNovoAtendimento({ tipo: resultado.isFuncionario ? 'FUNCIONARIO' : 'ALUNO', dados: resultado.perfil || resultado }); 
                            setFormAtivo(null); 
                        }} 
                        className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black uppercase text-sm shadow-2xl hover:scale-105 transition-transform"
                    >
                        INICIAR ATENDIMENTO AGORA
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {atendimentoSelecionado && (
        <ModalDetalhesDigital 
            atendimento={atendimentoSelecionado} 
            onClose={() => setAtendimentoSelecionado(null)} 
        />
      )}
    </div>
  );
};

const TabButton = ({ active, label, onClick, icon }) => (
  <button onClick={onClick} className={`px-10 py-8 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-4 border-b-4 transition-all ${active ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'}`}>
    {icon} {label}
  </button>
);

const DataBox = ({ label, value }) => (
  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-[0.1em]">{label}</p>
    <p className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{value || 'NÃO INFORMADO'}</p>
  </div>
);

const StatusLine = ({ label, status }) => (
  <div className="flex items-center justify-between p-6 bg-white border-2 border-slate-50 rounded-3xl shadow-sm">
    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    {status ? (
      <div className="flex items-center gap-2 text-emerald-500 font-black text-xs">
        <CheckCircle2 size={24} /> <span className="italic uppercase">VALIDADO</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-rose-300 font-black text-xs">
        <X size={24} className="opacity-30"/> <span className="italic uppercase">PENDENTE</span>
      </div>
    )}
  </div>
);

export default PastaDigital;