import React, { useState, useEffect } from 'react';
import { 
  Search, User, Briefcase, GraduationCap, Clock, 
  ChevronRight, FileText, AlertCircle, Calendar, 
  MapPin, Activity, Loader2, ArrowLeft, PlusCircle, ShieldAlert
} from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const PastaDigital = ({ onVoltar, onNovoAtendimento }) => {
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [cacheNomes, setCacheNomes] = useState([]);

  // 1. CARGA ECONÔMICA (Cache para Autocomplete) - Roda 1 vez ao abrir
  useEffect(() => {
    const carregarNomesRecentes = async () => {
      const q = query(collection(db, "atendimentos_enfermagem"), orderBy("createdAt", "desc"), limit(40));
      const snap = await getDocs(q);
      const nomes = snap.docs.map(d => ({
        nome: d.data().nomePaciente,
        perfil: d.data().perfilPaciente,
        turma: d.data().turma
      }));
      // Remove duplicados localmente (não gasta cota)
      const unicos = nomes.filter((v, i, a) => a.findIndex(t => t.nome === v.nome) === i);
      setCacheNomes(unicos);
    };
    carregarNomesRecentes();
  }, []);

  const handleInputBusca = (e) => {
    const val = e.target.value;
    setBusca(val);
    if (val.length > 2) {
      const filtrados = cacheNomes.filter(p => p.nome.toLowerCase().includes(val.toLowerCase()));
      setSugestoes(filtrados);
    } else {
      setSugestoes([]);
    }
  };

  const pesquisarPaciente = async (nomeSelecionado) => {
    const nomeBusca = nomeSelecionado || busca;
    if (!nomeBusca.trim()) return;

    setLoading(true);
    setSugestoes([]);
    const termoBusca = nomeBusca.trim().toUpperCase();

    try {
      // BUSCAS PARALELAS (Otimizado)
      const qAlunos = query(collection(db, "alunos"), where("nomeBusca", "==", termoBusca), limit(1));
      const qFunc = query(collection(db, "funcionarios"), where("nomeBusca", "==", termoBusca), limit(1));
      const qSaude = query(collection(db, "questionarios_saude"), where("alunoNome", "==", nomeBusca), limit(1));
      const qAtend = query(
        collection(db, "atendimentos_enfermagem"), 
        where("nomePaciente", "==", nomeBusca), // Ajustado para seu campo exato
        orderBy("createdAt", "desc"),
        limit(15)
      );

      const [sAluno, sFunc, sSaude, sAtend] = await Promise.all([
        getDocs(qAlunos), getDocs(qFunc), getDocs(qSaude), getDocs(qAtend)
      ]);

      let perfil = null;
      if (!sAluno.empty) perfil = { ...sAluno.docs[0].data(), tipo: 'aluno' };
      else if (!sFunc.empty) perfil = { ...sFunc.docs[0].data(), tipo: 'funcionario' };

      setResultado({
        perfil: perfil,
        saude: !sSaude.empty ? sSaude.docs[0].data() : null,
        atendimentos: sAtend.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Header de Pesquisa com Autocomplete */}
      <div className="bg-[#0A1629] rounded-[30px] p-8 text-white mb-8 shadow-2xl relative overflow-visible">
        <div className="relative z-10">
          <button onClick={onVoltar} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
             <ArrowLeft size={14} /> Voltar ao Painel
          </button>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">
            Pasta Digital <span className="text-blue-500">Unificada</span>
          </h2>
          
          <div className="flex flex-col md:flex-row gap-2 relative">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="DIGITE O NOME PARA BUSCA..."
                className="w-full bg-white/10 border border-white/10 rounded-2xl py-5 px-12 text-sm font-bold focus:bg-white focus:text-slate-900 transition-all outline-none"
                value={busca}
                onChange={handleInputBusca}
              />
              
              {/* Dropdown de Sugestões Local */}
              {sugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden z-[100] border border-slate-200">
                  {sugestoes.map((s, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setBusca(s.nome); pesquisarPaciente(s.nome); }}
                      className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-none"
                    >
                      <span className="text-slate-700 font-black text-xs uppercase">{s.nome}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-bold uppercase">{s.perfil}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => pesquisarPaciente()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-5 rounded-2xl font-black text-xs uppercase italic tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Consultar'}
            </button>
          </div>
        </div>
      </div>

      {resultado ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna do Perfil e Alertas */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[35px] border border-slate-200 p-8 shadow-sm">
              <div className="flex flex-col items-center text-center mb-6">
                <div className={`p-5 rounded-3xl mb-4 ${resultado.perfil?.tipo === 'aluno' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {resultado.perfil?.tipo === 'aluno' ? <GraduationCap size={40} /> : <Briefcase size={40} />}
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase leading-tight">{busca}</h3>
                <span className="text-[10px] font-black px-4 py-1 bg-slate-100 rounded-full text-slate-500 mt-2 uppercase">{resultado.perfil?.tipo || 'Cadastro Geral'}</span>
              </div>

              {/* Botão NOVO BAM com dados injetados */}
              <button 
                onClick={() => onNovoAtendimento({
                  nome: busca,
                  perfil: resultado.perfil?.tipo || resultado.atendimentos[0]?.perfilPaciente || 'aluno',
                  turma: resultado.perfil?.turma || resultado.atendimentos[0]?.turma || '',
                  idade: resultado.perfil?.idade || resultado.atendimentos[0]?.idade || ''
                })}
                className="w-full mb-6 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-[20px] font-black uppercase italic text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100"
              >
                <PlusCircle size={18} /> Iniciar Novo BAM
              </button>

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <InfoRow label="Cartão SUS" value={resultado.perfil?.cartaoSus} />
                <InfoRow label={resultado.perfil?.tipo === 'aluno' ? 'Turma' : 'Cargo'} value={resultado.perfil?.turma || resultado.perfil?.cargo || resultado.atendimentos[0]?.turma} />
              </div>

              {/* Alertas Críticos da Ficha de Saúde */}
              {resultado.saude?.alergias?.possui === 'Sim' && (
                <div className="mt-6 bg-rose-50 rounded-2xl p-5 border border-rose-100">
                  <div className="flex items-center gap-2 text-rose-600 mb-2">
                    <ShieldAlert size={16} />
                    <span className="text-[10px] font-black uppercase">ALERGIA DETECTADA</span>
                  </div>
                  <p className="text-xs font-bold text-rose-800 uppercase">{resultado.saude.alergias.detalhes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Histórico de Atendimentos */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="flex items-center gap-3 text-slate-800 font-black uppercase italic tracking-tight text-lg ml-2">
              <Clock className="text-blue-600" /> Histórico de BAMs
            </h4>

            {resultado.atendimentos.length > 0 ? (
              <div className="space-y-4">
                {resultado.atendimentos.map((atend) => (
                  <div key={atend.id} className="bg-white rounded-[30px] p-6 border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${atend.encaminhadoHospital === 'sim' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-500'}`}>
                          <Activity size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">{atend.bam}</p>
                          <h5 className="font-black text-slate-800 uppercase italic text-sm">{atend.motivoEncaminhamento || atend.motivoAtendimento || 'Atendimento'}</h5>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-700">{atend.data}</p>
                        <p className="text-[10px] font-bold text-slate-400">{atend.horario}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 italic px-2 border-l-2 border-slate-100 mb-4 line-clamp-2">
                        {atend.observacoes || atend.procedimentos}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Prof: {atend.profissionalNome}</span>
                        <button className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1">Ver Detalhes <ChevronRight size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-[35px] border-2 border-dashed border-slate-200 p-20 text-center text-slate-400 font-black uppercase text-xs">
                Nenhum atendimento anterior.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-20 text-center opacity-30">
            <Search size={60} className="mx-auto mb-4" />
            <p className="font-black uppercase tracking-[0.3em] text-xs">Busca Unificada de Paciente</p>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
    <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
    <span className="text-sm font-bold text-slate-700">{value || '---'}</span>
  </div>
);

export default PastaDigital;