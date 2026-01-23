import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, orderBy, where, getDocs, limit } from 'firebase/firestore';
import { 
  Search, MapPin, Phone, Heart, ArrowLeft, Loader2, 
  GraduationCap, MessageCircle, Printer, User, Baby, ClipboardList, Hash, ExternalLink
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ContatoAluno = ({ user, onVoltar, darkMode }) => {
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [aluno, setAluno] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSugestoes([]);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const lidarBusca = async (valor) => {
    setBusca(valor);
    const termo = valor.trim().toUpperCase(); 
    if (termo.length < 3) { setSugestoes([]); return; }

    setBuscando(true);
    try {
      const q = query(
        collection(db, "alunos"),
        orderBy("nomeBusca"),
        where("nomeBusca", ">=", termo),
        where("nomeBusca", "<=", termo + '\uf8ff'),
        limit(6)
      );
      const snap = await getDocs(q);
      setSugestoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setBuscando(false); }
  };

  const abrirWhatsApp = (numero) => {
    if (!numero || numero === 'SEM CONTATO') {
      return toast.error("Telefone não cadastrado");
    }
    const apenasNumeros = numero.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=55${apenasNumeros}`;
    window.open(url, '_blank');
  };

  const selecionarAluno = (dados) => {
    setAluno(dados);
    setSugestoes([]);
    setBusca('');
  };

  const corAvatar = aluno?.sexo === "Menino" ? "bg-blue-500" : aluno?.sexo === "Menina" ? "bg-pink-500" : "bg-slate-500";

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-[#070e1e] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-right" />
      
      {/* ESTILO DE IMPRESSÃO - Garante que só o prontuário saia no papel */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white !important; color: black !important; }
            .prontuario-card { 
              border: none !important; 
              box-shadow: none !important; 
              margin: 0 !important; 
              padding: 0 !important;
              width: 100% !important;
            }
            .bg-slate-900, .bg-[#020617], .bg-slate-50 { background: white !important; color: black !important; }
            .text-white { color: black !important; }
          }
        `}
      </style>
      
      {/* BARRA SUPERIOR - OCULTA NA IMPRESSÃO */}
      <div className={`sticky top-0 z-40 border-b no-print transition-colors ${darkMode ? 'bg-[#020617]/80 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'} p-4 md:p-6`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={onVoltar} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-full transition-all">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-black uppercase italic tracking-tighter">PRONTUÁRIO <span className="text-blue-600">DIGITAL</span></h1>
          </div>

          <div className="relative w-full md:flex-1 max-w-xl" ref={dropdownRef}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {buscando ? <Loader2 className="animate-spin text-blue-600" size={18}/> : <Search className="text-slate-400" size={18}/>}
            </div>
            <input 
              value={busca}
              onChange={(e) => lidarBusca(e.target.value)}
              placeholder="PESQUISAR NOME DO ALUNO..."
              className={`w-full py-4 pl-12 pr-4 rounded-2xl text-xs font-black uppercase transition-all outline-none border-2
                ${darkMode ? 'bg-slate-900 border-slate-800 focus:border-blue-600' : 'bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 shadow-inner'}`}
            />
            {sugestoes.length > 0 && (
              <div className={`absolute z-50 top-full mt-2 w-full rounded-2xl shadow-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
                {sugestoes.map(s => (
                  <button key={s.id} onClick={() => selecionarAluno(s)} className={`w-full p-4 text-left border-b last:border-0 flex justify-between items-center ${darkMode ? 'hover:bg-white/5 border-slate-800' : 'hover:bg-blue-50 border-slate-50'}`}>
                    <div>
                      <p className="text-[11px] font-black uppercase text-blue-500">{s.nome}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Mãe: {s.responsavel}</p>
                    </div>
                    <span className="text-[9px] font-black opacity-50 uppercase">{s.turma}</span>
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
            {/* CARD PRINCIPAL DO PRONTUÁRIO */}
            <div className={`prontuario-card rounded-[40px] shadow-2xl overflow-hidden border ${darkMode ? 'bg-[#020617] border-slate-800' : 'bg-white border-slate-100'}`}>
              
              <div className={`p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
                <div className={`w-32 h-32 ${corAvatar} rounded-[45px] flex items-center justify-center text-white shadow-2xl border-4 border-white/20 relative`}>
                  <Baby size={60} />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center no-print">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
                
                <div className="text-center md:text-left flex-1">
                  <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2 w-fit mx-auto md:mx-0">
                    <Hash size={12}/> Matrícula: {aluno.matriculaInteligente || "PENDENTE"}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mt-2 leading-none">{aluno.nome}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-[10px] font-black text-slate-500 uppercase">
                    <span className="flex items-center gap-1"><User size={14}/> Sexo: {aluno.sexo}</span>
                    <span className="flex items-center gap-1"><ClipboardList size={14}/> Idade: {aluno.idade} Anos</span>
                    <span className="flex items-center gap-1"><GraduationCap size={14}/> Turma: {aluno.turma}</span>
                    <span className="flex items-center gap-1 text-rose-500"><Heart size={14} fill="currentColor"/> Alergia: {aluno.alunoPossuiAlergia}</span>
                  </div>
                </div>

                <div className="flex gap-2 no-print">
                  <button onClick={() => window.print()} className="p-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 font-black text-xs uppercase italic">
                    <Printer size={20} /> Imprimir Prontuário
                  </button>
                </div>
              </div>

              <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                
                <div className="space-y-6">
                  <h4 className="text-blue-500 font-black text-xs uppercase tracking-[0.2em] border-b border-blue-500/10 pb-2">Identificação Escolar</h4>
                  <InfoLinha label="Nº Matrícula" value={aluno.matriculaInteligente || "PENDENTE"} />
                  <InfoLinha label="Data Nascimento" value={aluno.dataNascimento} />
                  <InfoLinha label="Cartão SUS" value={aluno.cartaoSus} />
                  <InfoLinha label="Etnia" value={aluno.etnia} />
                </div>

                <div className="space-y-6">
                  <h4 className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] border-b border-emerald-500/10 pb-2">Localização e Contato</h4>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Residência:</p>
                    <p className="text-xs font-bold uppercase">{aluno.endereco_rua || 'Não informado'}, {aluno.endereco_bairro || ''}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Responsável Principal:</p>
                    <p className="text-xs font-bold uppercase">{aluno.responsavel} ({aluno.parentesco})</p>
                  </div>
                  
                  <div className="space-y-1 pt-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">Telefone de Emergência:</p>
                    <button 
                      onClick={() => abrirWhatsApp(aluno.contato)}
                      className={`flex items-center gap-3 p-3 rounded-2xl transition-all w-full group border-2 no-print ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`}
                    >
                      <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg">
                        <MessageCircle size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-black text-emerald-600 italic tracking-tighter leading-none">{aluno.contato || 'SEM CONTATO'}</p>
                        <span className="text-[8px] font-bold text-emerald-500/60 uppercase">Clique para abrir Zap</span>
                      </div>
                    </button>
                    {/* Texto simples visível apenas na impressão */}
                    <p className="hidden print:block text-lg font-black text-black italic">{aluno.contato || 'SEM CONTATO'}</p>
                  </div>
                </div>

                <div className={`p-6 rounded-3xl border-2 ${darkMode ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
                  <h4 className="text-rose-600 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2 italic">
                    <Heart size={16} fill="currentColor"/> Alertas Médicos
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[8px] font-black text-rose-400 uppercase mb-1">Alergias Detectadas:</p>
                      <p className="text-xs font-black uppercase text-rose-700">
                        {aluno.alunoPossuiAlergia === "Sim" ? (aluno.historicoMedico || aluno.alergias) : "Nenhuma Relatada"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-rose-400 uppercase mb-1">Histórico/Medicamentos:</p>
                      <p className="text-[10px] font-bold uppercase text-slate-500 leading-tight">
                        {aluno.historicoMedico || "Nenhum histórico médico registrado."}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className={`h-[500px] flex flex-col items-center justify-center rounded-[60px] border-4 border-dashed transition-colors no-print
            ${darkMode ? 'border-slate-800/50 text-slate-800' : 'border-slate-200 text-slate-200'}`}>
            <GraduationCap size={100} strokeWidth={1} />
            <p className="text-sm font-black uppercase tracking-[0.5em] mt-4">Pesquise um aluno para abrir o prontuário</p>
          </div>
        )}
      </main>
    </div>
  );
};

const InfoLinha = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-slate-500/5 py-2">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-[11px] font-bold uppercase ${value === 'PENDENTE' ? 'text-orange-500' : ''}`}>{value || '---'}</span>
  </div>
);

export default ContatoAluno;