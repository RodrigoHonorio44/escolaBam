import React, { useEffect, useState, useMemo, useRef } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Brain, Search, Activity, Users, Zap, Wheelchair } from 'lucide-react';

const DashboardSaudeInclusiva = () => {
  const [alunosEspeciais, setAlunosEspeciais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  
  const inputRef = useRef(null);

  useEffect(() => {
    const buscarAlunosEspeciais = async () => {
      try {
        // Buscando da coleção 'alunos' (ou 'pastas_digitais' se preferir centralizar)
        const q = query(collection(db, "alunos"), where("isPCD", "==", "sim"), orderBy("nome", "asc"));
        const snap = await getDocs(q);
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAlunosEspeciais(lista);
      } catch (error) {
        console.error("Erro Firebase:", error);
      } finally {
        setLoading(false);
      }
    };
    buscarAlunosEspeciais();
  }, []);

  // 1. LÓGICA DOS CARDS DE CONTAGEM (ESTATÍSTICAS)
  const stats = useMemo(() => {
    const contar = (termo) => alunosEspeciais.filter(a => 
      a.tipoNecessidade?.toLowerCase().includes(termo.toLowerCase())
    ).length;

    return [
      { label: "Total PCD", qtd: alunosEspeciais.length, cor: "bg-slate-900", icon: <Users size={18} /> },
      { label: "Autismo / TEA", qtd: contar("tea") + contar("autismo"), cor: "bg-blue-600", icon: <Brain size={18} /> },
      { label: "TDAH", qtd: contar("tdah"), cor: "bg-purple-600", icon: <Zap size={18} /> },
      { label: "Cadeirantes", qtd: contar("cadeira") + contar("física"), cor: "bg-emerald-600", icon: <Wheelchair size={18} /> },
    ];
  }, [alunosEspeciais]);

  // 2. FILTRAGEM PARA A LISTA
  const alunosFiltrados = useMemo(() => {
    const termo = filtro.toLowerCase();
    return alunosEspeciais.filter(aluno => 
      aluno.nome?.toLowerCase().includes(termo) ||
      aluno.tipoNecessidade?.toLowerCase().includes(termo)
    );
  }, [alunosEspeciais, filtro]);

  const handleBusca = (e) => {
    const valor = e.target.value;
    clearTimeout(window.buscaTimeout);
    window.buscaTimeout = setTimeout(() => {
      setFiltro(valor);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABEÇALHO E BUSCA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-3xl font-black text-slate-800 uppercase italic flex items-center gap-3">
            <Brain className="text-purple-600" size={32} /> Saúde Inclusiva
          </h1>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              ref={inputRef}
              type="text"
              placeholder="BUSCAR NOME OU CONDIÇÃO..."
              onChange={handleBusca}
              autoFocus
              className="pl-12 pr-6 py-4 bg-white border-none shadow-xl rounded-2xl w-full md:w-96 font-black text-[10px] outline-none focus:ring-2 ring-purple-500 transition-all uppercase italic"
            />
          </div>
        </div>

        {/* CARDS DE CONTAGEM */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className={`w-10 h-10 ${item.cor} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                {item.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-3xl font-black text-slate-800 italic">{item.qtd}</p>
              </div>
            </div>
          ))}
        </div>

        {/* LISTAGEM DE ALUNOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <Activity className="animate-spin text-purple-600" size={48} />
            </div>
          ) : (
            alunosFiltrados.map((aluno) => (
              <div key={aluno.id} className="bg-white rounded-[40px] p-8 shadow-md border border-slate-100 border-b-8 border-b-purple-500 hover:scale-[1.01] transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-xl text-slate-800 uppercase italic leading-tight">{aluno.nome}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1">Turma: {aluno.turma || "Não informada"}</p>
                  </div>
                  <div className="bg-purple-50 text-purple-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase italic">
                    CID: {aluno.numeroCid || "---"}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-4">
                   <div className="p-3 bg-white rounded-xl shadow-sm text-purple-600"><Brain size={20}/></div>
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase">Condição Principal</p>
                     <p className="text-xs font-black text-slate-700 uppercase italic leading-none">{aluno.tipoNecessidade || "PCD"}</p>
                   </div>
                </div>
              </div>
            ))
          )}
          
          {!loading && alunosFiltrados.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
              <Brain size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-black uppercase italic text-sm tracking-widest">Nenhum aluno localizado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardSaudeInclusiva;