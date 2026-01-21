import React, { useState, useEffect } from 'react';
import { 
  Search, Briefcase, GraduationCap, Calendar, PlusCircle, ShieldAlert,
  ChevronLeft, ChevronRight, Phone, Edit3, FileSearch, CheckCircle2, 
  ClipboardList, ArrowLeft, Loader2, Pill, X
} from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { useBuscaPaciente } from '../hooks/useBuscaPaciente'; 

import ModalDetalhesDigital from './ModalDetalhesDigital';
import FormCadastroAluno from '../pages/cadastros/FormCadastroAluno'; 

const PastaDigital = ({ onVoltar, onNovoAtendimento, onAbrirQuestionario, alunoParaReabrir }) => {
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [cacheNomes, setCacheNomes] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const [detalheExpandido, setDetalheExpandido] = useState(null);
  const [exibirModalEdicao, setExibirModalEdicao] = useState(false);

  const itensPorPagina = 5;
  const { buscarDadosCompletos, loading } = useBuscaPaciente();

  useEffect(() => {
    if (alunoParaReabrir?.nomePaciente || alunoParaReabrir?.nome) {
      const nomeParaBusca = alunoParaReabrir.nomePaciente || alunoParaReabrir.nome;
      setBusca(nomeParaBusca);
      pesquisarPaciente(nomeParaBusca);
    }
  }, [alunoParaReabrir]);

  useEffect(() => {
    const carregarNomesRecentes = async () => {
      try {
        const q = query(collection(db, "pastas_digitais"), orderBy("nome", "asc"), limit(200));
        const snap = await getDocs(q);
        const nomes = snap.docs.map(d => ({
          nome: d.data().nome || '',
          turma: d.data().tipoPerfil === 'funcionario' ? (d.data().cargo || 'Staff') : (d.data().turma || d.data().serie),
          tipo: d.data().tipoPerfil
        })).filter(item => item.nome !== '');
        setCacheNomes(nomes);
      } catch (e) { console.error("Erro cache:", e); }
    };
    carregarNomesRecentes();
  }, []);

  const pesquisarPaciente = async (nomeForcado) => {
    const termoBusca = nomeForcado || busca;
    if (!termoBusca.trim()) return;
    setSugestoes([]);
    setPaginaAtual(1);
    try {
      const data = await buscarDadosCompletos(termoBusca);
      if (data) {
        setResultado(data);
        console.log("Dados Recebidos no Componente:", data.perfil); // Debug para você ver no F12
      } else {
        toast.error("Paciente não encontrado");
      }
    } catch (error) { 
      toast.error("Erro ao sincronizar dados"); 
    }
  };

  const consolidarDados = (tipo) => {
    if (!resultado) return [];
    const setComparacao = new Set();
    const listaFinal = [];
    const normalizar = (txt) => txt?.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const termosNegativos = ["não", "nao", "n", "nenhuma", "negativo", "-", "não informado", "não possui", "n/a", "sem", "null", "undefined"];

    if (tipo === 'alergia') {
      const p = resultado.perfil || {};
      const s = resultado.saude || {};

      const fontesAlergia = [
        { valor: p.qualAlergia, fonte: "Ficha Cadastral" },
        { valor: p.alergia, fonte: "Ficha Cadastral" },
        { valor: s.alergias?.detalhes, fonte: "Questionário de Saúde" },
        { valor: s.restricoesAlimentares?.detalhes, fonte: "Restrição Alimentar" }
      ];

      fontesAlergia.forEach(item => {
        const texto = item.valor?.trim();
        if (texto && !termosNegativos.includes(texto.toLowerCase())) {
          const termoNorm = normalizar(texto);
          if (!setComparacao.has(termoNorm)) {
            setComparacao.add(termoNorm);
            listaFinal.push({ texto, fonte: item.fonte });
          }
        }
      });
    }

    if (tipo === 'medicacao') {
      const p = resultado.perfil || {};
      const s = resultado.saude || {};
      const fontesMed = [
        { valor: s.medicacaoContinua?.detalhes, fonte: "Questionário" },
        { valor: p.medicacao, fonte: "Ficha Cadastral" }
      ];

      fontesMed.forEach(item => {
        const med = item.valor?.trim();
        if (med && !termosNegativos.includes(med.toLowerCase())) {
          const termoNorm = normalizar(med);
          if (!setComparacao.has(termoNorm)) {
            setComparacao.add(termoNorm);
            listaFinal.push({ texto: med, fonte: item.fonte });
          }
        }
      });
    }
    return listaFinal;
  };

  const listaAlergias = consolidarDados('alergia');
  const listaMedicos = consolidarDados('medicacao');
  const temAlergiaAtiva = listaAlergias.length > 0;

  const handleAcaoRegistro = () => {
    if (!resultado?.dadosParaForm) return;
    onNovoAtendimento({
      tipo: resultado.isFuncionario ? 'FUNCIONARIO' : 'ALUNO',
      dados: resultado.dadosParaForm
    });
  };

  const totalPaginas = resultado ? Math.ceil((resultado.atendimentos?.length || 0) / itensPorPagina) : 0;
  const atendimentosPaginados = resultado ? (resultado.atendimentos || []).slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina) : [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans animate-in fade-in duration-500">
      <Toaster position="top-center" />
      
      {/* HEADER DE BUSCA */}
      <div className="bg-slate-900 rounded-[40px] p-8 text-white mb-8 shadow-2xl border-b-4 border-blue-600">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col">
            <button onClick={onVoltar} className="flex items-center gap-2 text-slate-500 hover:text-blue-400 text-[10px] font-black uppercase mb-2 transition-colors">
              <ArrowLeft size={14} /> Voltar ao Painel
            </button>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Pasta <span className="text-blue-500">Digital</span></h2>
          </div>
          <div className="flex flex-1 max-w-2xl w-full gap-2 relative">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="BUSCAR NOME DO PACIENTE..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-sm font-bold focus:bg-white focus:text-slate-900 outline-none uppercase transition-all"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  if(e.target.value.length > 2) setSugestoes(cacheNomes.filter(p => p.nome.toLowerCase().includes(e.target.value.toLowerCase())));
                  else setSugestoes([]);
                }}
                onKeyDown={(e) => e.key === 'Enter' && pesquisarPaciente()}
              />
              {sugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-[100] overflow-hidden border border-slate-100">
                  {sugestoes.slice(0, 5).map((s, i) => (
                    <div key={i} onClick={() => { setBusca(s.nome); pesquisarPaciente(s.nome); }} className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 flex justify-between items-center text-slate-900">
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase">{s.nome}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{s.tipo === 'funcionario' ? 'Staff' : 'Aluno'}</span>
                      </div>
                      <span className="text-[9px] bg-slate-100 px-2 py-1 rounded font-black">{s.turma}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => pesquisarPaciente()} className="bg-blue-600 px-8 rounded-2xl font-black text-xs uppercase italic hover:bg-blue-700 min-w-[140px] flex items-center justify-center transition-all">
              {loading ? <Loader2 className="animate-spin" /> : 'Sincronizar'}
            </button>
          </div>
        </div>
      </div>

      {resultado ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-6 duration-700">
          
          {/* COLUNA LATERAL - PERFIL */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm text-center relative overflow-hidden">
              {temAlergiaAtiva && (
                <div className="absolute top-0 inset-x-0 bg-rose-600 text-white text-[8px] font-black uppercase py-2 flex items-center justify-center gap-1.5 tracking-widest animate-pulse z-10">
                  <ShieldAlert size={12} /> Alerta: Alergia Detectada
                </div>
              )}
              <div className={`w-28 h-28 rounded-[35px] mx-auto flex items-center justify-center mb-6 mt-4 shadow-2xl ${resultado.isFuncionario ? 'bg-slate-800' : 'bg-blue-600'} text-white`}>
                {resultado.isFuncionario ? <Briefcase size={52} /> : <GraduationCap size={52} />}
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-tight truncate px-2">
                {resultado.perfil?.nome || resultado.nome}
              </h3>
              
              <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${resultado.isFuncionario ? 'text-slate-500' : 'text-blue-600'}`}>
                {resultado.isFuncionario 
                  ? (resultado.perfil?.turma || 'COLABORADOR') 
                  : `ALUNO • TURMA ${resultado.perfil?.turma || 'N/A'}`
                }
              </p>
              
              <div className="mt-8 space-y-2 text-left bg-slate-50 p-5 rounded-[30px] border border-slate-100">
                <InfoRow label="SUS" value={resultado.perfil?.cartaoSus} icon={<FileSearch size={12}/>} />
                <InfoRow label="Nascimento" value={resultado.perfil?.dataNascimento} icon={<Calendar size={12}/>} />
                <InfoRow label="Idade" value={resultado.perfil?.idade ? `${resultado.perfil.idade} anos` : null} icon={<Calendar size={12}/>} />
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <button onClick={handleAcaoRegistro} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl">
                  <PlusCircle size={18} /> Novo Atendimento
                </button>
                <button onClick={() => setExibirModalEdicao(true)} className="w-full bg-white border-2 border-slate-200 text-slate-900 py-4 rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-3 hover:border-blue-600 transition-all">
                  <Edit3 size={18} /> Editar Cadastro
                </button>
              </div>
            </div>
          </div>

          {/* COLUNA PRINCIPAL */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Status Clínico" action={<button onClick={() => onAbrirQuestionario({tipo: resultado.isFuncionario ? 'FUNCIONARIO' : 'ALUNO', dados: resultado.dadosParaForm})} className="text-blue-600 hover:scale-110 transition-transform"><Edit3 size={16} /></button>}>
                <div className="grid grid-cols-2 gap-3">
                  <HealthStatusBadge label="Asma" status={resultado.statusClinico?.asma} />
                  <HealthStatusBadge label="Diabetes" status={resultado.statusClinico?.diabetes} />
                  <HealthStatusBadge label="Cardíaco" status={resultado.statusClinico?.cardiaco} />
                  <HealthStatusBadge label="Epilepsia" status={resultado.statusClinico?.epilepsia} />
                </div>
              </Section>

              <Section title="Alergias e Restrições">
                {temAlergiaAtiva ? (
                  <div className="grid grid-cols-1 gap-2">
                    {listaAlergias.map((a, i) => (
                      <button 
                        key={i} 
                        onClick={() => setDetalheExpandido({ ...a, titulo: 'Alergia Detectada', tipo: 'alergia' })}
                        className="bg-rose-50 border-2 border-rose-100 hover:border-rose-400 p-4 rounded-2xl text-left transition-all group shadow-sm flex flex-col"
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-[11px] font-black text-rose-900 uppercase italic truncate pr-2">{a.texto}</p>
                          <ShieldAlert size={12} className="text-rose-500" />
                        </div>
                        <p className="text-[7px] font-bold text-rose-400 uppercase mt-1 tracking-widest">Ver Detalhes • {a.fonte}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-[30px] p-6 opacity-60">
                     <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                     <p className="text-[10px] font-black text-slate-400 uppercase italic">Livre de Restrições</p>
                  </div>
                )}
              </Section>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <DocStatus label="Vacinação" status={resultado.saude?.vacinaAtualizada || resultado.perfil?.vacinaDia} />
                <DocStatus label="Autoriz. Emergência" status={resultado.saude?.autorizacaoEmergencia || resultado.perfil?.autorizacaoHospitalar} highlight />
              </div>
              
              <Section title="Uso de Medicação Contínua">
                {listaMedicos.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {listaMedicos.map((m, i) => (
                      <button 
                        key={i} 
                        onClick={() => setDetalheExpandido({ ...m, titulo: 'Medicação Contínua', tipo: 'medicacao' })}
                        className="bg-blue-50 border-2 border-blue-100 hover:border-blue-400 p-4 rounded-2xl text-left transition-all shadow-sm"
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-[11px] font-black text-blue-900 uppercase italic truncate pr-2">{m.texto}</p>
                          <Pill size={12} className="text-blue-500" />
                        </div>
                        <p className="text-[7px] font-bold text-blue-400 uppercase mt-1">Ver Prescrição • {m.fonte}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[30px] p-4">
                    <p className="text-[9px] font-bold text-slate-300 uppercase italic">Nenhuma medicação</p>
                  </div>
                )}
              </Section>
            </div>

            {/* TABELA DE HISTÓRICO */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <h4 className="text-lg font-black uppercase italic flex items-center gap-3 text-slate-900">
                  <ClipboardList className="text-blue-600" size={24} /> Histórico
                </h4>
                <div className="flex items-center gap-3">
                    <button onClick={() => setPaginaAtual(p => Math.max(1, p-1))} disabled={paginaAtual === 1} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ChevronLeft size={18}/></button>
                    <span className="text-[10px] font-black uppercase text-slate-400">{paginaAtual} / {totalPaginas || 1}</span>
                    <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p+1))} disabled={paginaAtual === totalPaginas} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ChevronRight size={18}/></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50">
                    <tr className="text-[9px] font-black text-slate-400 uppercase text-left">
                      <th className="px-8 py-5">Data / Hora</th>
                      <th className="px-8 py-5">Queixa Principal</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {atendimentosPaginados.map((atend) => (
                      <tr key={atend.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-8 py-6">
                          <p className="text-xs font-black text-slate-900">{atend.dataAtendimento}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{atend.horario}</p>
                        </td>
                        <td className="px-8 py-6 text-xs font-black text-slate-800 uppercase italic truncate max-w-sm">
                          {atend.motivoAtendimento}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full ${atend.destinoHospital ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {atend.destinoHospital ? 'Removido' : 'Liberado'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => setAtendimentoSelecionado(atend)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase hover:bg-blue-600">Ver Ficha</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
           <FileSearch size={32} className="text-slate-300 mb-4" />
           <p className="text-slate-400 font-black uppercase italic text-xs tracking-widest">Aguardando busca...</p>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {exibirModalEdicao && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px]">
            <FormCadastroAluno 
              onVoltar={() => {
                setExibirModalEdicao(false);
                pesquisarPaciente(); 
              }} 
              dadosEdicao={resultado.dadosParaForm}
              modoPastaDigital={true} 
            />
          </div>
        </div>
      )}

      {/* OVERLAY DE DETALHES */}
      {detalheExpandido && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setDetalheExpandido(null)} />
          <div className={`bg-white w-full max-w-lg rounded-[45px] shadow-2xl relative overflow-hidden border-b-[12px] ${detalheExpandido.tipo === 'alergia' ? 'border-rose-500' : 'border-blue-500'}`}>
            <div className={`p-8 text-white flex items-center justify-between ${detalheExpandido.tipo === 'alergia' ? 'bg-rose-600' : 'bg-blue-600'}`}>
              <div className="flex items-center gap-4">
                {detalheExpandido.tipo === 'alergia' ? <ShieldAlert size={32} /> : <Pill size={32} />}
                <div>
                  <h4 className="font-black uppercase italic text-xl leading-none">{detalheExpandido.titulo}</h4>
                </div>
              </div>
              <button onClick={() => setDetalheExpandido(null)} className="bg-white/20 p-2 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-10">
              <div className={`rounded-3xl p-8 border-2 mb-8 ${detalheExpandido.tipo === 'alergia' ? 'bg-rose-50 border-rose-100' : 'bg-blue-50 border-blue-100'}`}>
                <p className={`font-black uppercase italic text-2xl leading-tight ${detalheExpandido.tipo === 'alergia' ? 'text-rose-900' : 'text-blue-900'}`}>
                  "{detalheExpandido.texto}"
                </p>
              </div>
              <button onClick={() => setDetalheExpandido(null)} className="w-full bg-slate-900 text-white py-5 rounded-[25px] font-black uppercase text-xs">Ciente</button>
            </div>
          </div>
        </div>
      )}

      <ModalDetalhesDigital atendimento={atendimentoSelecionado} onClose={() => setAtendimentoSelecionado(null)} />
    </div>
  );
};

// SUBCOMPONENTES
const Section = ({ title, children, action }) => (
  <div className="bg-white rounded-[35px] border border-slate-200 p-8 shadow-sm h-full flex flex-col transition-all hover:shadow-md">
    <div className="flex justify-between items-center mb-6">
      <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest">
        <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div> {title}
      </h4>
      {action}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const HealthStatusBadge = ({ label, status }) => {
  const possui = status?.possui === "Sim" || status === "Sim";
  return (
    <div className={`p-4 rounded-2xl border ${possui ? 'border-rose-200 bg-rose-50 shadow-sm' : 'border-slate-100 bg-white opacity-60'}`}>
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-black text-slate-500 uppercase">{label}</span>
        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${possui ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
          {possui ? 'SIM' : 'NÃO'}
        </span>
      </div>
    </div>
  );
};

const DocStatus = ({ label, status, highlight }) => {
  const isOk = status === 'Sim' || status === true || status === 'Autorizado' || status === 'Ok';
  return (
    <div className={`p-5 rounded-[28px] border flex flex-col items-center text-center ${highlight && isOk ? 'bg-blue-600 text-white border-blue-400 shadow-xl' : 'bg-white border-slate-200'}`}>
      <p className={`text-[8px] font-black uppercase mb-2 ${highlight && isOk ? 'text-blue-200' : 'text-slate-400'}`}>{label}</p>
      <p className="text-[11px] font-black uppercase italic">{isOk ? '✓ OK' : '✕ PENDENTE'}</p>
    </div>
  );
};

const InfoRow = ({ label, value, icon }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-slate-200/50 last:border-none">
    <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2">{icon}{label}</span>
    <span className="text-[10px] font-black text-slate-800 uppercase italic truncate max-w-[130px]">{value || '---'}</span>
  </div>
);

export default PastaDigital;