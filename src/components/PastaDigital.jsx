import React, { useState, useEffect } from 'react';
import { 
  Search, User, Briefcase, GraduationCap, Clock, 
  ChevronRight, FileText, AlertCircle, Calendar, 
  MapPin, Activity, Loader2, ArrowLeft, PlusCircle, ShieldAlert,
  ChevronLeft, X, Heart, Thermometer, Info, Phone, Stethoscope, Syringe
} from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const PastaDigital = ({ onVoltar, onNovoAtendimento }) => {
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [cacheNomes, setCacheNomes] = useState([]);
  
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const itensPorPagina = 5;

  // --- FUNÇÃO DE IMPRESSÃO PROFISSIONAL ATUALIZADA ---
  const handleImprimir = (atend) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>BAENF - ${atend.nomePaciente}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 0; 
              margin: 0; 
              color: #0f172a; 
              background-color: #fff;
              -webkit-print-color-adjust: exact;
            }
            
            .page { 
              padding: 40px; 
              max-width: 800px; 
              margin: auto;
            }
            
            /* Cabeçalho de Documento Oficial */
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 3px solid #020617; 
              padding-bottom: 15px; 
              margin-bottom: 25px;
            }
            
            .brand h1 { 
              margin: 0; 
              font-size: 22px; 
              font-weight: 900; 
              text-transform: uppercase; 
              letter-spacing: -1px; 
              font-style: italic;
              color: #020617;
            }
            
            .brand h1 span { color: #2563eb; }
            .brand p { margin: 0; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
            
            .doc-type { text-align: right; }
            .doc-type div { font-size: 9px; font-weight: 900; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; }
            .doc-type h2 { margin: 0; font-size: 16px; font-weight: 900; color: #020617; }

            /* Alerta de Alergia Estilizado */
            .alerta-alergia {
              background: #fef2f2;
              border: 1px solid #ef4444;
              padding: 10px 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              color: #b91c1c;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            /* Grade de Informações */
            .section-label { 
              font-size: 9px; 
              font-weight: 900; 
              text-transform: uppercase; 
              color: #64748b; 
              margin-bottom: 6px; 
              letter-spacing: 0.5px;
              border-left: 3px solid #2563eb;
              padding-left: 8px;
            }

            .info-grid { 
              display: grid; 
              grid-template-cols: repeat(4, 1fr); 
              gap: 12px; 
              margin-bottom: 25px; 
            }
            
            .info-item { 
              background: #f8fafc; 
              padding: 10px; 
              border-radius: 6px; 
              border: 1px solid #e2e8f0;
            }
            
            .info-item .label { font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
            .info-item .value { font-size: 11px; font-weight: 700; color: #1e293b; }

            /* Blocos de Texto */
            .text-block { 
              margin-bottom: 20px; 
            }
            
            .content-area { 
              padding: 15px; 
              background: #fff;
              border: 1px solid #e2e8f0; 
              border-radius: 8px; 
              font-size: 12px; 
              line-height: 1.6;
              color: #334155;
              min-height: 50px;
            }
            
            .highlight { background: #f1f5f9; font-weight: 700; color: #0f172a; }

            /* Rodapé e Assinatura */
            .footer { 
              margin-top: 50px; 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-end;
              border-top: 1px solid #f1f5f9;
              padding-top: 20px;
            }
            
            .meta-info { font-size: 8px; color: #94a3b8; line-height: 1.4; }
            
            .signature-box { 
              text-align: center; 
              width: 250px;
            }
            
            .sig-line { border-top: 1px solid #020617; margin-bottom: 5px; }
            .sig-name { font-size: 11px; font-weight: 900; text-transform: uppercase; }
            .sig-role { font-size: 9px; color: #64748b; font-weight: 600; }

            @media print {
              body { padding: 0; }
              .page { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <header class="header">
              <div class="brand">
                <h1>SISTEMA <span>SAÚDE</span></h1>
                <p>${atend.escola || 'Unidade de Saúde Escolar'}</p>
              </div>
              <div class="doc-type">
                <div>Documento de Enfermagem</div>
                <h2>BAENF #${atend.baenf || 'S/N'}</h2>
              </div>
            </header>

            ${atend.qualAlergia || atend.alunoPossuiAlergia === 'Sim' ? `
              <div class="alerta-alergia">
                ⚠️ ALERGIA IDENTIFICADA: ${atend.qualAlergia || 'Não especificada'}
              </div>
            ` : ''}

            <div class="section-label">Dados do Paciente</div>
            <div class="info-grid">
              <div class="info-item" style="grid-column: span 2;">
                <div class="label">Paciente</div>
                <div class="value">${atend.nomePaciente}</div>
              </div>
              <div class="info-item">
                <div class="label">Data / Hora</div>
                <div class="value">${atend.dataAtendimento} às ${atend.horario}</div>
              </div>
              <div class="info-item">
                <div class="label">Turma/Setor</div>
                <div class="value">${atend.turma || '---'}</div>
              </div>
              <div class="info-item">
                <div class="label">Temperatura</div>
                <div class="value">${atend.temperatura ? atend.temperatura + '°C' : 'Não aferida'}</div>
              </div>
              <div class="info-item">
                <div class="label">Cartão SUS</div>
                <div class="value">${atend.cartaoSus || '---'}</div>
              </div>
              <div class="info-item" style="grid-column: span 2;">
                <div class="label">Status do Atendimento</div>
                <div class="value">${atend.statusAtendimento || 'Finalizado'}</div>
              </div>
            </div>

            <div class="text-block">
              <div class="section-label">Motivo do Atendimento / Queixa Principal</div>
              <div class="content-area highlight">
                ${atend.motivoAtendimento}
              </div>
            </div>

            <div class="text-block">
              <div class="section-label">Evolução e Conduta Técnica</div>
              <div class="content-area">
                ${atend.observacoes || 'Sem observações técnicas adicionais registradas no sistema.'}
              </div>
            </div>

            <footer class="footer">
              <div class="meta-info">
                Emitido em: ${new Date().toLocaleString('pt-BR')}<br>
                Autenticação Digital: ${atend.id}<br>
                Cópia do Prontuário Eletrônico
              </div>
              <div class="signature-box">
                <div class="sig-line"></div>
                <div class="sig-name">${atend.profissionalNome}</div>
                <div class="sig-role">${atend.profissionalRegistro || 'Enfermeiro(a) Responsável'}</div>
              </div>
            </footer>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  // 1. LÓGICA DE ALERTA DE ALERGIA
  const temAlergiaCritica = () => {
    if (!resultado) return false;
    const daSaude = resultado.saude?.alergias?.possui === 'Sim';
    const doPerfil = resultado.perfil?.alergias?.possui === 'Sim' || resultado.perfil?.alunoPossuiAlergia === 'Sim';
    const doAtendimento = resultado.atendimentos.some(a => a.alunoPossuiAlergia === 'Sim' || a.qualAlergia);
    return daSaude || doPerfil || doAtendimento;
  };

  const obterDetalhesAlergia = () => {
    return resultado?.saude?.alergias?.detalhes || 
           resultado?.perfil?.qualAlergia || 
           resultado?.atendimentos.find(a => a.qualAlergia)?.qualAlergia || 
           "Não especificada";
  };

  // 2. CARGA DE NOMES (AUTOCOMPLETE)
  useEffect(() => {
    const carregarNomesRecentes = async () => {
      try {
        const q = query(collection(db, "atendimentos_enfermagem"), orderBy("createdAt", "desc"), limit(50));
        const snap = await getDocs(q);
        const nomes = snap.docs.map(d => ({
          nome: d.data().nomePaciente,
          perfil: d.data().perfilPaciente,
          turma: d.data().turma
        }));
        const unicos = nomes.filter((v, i, a) => a.findIndex(t => t.nome === v.nome) === i);
        setCacheNomes(unicos);
      } catch (e) { console.error("Erro cache:", e); }
    };
    carregarNomesRecentes();
  }, []);

  // 3. LÓGICA PARA NOVO REGISTRO
  const handleAcaoRegistro = () => {
    if (!resultado) return;
    const ultimoAtend = resultado.atendimentos[0] || {};

    const payload = {
      ...(resultado.perfil || {}),
      nome: resultado.perfil?.nome || ultimoAtend.nomePaciente || busca,
      turma: resultado.perfil?.turma || ultimoAtend.turma || "",
      idade: resultado.perfil?.idade || ultimoAtend.idade || "",
      cartaoSus: resultado.perfil?.cartaoSus || ultimoAtend.cartaoSus || "",
      qualAlergia: resultado.perfil?.qualAlergia || ultimoAtend.qualAlergia || "",
      historicoSaude: resultado.saude || {},
      isEdicao: true,
      origem: 'pasta_digital'
    };

    const tipoDestino = (resultado.perfil?.tipo === 'funcionario' || ultimoAtend.perfilPaciente === 'funcionario') 
      ? 'FUNCIONARIO' : 'ALUNO';
    
    onNovoAtendimento({ tipo: tipoDestino, dados: payload });
  };

  const handleInputBusca = (e) => {
    const val = e.target.value;
    setBusca(val);
    if (val.length > 1) {
      const filtrados = cacheNomes.filter(p => p.nome.toLowerCase().includes(val.toLowerCase()));
      setSugestoes(filtrados);
    } else { setSugestoes([]); }
  };

  const pesquisarPaciente = async (nomeSelecionado) => {
    const nomeBusca = nomeSelecionado || busca;
    if (!nomeBusca.trim()) return;

    setLoading(true);
    setSugestoes([]);
    setPaginaAtual(1);
    const termoBusca = nomeBusca.trim().toUpperCase();

    try {
      const qAlunos = query(collection(db, "alunos"), where("nomeBusca", "==", termoBusca), limit(1));
      const qFunc = query(collection(db, "funcionarios"), where("nomeBusca", "==", termoBusca), limit(1));
      const qSaude = query(collection(db, "questionarios_saude"), where("alunoNome", "==", nomeBusca), limit(1));
      const qAtend = query(collection(db, "atendimentos_enfermagem"), where("nomePaciente", "==", nomeBusca), orderBy("createdAt", "desc"));

      const [sAluno, sFunc, sSaude, sAtend] = await Promise.all([
        getDocs(qAlunos), getDocs(qFunc), getDocs(qSaude), getDocs(qAtend)
      ]);

      let perfil = null;
      if (!sAluno.empty) perfil = { id: sAluno.docs[0].id, ...sAluno.docs[0].data(), tipo: 'aluno' };
      else if (!sFunc.empty) perfil = { id: sFunc.docs[0].id, ...sFunc.docs[0].data(), tipo: 'funcionario' };

      setResultado({
        perfil: perfil,
        saude: !sSaude.empty ? { id: sSaude.docs[0].id, ...sSaude.docs[0].data() } : null,
        atendimentos: sAtend.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });
    } catch (error) { console.error("Erro busca:", error); } 
    finally { setLoading(false); }
  };

  const totalPaginas = resultado ? Math.ceil(resultado.atendimentos.length / itensPorPagina) : 0;
  const atendimentosPaginados = resultado ? resultado.atendimentos.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina) : [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans">
      
      {/* MODAL: DETALHES DO ATENDIMENTO */}
      {atendimentoSelecionado && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl h-[95vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="bg-[#020617] p-8 text-white flex justify-between items-start border-b-4 border-blue-600">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Prontuário de Atendimento Digital</span>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mt-1">{atendimentoSelecionado.baenf || 'S/ BAM'}</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase">{atendimentoSelecionado.escola}</p>
              </div>
              <button onClick={() => setAtendimentoSelecionado(null)} className="p-2 bg-white/10 rounded-full hover:bg-red-500 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
              {temAlergiaCritica() && (
                <div className="bg-red-600 text-white p-6 rounded-[30px] shadow-xl animate-pulse flex items-center gap-5 border-4 border-red-400">
                  <ShieldAlert size={40} className="shrink-0" />
                  <div>
                    <h4 className="font-black uppercase italic tracking-tighter text-lg leading-none">Alergia Confirmada!</h4>
                    <p className="text-sm font-bold opacity-90 uppercase mt-1">{obterDetalhesAlergia()}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <VitalCard icon={<Thermometer className="text-orange-500"/>} label="Temperatura" value={`${atendimentoSelecionado.temperatura}°C`} />
                <VitalCard icon={<Clock className="text-blue-500"/>} label="Horário" value={atendimentoSelecionado.horario} />
                <VitalCard icon={<Activity className="text-green-500"/>} label="Status" value={atendimentoSelecionado.statusAtendimento} />
                <VitalCard icon={<Calendar className="text-purple-500"/>} label="Data" value={atendimentoSelecionado.dataAtendimento} />
              </div>

              <Section title="Queixa e Relato">
                <p className="text-sm font-black text-slate-800 uppercase italic leading-tight">{atendimentoSelecionado.motivoAtendimento}</p>
                <p className="text-xs text-slate-500 mt-3 bg-slate-50 p-4 rounded-xl border border-slate-100">{atendimentoSelecionado.observacoes || "Nenhuma observação técnica adicional."}</p>
              </Section>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Profissional</p>
                    <p className="text-xs font-black text-slate-800 uppercase italic">{atendimentoSelecionado.profissionalNome}</p>
                </div>
                <button 
                  onClick={() => handleImprimir(atendimentoSelecionado)}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all"
                >
                   <FileText size={16} /> Imprimir BAENF
                </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="bg-[#020617] rounded-[40px] p-10 text-white mb-8 shadow-2xl relative border-b-4 border-blue-600">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <button onClick={onVoltar} className="flex items-center gap-2 text-slate-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all">
               <ArrowLeft size={14} /> Voltar ao Painel
            </button>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">PASTA <span className="text-blue-600">DIGITAL</span></h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto min-w-[300px] md:min-w-[500px]">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="PESQUISAR NOME..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-12 text-sm font-bold focus:bg-white focus:text-slate-900 transition-all outline-none uppercase"
                value={busca}
                onChange={handleInputBusca}
              />
              {sugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden z-[100] border border-slate-200">
                  {sugestoes.map((s, i) => (
                    <div key={i} onClick={() => { setBusca(s.nome); pesquisarPaciente(s.nome); }}
                      className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50"
                    >
                      <span className="text-slate-700 font-black text-xs uppercase">{s.nome}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-black uppercase">{s.perfil}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => pesquisarPaciente()} disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-5 rounded-2xl font-black text-xs uppercase italic tracking-widest transition-all shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Sincronizar'}
            </button>
          </div>
        </div>
      </div>

      {resultado && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm relative overflow-hidden text-center">
              {temAlergiaCritica() && (
                <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 rounded-bl-2xl font-black text-[8px] uppercase tracking-tighter animate-pulse">
                  Alergia!
                </div>
              )}

              <div className={`w-20 h-20 rounded-[28px] mx-auto flex items-center justify-center mb-4 shadow-xl ${resultado.perfil?.tipo === 'aluno' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                {resultado.perfil?.tipo === 'aluno' ? <GraduationCap size={40} /> : <Briefcase size={40} />}
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase italic leading-tight">{resultado.perfil?.nome || busca}</h3>
              <span className="text-[9px] font-black px-3 py-1 bg-slate-100 rounded-lg text-slate-500 mt-2 uppercase">
                  {resultado.perfil?.turma || resultado.atendimentos[0]?.turma || 'Geral'}
              </span>

              <div className="space-y-3 pt-4 border-t border-slate-50 text-left mt-6">
                <InfoRow label="Cartão SUS" value={resultado.perfil?.cartaoSus || resultado.atendimentos[0]?.cartaoSus} />
                <InfoRow label="CPF" value={resultado.perfil?.cpf} />
                <InfoRow label="Idade" value={`${resultado.perfil?.idade || resultado.atendimentos[0]?.idade || '--'} anos`} />
              </div>

              <button onClick={handleAcaoRegistro}
                className="w-full mt-6 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <PlusCircle size={16} /> Novo Registro / Editar
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
             <div className="flex items-center justify-between px-4">
                <h4 className="flex items-center gap-3 text-slate-900 font-black uppercase italic text-xl">
                    <Activity className="text-blue-600" /> Histórico de BAM/BAENF
                </h4>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                    <button onClick={() => setPaginaAtual(p => Math.max(1, p-1))} disabled={paginaAtual === 1} className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-20"><ChevronLeft size={16}/></button>
                    <span className="text-[9px] font-black w-12 text-center uppercase">{paginaAtual} / {totalPaginas || 1}</span>
                    <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p+1))} disabled={paginaAtual === totalPaginas || totalPaginas === 0} className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-20"><ChevronRight size={16}/></button>
                </div>
             </div>

             <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Local</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocorrência</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {atendimentosPaginados.length > 0 ? atendimentosPaginados.map((atend) => (
                            <tr key={atend.id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="text-sm font-black text-slate-800">{atend.dataAtendimento}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase">{atend.escola}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${atend.encaminhadoHospital === 'sim' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                        <span className="text-xs font-black text-slate-700 uppercase italic">{atend.motivoAtendimento}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button 
                                        onClick={() => setAtendimentoSelecionado(atend)}
                                        className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase group-hover:bg-blue-600 transition-all shadow-md"
                                    >
                                        Ver Detalhes
                                    </button>
                                </td>
                            </tr>
                        )) : (
                          <tr>
                            <td colSpan="3" className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-xs italic">Nenhum atendimento anterior.</td>
                          </tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTES AUXILIARES
const Section = ({ title, children }) => (
    <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <Info size={12} className="text-blue-500" /> {title}
        </h4>
        <div className="bg-white p-5 rounded-[25px] border border-slate-100 shadow-sm">{children}</div>
    </div>
);

const VitalCard = ({ icon, label, value }) => (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-3 shadow-sm">
        <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
        <div>
            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{label}</p>
            <p className="text-xs font-black text-slate-800">{value || '---'}</p>
        </div>
    </div>
);

const InfoRow = ({ label, value, icon }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-none">
        <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">{icon}{label}</span>
        <span className="text-[11px] font-bold text-slate-700 uppercase italic truncate max-w-[120px] text-right">{value || '---'}</span>
    </div>
);

export default PastaDigital;