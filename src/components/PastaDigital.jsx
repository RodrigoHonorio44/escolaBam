import React, { useState } from 'react';
import { 
  Search, User, Briefcase, GraduationCap, Clock, 
  ChevronRight, FileText, AlertCircle, Calendar, 
  MapPin, Activity, Loader2, ArrowLeft
} from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const PastaDigital = ({ onVoltar }) => {
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null); // { perfil: {}, atendimentos: [] }

  const pesquisarPaciente = async (e) => {
    e.preventDefault();
    if (!busca.trim()) return;

    setLoading(true);
    const termoBusca = busca.trim().toUpperCase();

    try {
      // 1. Busca nos Alunos
      const qAlunos = query(collection(db, "alunos"), where("nomeBusca", "==", termoBusca));
      const snapAlunos = await getDocs(qAlunos);
      
      // 2. Busca nos Funcionários
      const qFunc = query(collection(db, "funcionarios"), where("nomeBusca", "==", termoBusca));
      const snapFunc = await getDocs(qFunc);

      // 3. Busca Histórico de Atendimentos (BAMs)
      const qAtendimentos = query(
        collection(db, "atendimentos_enfermagem"), 
        where("nomePacienteBusca", "==", termoBusca),
        orderBy("createdAt", "desc")
      );
      const snapAtend = await getDocs(qAtendimentos);

      let perfilEncontrado = null;
      if (!snapAlunos.empty) perfilEncontrado = { ...snapAlunos.docs[0].data(), tipo: 'aluno' };
      else if (!snapFunc.empty) perfilEncontrado = { ...snapFunc.docs[0].data(), tipo: 'funcionario' };

      const atendimentos = snapAtend.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setResultado({
        perfil: perfilEncontrado,
        atendimentos: atendimentos
      });
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Header de Pesquisa */}
      <div className="bg-[#0A1629] rounded-[30px] p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <button onClick={onVoltar} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
             <ArrowLeft size={14} /> Voltar ao Painel
          </button>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
            Pasta Digital <span className="text-blue-500">Unificada</span>
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Consulte o histórico clínico completo</p>
          
          <form onSubmit={pesquisarPaciente} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="DIGITE O NOME COMPLETO PARA BUSCA..."
                className="w-full bg-white/10 border border-white/10 rounded-2xl py-5 px-12 text-sm font-bold placeholder:text-slate-500 focus:bg-white focus:text-slate-900 transition-all outline-none"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 px-8 rounded-2xl font-black text-xs uppercase italic tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-blue-900/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Consultar'}
            </button>
          </form>
        </div>
      </div>

      {resultado ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna do Perfil (Esquerda) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[35px] border border-slate-200 p-8 shadow-sm">
              <div className="flex flex-col items-center text-center mb-6">
                <div className={`p-5 rounded-3xl mb-4 ${resultado.perfil?.tipo === 'aluno' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {resultado.perfil?.tipo === 'aluno' ? <GraduationCap size={40} /> : <Briefcase size={40} />}
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase leading-tight">
                  {resultado.perfil?.nome || busca.toUpperCase()}
                </h3>
                <span className="text-[10px] font-black px-4 py-1 bg-slate-100 rounded-full text-slate-500 mt-2 uppercase tracking-tighter">
                  {resultado.perfil?.tipo || 'Não cadastrado'}
                </span>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Cartão SUS</span>
                  <span className="text-sm font-bold text-slate-700">{resultado.perfil?.cartaoSus || '---'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">{resultado.perfil?.tipo === 'aluno' ? 'Turma' : 'Cargo'}</span>
                  <span className="text-sm font-bold text-slate-700">{resultado.perfil?.turma || resultado.perfil?.cargo || '---'}</span>
                </div>
              </div>

              {/* Alerta de Saúde */}
              <div className="mt-8 bg-orange-50 rounded-2xl p-5 border border-orange-100">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <AlertCircle size={16} />
                  <span className="text-[10px] font-black uppercase">Alertas Médicos</span>
                </div>
                <p className="text-xs font-bold text-orange-800 leading-relaxed">
                  {resultado.perfil?.historicoMedico || 'Nenhuma observação crítica registrada no cadastro.'}
                </p>
              </div>
            </div>
          </div>

          {/* Coluna do Histórico (Direita) */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="flex items-center gap-3 text-slate-800 font-black uppercase italic tracking-tight text-lg ml-2">
              <Clock className="text-blue-600" /> Linha do Tempo de Atendimentos
            </h4>

            {resultado.atendimentos.length > 0 ? (
              <div className="space-y-4">
                {resultado.atendimentos.map((atend) => (
                  <div key={atend.id} className="bg-white rounded-[30px] p-6 border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${atend.encaminhadoHospital === 'sim' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          <Activity size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">{atend.bam}</p>
                          <h5 className="font-black text-slate-800 uppercase italic text-sm">{atend.relatoCurto || atend.motivoAtendimento}</h5>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-700">{new Date(atend.dataAtendimento).toLocaleDateString('pt-BR')}</p>
                        <p className="text-[10px] font-bold text-slate-400">{atend.horario}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Temp.</p>
                        <p className="text-xs font-bold text-slate-700">{atend.temperatura}°C</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Procedimento</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{atend.procedimentos || 'Não informado'}</p>
                      </div>
                      <button className="flex items-center justify-end gap-1 text-[9px] font-black text-blue-600 uppercase hover:underline">
                        Ver ficha <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-[35px] border-2 border-dashed border-slate-200 p-20 text-center">
                <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-black uppercase text-xs">Nenhum atendimento registrado para este nome.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="mt-20 text-center">
           <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-300">
              <Search size={32} />
           </div>
           <h3 className="text-slate-400 font-black uppercase tracking-widest text-sm">Aguardando pesquisa...</h3>
           <p className="text-slate-300 text-[10px] mt-2 font-bold uppercase">Busque pelo nome idêntico ao cadastrado</p>
        </div>
      )}
    </div>
  );
};

export default PastaDigital;