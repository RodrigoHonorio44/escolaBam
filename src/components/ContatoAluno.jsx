import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, orderBy, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { 
  Search, Heart, ArrowLeft, Loader2, Edit3,
  GraduationCap, MessageCircle, Printer, User, Baby, ClipboardList
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// IMPORTAÇÃO DO FORMULÁRIO COMPLETO
import FormCadastroAluno from '../pages/cadastros/FormCadastroAluno'; 

const ContatoAluno = ({ onVoltar, darkMode }) => {
  const [busca, setBusca] = useState(''); 
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [aluno, setAluno] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  
  const dropdownRef = useRef(null);

  const paraBanco = (txt) => {
    if (!txt) return "";
    return String(txt).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const formatarNomeRS = (str) => {
    if (!str || str === '---') return '---';
    const partes = str.toLowerCase().split(' ');
    return partes.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const calcularIdade = (dataNasc) => {
    if (!dataNasc || dataNasc === '---') return '---';
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
  };

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setSugestoes([]);
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  // BUSCA GLOBAL - AGORA OLHA TODAS AS ENTRADAS
  const lidarBusca = async (valor) => {
    setBusca(valor);
    const termo = paraBanco(valor);
    if (termo.length < 3) { setSugestoes([]); return; }
    
    setBuscando(true);
    try {
      const colecoes = ["alunos", "pastas_digitais", "questionarios_saude", "atendimentos_enfermagem"];
      let resultadosBrutos = [];

      const promessas = colecoes.map(async (colNome) => {
        const campoBusca = colNome === "pastas_digitais" ? "nomeBusca" : 
                           colNome === "questionarios_saude" ? "alunoNome" : "nome";
        
        const q = query(
          collection(db, colNome),
          where(campoBusca, ">=", termo),
          where(campoBusca, "<=", termo + '\uf8ff'),
          limit(5)
        );
        
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
          id: d.id,
          nomeExibicao: d.data()[campoBusca] || d.data().nome || d.data().nomePaciente,
          ...d.data()
        }));
      });

      const retornos = await Promise.all(promessas);
      resultadosBrutos = retornos.flat();

      // Remove duplicados pelo ID
      const unificados = resultadosBrutos.filter((v, i, a) => 
        a.findIndex(t => t.id === v.id) === i
      );

      setSugestoes(unificados);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setBuscando(false); 
    }
  };

  const selecionarAluno = async (dados) => {
    if (!dados?.id) return;
    setBuscando(true);
    const toastId = toast.loading("Sincronizando todas as fontes...");
    
    try {
      const idMestre = dados.id;
      
      // BUSCA EM CASCATA PARA PEGAR O CONTATO
      const [snapAlu, snapPas, snapQue] = await Promise.all([
        getDoc(doc(db, "alunos", idMestre)),
        getDoc(doc(db, "pastas_digitais", idMestre)),
        getDoc(doc(db, "questionarios_saude", idMestre))
      ]);

      const dAlu = snapAlu.exists() ? snapAlu.data() : {};
      const dPas = snapPas.exists() ? snapPas.data() : {};
      const dQue = snapQue.exists() ? snapQue.data() : {};

      const unificado = {
        ...dados,
        id: idMestre,
        // PRIORIDADE DE CONTATO (Onde o Rodrigo Giromba costuma ter o número)
        responsavel: dPas.responsavel || dQue.alunoMae || dAlu.responsavel || dados.responsavel || '---',
        contato: dPas.contato || dQue.contatos?.[0]?.telefone || dAlu.contato || dQue.telefoneCelular || '',
        dataNascimento: dPas.dataNascimento || dQue.dataNascimento || dAlu.dataNascimento || dados.dataNascimento || '---',
        cartaoSus: dPas.cartaoSus || dQue.cartaoSus || dAlu.cartaoSus || '',
        escola: dPas.escola || dAlu.escola || '',
        alunoPossuiAlergia: dPas.alunoPossuiAlergia || dQue.alergias?.possui || dAlu.alunoPossuiAlergia || 'não',
        qualAlergia: dPas.qualAlergia || dQue.alergias?.detalhes || dAlu.qualAlergia || ''
      };

      setAluno(unificado);
      setSugestoes([]);
      setBusca('');
      toast.success("Prontuário unificado!", { id: toastId });
    } catch (error) { 
      toast.error("Erro ao cruzar dados"); 
    } finally { 
      setBuscando(false); 
    }
  };

  const abrirWhatsApp = (numero) => {
    if (!numero || numero === '---' || numero.length < 8) return toast.error("Telefone não cadastrado");
    const apenasNumeros = numero.replace(/\D/g, '');
    window.open(`https://api.whatsapp.com/send?phone=55${apenasNumeros}`, '_blank');
  };

  if (modoEdicao && aluno) {
    return (
      <FormCadastroAluno 
        alunoParaEditar={aluno} 
        onVoltar={() => setModoEdicao(false)}
        darkMode={darkMode}
        onSucesso={() => {
          setModoEdicao(false);
          selecionarAluno(aluno);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-all ${darkMode ? 'bg-[#070e1e] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-right" />
      
      <div className={`sticky top-0 z-40 border-b no-print transition-colors ${darkMode ? 'bg-[#020617]/80 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'} p-4 md:p-6`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={onVoltar} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-full transition-all"><ArrowLeft size={24} /></button>
            <h1 className="text-xl font-black uppercase italic tracking-tighter shrink-0">PRONTUÁRIO <span className="text-blue-600">DIGITAL</span></h1>
          </div>

          <div className="relative w-full md:flex-1 max-w-xl" ref={dropdownRef}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {buscando ? <Loader2 className="animate-spin text-blue-600" size={20}/> : <Search className="text-slate-400" size={20}/>}
            </div>
            <input 
              value={busca}
              onChange={(e) => lidarBusca(e.target.value)}
              placeholder="PESQUISAR ALUNO..."
              style={{ textTransform: 'capitalize' }} // RESOLVE O VISUAL MAIÚSCULO NO INPUT
              className={`w-full py-4 pl-12 pr-4 rounded-2xl text-base font-bold transition-all outline-none border-2 
                ${darkMode ? 'bg-slate-900 border-slate-800 focus:border-blue-600' : 'bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 shadow-inner'}`}
            />
            {sugestoes.length > 0 && (
              <div className={`absolute z-50 top-full mt-2 w-full rounded-2xl shadow-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
                {sugestoes.map(s => (
                  <button key={s.id} onClick={() => selecionarAluno(s)} className={`w-full p-4 text-left border-b last:border-0 flex justify-between items-center ${darkMode ? 'hover:bg-white/5 border-slate-800' : 'hover:bg-blue-50 border-slate-50'}`}>
                    <div>
                      <p className="text-sm font-black text-blue-500">{formatarNomeRS(s.nomeExibicao)}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Resp: {formatarNomeRS(s.responsavel || s.alunoMae || s.nomeMae)}</p>
                    </div>
                    <span className="text-[10px] font-black opacity-50">{s.turma || '---'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {aluno ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`rounded-[40px] shadow-2xl overflow-hidden border ${darkMode ? 'bg-[#020617] border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className={`p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
                <div className={`w-32 h-32 ${paraBanco(aluno?.sexo).includes("fem") ? "bg-pink-500" : "bg-blue-500"} rounded-[45px] flex items-center justify-center text-white shadow-2xl border-4 border-white/20`}>
                  <Baby size={60} />
                </div>
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter mt-2 leading-none">
                    {formatarNomeRS(aluno.nome || aluno.nomeExibicao)}
                  </h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-[11px] font-bold text-slate-500 uppercase">
                    <span className="flex items-center gap-1"><User size={14}/> {aluno.sexo || '---'}</span>
                    <span className="flex items-center gap-1"><ClipboardList size={14}/> {calcularIdade(aluno.dataNascimento)} anos</span>
                    <span className="flex items-center gap-1"><GraduationCap size={14}/> {aluno.turma || '---'}</span>
                    <span className={`flex items-center gap-1 ${paraBanco(aluno.alunoPossuiAlergia) === 'sim' ? 'text-rose-600' : ''}`}>
                      <Heart size={14} fill={paraBanco(aluno.alunoPossuiAlergia) === 'sim' ? "currentColor" : "none"}/> 
                      alergia: {paraBanco(aluno.alunoPossuiAlergia) === 'sim' ? formatarNomeRS(aluno.qualAlergia) : "nenhuma"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 no-print">
                  <button onClick={() => setModoEdicao(true)} className="p-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-all flex items-center gap-2 font-black text-xs uppercase italic">
                    <Edit3 size={20} /> atualizar cadastro
                  </button>
                  <button onClick={() => window.print()} className="p-4 rounded-2xl bg-slate-900 text-white hover:bg-black shadow-lg transition-all flex items-center gap-2 font-black text-xs uppercase italic">
                    <Printer size={20} /> imprimir
                  </button>
                </div>
              </div>

              <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-6">
                  <h4 className="text-blue-500 font-black text-xs uppercase tracking-[0.2em] border-b border-blue-500/10 pb-2">dados vitais</h4>
                  <InfoLinha label="nascimento" value={aluno.dataNascimento} />
                  <InfoLinha label="cartão sus" value={aluno.cartaoSus || "não informado"} />
                  <InfoLinha label="escola" value={formatarNomeRS(aluno.escola || "e. m. anisio teixeira")} />
                </div>
                <div className="space-y-6">
                  <h4 className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] border-b border-emerald-500/10 pb-2">rede de apoio</h4>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">responsável:</p>
                    <p className="text-sm font-bold">{formatarNomeRS(aluno.responsavel)}</p>
                  </div>
                  <div className="space-y-1 pt-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">contato de emergência:</p>
                    <button onClick={() => abrirWhatsApp(aluno.contato)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all w-full border-2 no-print ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                      <div className="bg-emerald-500 p-2 rounded-xl text-white"><MessageCircle size={18} /></div>
                      <div className="text-left">
                        <p className="text-lg font-black text-emerald-600 italic tracking-tighter leading-none">{aluno.contato || 'sem número'}</p>
                        <span className="text-[9px] font-bold text-emerald-500/60 uppercase">chamar agora</span>
                      </div>
                    </button>
                  </div>
                </div>
                <div className={`p-6 rounded-3xl border-2 ${paraBanco(aluno.alunoPossuiAlergia) === 'sim' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-500/5 border-slate-500/10'}`}>
                  <h4 className={`font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2 italic ${paraBanco(aluno.alunoPossuiAlergia) === 'sim' ? 'text-rose-600' : 'text-slate-400'}`}>
                    <Heart size={16} fill={paraBanco(aluno.alunoPossuiAlergia) === 'sim' ? "currentColor" : "none"}/> histórico clínico
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">alergias:</p>
                      <p className="text-xs font-bold">{paraBanco(aluno.alunoPossuiAlergia) === 'sim' ? formatarNomeRS(aluno.qualAlergia) : "nenhuma relatada"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">observações:</p>
                      <p className="text-xs font-medium text-slate-500 leading-tight">
                        {aluno.historicoMedico || aluno.observacoes || "nenhuma observação registrada."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`h-[500px] flex flex-col items-center justify-center rounded-[60px] border-4 border-dashed transition-colors ${darkMode ? 'border-slate-800/50 text-slate-800' : 'border-slate-200 text-slate-200'}`}>
            <GraduationCap size={100} strokeWidth={1} />
            <p className="text-sm font-black uppercase tracking-[0.5em] mt-4 text-center px-4">pesquise o nome do aluno para abrir</p>
          </div>
        )}
      </main>
    </div>
  );
};

const InfoLinha = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-slate-500/5 py-2">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-bold text-right">{value || '---'}</span>
  </div>
);

export default ContatoAluno;