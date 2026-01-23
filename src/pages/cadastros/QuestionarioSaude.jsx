import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit, orderBy, startAt, endAt } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; 
import { 
  ClipboardCheck, HeartPulse, ShieldCheck, AlertTriangle, 
  Phone, Save, FileText, Loader2, ChevronLeft, Heart, Search, CheckCircle2, User,
  Stethoscope, Baby, Activity, Printer
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const QuestionarioSaude = ({ dadosEdicao, onVoltar, onSucesso, onClose, modoPastaDigital = !!dadosEdicao }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [buscandoNome, setBuscandoNome] = useState(false);
  
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const campoBuscaRef = useRef(null);
  
  const estadoInicial = useMemo(() => ({
    alunoNome: '',
    dataNascimento: '',
    turma: '',
    historicoDoencas: { possui: 'Não', detalhes: '' },
    alergias: { possui: 'Não', detalhes: '' },
    medicacaoContinua: { possui: 'Não', detalhes: '' },
    cirurgias: { possui: 'Não', detalhes: '' },
    diabetes: { possui: 'Não', tipo: '' }, 
    asma: { possui: 'Não', detalhes: '' },
    doencasCardiacas: { possui: 'Não', detalhes: '' },
    epilepsia: { possui: 'Não' },
    desmaioConvulsao: 'Não',
    problemaColuna: { possui: 'Não', detalhes: '' },
    restricoesAlimentares: { possui: 'Não', detalhes: '' },
    necessidadesEspeciais: { possui: 'Não', detalhes: '' },
    diagnosticoNeuro: { possui: 'Não', detalhes: '' }, 
    atrasoDesenvolvimento: { possui: 'Não', detalhes: '' },
    atrasoCrescimento: { possui: 'Não', detalhes: '' },
    tratamentoEspecializado: { 
      possui: 'Não', 
      psicologo: false, 
      fonoaudiologo: false, 
      terapiaOcupacional: false, 
      outro: '' 
    },
    vacinaStatus: '', 
    carteiraVacina: 'Não',
    vacinaAtualizada: 'Não',
    dentistaUltimaConsulta: '', 
    tipoParto: '', 
    viverCom: '', 
    dificuldades: {
      enxergar: false,
      falar: false,
      ouvir: false,
      andar: false,
      movimentarMembros: false
    },
    caminharDificuldade: 'Não',
    contatoEmergenciaPrioridade: '',
    contatos: [
      { nome: '', telefone: '' },
      { nome: '', telefone: '' }
    ],
    autorizacaoEmergencia: false,
    pacienteId: '',
  }), []);

  const [formData, setFormData] = useState(estadoInicial);

  useEffect(() => {
    const clickFora = (e) => {
      if (campoBuscaRef.current && !campoBuscaRef.current.contains(e.target)) setMostrarSugestoes(false);
    };
    document.addEventListener('mousedown', clickFora);
    return () => document.removeEventListener('mousedown', clickFora);
  }, []);

  // --- FUNÇÃO DE IMPRESSÃO ---
  const imprimirDocumento = () => {
    if (!formData.alunoNome) {
      toast.error("Selecione um aluno antes de imprimir.");
      return;
    }

    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Ficha Médica - ${formData.alunoNome}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; border: 1px solid #eee; padding: 15px; border-radius: 10px; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #2563eb; margin-bottom: 10px; border-bottom: 1px solid #eee; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .label { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #666; }
            .value { font-size: 12px; margin-bottom: 5px; }
            .alerta { color: red; font-weight: bold; }
            .assinatura { margin-top: 50px; display: flex; justify-content: space-between; }
            .campo-assinatura { border-top: 1px solid #000; width: 45%; text-align: center; padding-top: 5px; font-size: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0">FICHA MÉDICA ESCOLAR</h2>
            <p style="margin:5px 0; font-size: 12px;">Documento de Referência em Saúde do Aluno</p>
          </div>

          <div class="section">
            <div class="section-title">Identificação</div>
            <div class="grid">
              <div><span class="label">Nome:</span> <div class="value">${formData.alunoNome}</div></div>
              <div><span class="label">Turma:</span> <div class="value">${formData.turma || '---'}</div></div>
              <div><span class="label">Data de Nascimento:</span> <div class="value">${formData.dataNascimento || '---'}</div></div>
              <div><span class="label">Vive com:</span> <div class="value">${formData.viverCom || '---'}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Histórico e Alertas Clínicos</div>
            <div class="grid">
              <div><span class="label">Diabetes:</span> <div class="value ${formData.diabetes.possui === 'Sim' ? 'alerta' : ''}">${formData.diabetes.possui} ${formData.diabetes.tipo ? '('+formData.diabetes.tipo+')' : ''}</div></div>
              <div><span class="label">Alergias:</span> <div class="value ${formData.alergias.possui === 'Sim' ? 'alerta' : ''}">${formData.alergias.possui} ${formData.alergias.detalhes ? '- '+formData.alergias.detalhes : ''}</div></div>
              <div><span class="label">Medicação Contínua:</span> <div class="value">${formData.medicacaoContinua.possui} ${formData.medicacaoContinua.detalhes ? '- '+formData.medicacaoContinua.detalhes : ''}</div></div>
              <div><span class="label">Convulsões/Desmaios:</span> <div class="value">${formData.desmaioConvulsao}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Emergência e Contatos</div>
            <div class="grid">
              <div><span class="label">Avisar Prioridade:</span> <div class="value">${formData.contatoEmergenciaPrioridade || '---'}</div></div>
              <div><span class="label">Autorização Emergência:</span> <div class="value">${formData.autorizacaoEmergencia ? 'SIM (AUTORIZADO)' : 'NÃO'}</div></div>
              ${formData.contatos.map((c, i) => `
                <div><span class="label">Contato ${i+1}:</span> <div class="value">${c.nome} - ${c.telefone}</div></div>
              `).join('')}
            </div>
          </div>

          <div class="assinatura">
            <div class="campo-assinatura">Assinatura do Responsável</div>
            <div class="campo-assinatura">Coordenação Escolar / Saúde</div>
          </div>

          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const formatarTelefone = (valor) => {
    const tel = (valor || "").replace(/\D/g, "");
    if (tel.length <= 11) return tel.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
    return valor;
  };

  const buscarSugestoes = async (valor) => {
    const termo = valor.toUpperCase();
    if (termo.length < 3) { setSugestoes([]); setMostrarSugestoes(false); return; }
    setBuscandoNome(true);
    try {
      const q = query(collection(db, "pastas_digitais"), orderBy("nomeBusca"), startAt(termo), endAt(termo + '\uf8ff'), limit(6));
      const snap = await getDocs(q);
      setSugestoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMostrarSugestoes(true);
    } catch (error) { console.error(error); } finally { setBuscandoNome(false); }
  };

  const selecionarPaciente = async (paciente) => {
    setMostrarSugestoes(false);
    setFetching(true);
    try {
      const questSnap = await getDoc(doc(db, "questionarios_saude", paciente.id));
      if (questSnap.exists()) {
        setFormData({ ...estadoInicial, ...questSnap.data(), pacienteId: paciente.id });
      } else {
        setFormData(prev => ({
          ...prev,
          pacienteId: paciente.id,
          alunoNome: paciente.nome,
          dataNascimento: paciente.dataNascimento,
          turma: paciente.turma,
          contatos: [
            { nome: paciente.nomeContato1 || paciente.responsavel || '', telefone: formatarTelefone(paciente.contato || '') },
            { nome: paciente.nomeContato2 || '', telefone: formatarTelefone(paciente.contato2 || '') }
          ]
        }));
      }
    } catch (error) { toast.error("Erro ao carregar."); } finally { setFetching(false); }
  };

  const handleChange = (path, value) => {
    const keys = path.split('.');
    if (keys.length > 1) {
      setFormData(prev => ({ ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: value ?? '' } }));
    } else {
      setFormData(prev => ({ ...prev, [path]: value ?? '' }));
    }
  };

  const handleContactChange = (index, field, value) => {
    const novosContatos = [...formData.contatos];
    novosContatos[index][field] = field === 'telefone' ? formatarTelefone(value) : value;
    setFormData(prev => ({ ...prev, contatos: novosContatos }));
  };

  const handleDificuldadeToggle = (campo) => {
    setFormData(prev => ({
      ...prev,
      dificuldades: { ...prev.dificuldades, [campo]: !prev.dificuldades[campo] }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pacienteId) return toast.error("Selecione um aluno.");
    setLoading(true);
    try {
      const dadosParaSalvar = { ...formData, updatedAt: serverTimestamp(), statusFicha: 'Concluída' };
      await setDoc(doc(db, "questionarios_saude", formData.pacienteId), dadosParaSalvar, { merge: true });
      toast.success("Ficha Salva!");
      if (onSucesso) onSucesso();
    } catch (error) { toast.error("Erro ao salvar."); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 bg-[#FBFDFF] min-h-screen">
      <Toaster position="top-right" />
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* HEADER */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 text-white p-5 rounded-3xl">
              <ClipboardCheck size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase italic">Ficha Médica <span className="text-blue-600">Escolar</span></h1>
          </div>
          
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={imprimirDocumento}
              className="bg-white text-slate-700 border-2 border-slate-100 px-6 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all"
            >
              <Printer size={18} /> Imprimir
            </button>
            
            <button type="submit" className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest flex items-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Salvar Prontuário
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            
            <SectionCard icon={<Search size={18}/>} title="Identificação e Social">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={campoBuscaRef}>
                  <InputBlock label="Nome do Aluno">
                    <input className="input-premium" value={formData.alunoNome} onChange={(e) => { handleChange('alunoNome', e.target.value); buscarSugestoes(e.target.value); }} placeholder="BUSCAR..." />
                  </InputBlock>
                  {mostrarSugestoes && sugestoes.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                      {sugestoes.map((p) => (
                        <div key={p.id} onClick={() => selecionarPaciente(p)} className="p-4 hover:bg-blue-50 cursor-pointer text-[10px] font-black uppercase border-b border-slate-50">{p.nome}</div>
                      ))}
                    </div>
                  )}
                </div>
                <InputBlock label="O Aluno vive com:">
                  <select className="input-premium" value={formData.viverCom} onChange={(e) => handleChange('viverCom', e.target.value)}>
                    <option value="">SELECIONE...</option>
                    <option value="Pais">PAIS</option>
                    <option value="Só mãe">SÓ MÃE</option>
                    <option value="Só pai">SÓ PAI</option>
                    <option value="Avós">AVÓS</option>
                    <option value="Avô">AVÔ</option>
                    <option value="Avó">AVÓ</option>
                    <option value="Outros">OUTROS</option>
                  </select>
                </InputBlock>
              </div>
            </SectionCard>

            <SectionCard icon={<HeartPulse size={18}/>} title="Histórico Clínico">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-600 uppercase">Diabetes?</span>
                    <div className="flex gap-2">
                      {['Sim', 'Não'].map(opt => (
                        <button key={opt} type="button" onClick={() => handleChange('diabetes.possui', opt)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${formData.diabetes.possui === opt ? 'bg-blue-600 text-white' : 'bg-white text-slate-300'}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  {formData.diabetes.possui === 'Sim' && (
                    <div className="flex gap-2 mt-3">
                      {['Tipo 1', 'Tipo 2'].map(tipo => (
                        <button key={tipo} type="button" onClick={() => handleChange('diabetes.tipo', tipo)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${formData.diabetes.tipo === tipo ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-400'}`}>{tipo}</button>
                      ))}
                    </div>
                  )}
                </div>

                <RadioGroup label="Desmaio ou Convulsão?" value={formData.desmaioConvulsao} onChange={(v) => handleChange('desmaioConvulsao', v)} />
                <ToggleInput label="Alergias" value={formData.alergias} onChange={(v) => handleChange('alergias', v)} />
                <ToggleInput label="Medicação Contínua" value={formData.medicacaoContinua} onChange={(v) => handleChange('medicacaoContinua', v)} />
                <ToggleInput label="Epilepsia" value={formData.epilepsia} onChange={(v) => handleChange('epilepsia', v)} />
                <ToggleInput label="Problemas Respiratórios" value={formData.asma} onChange={(v) => handleChange('asma', v)} />
                <ToggleInput label="Atraso Desenvolvimento" value={formData.atrasoDesenvolvimento} onChange={(v) => handleChange('atrasoDesenvolvimento', v)} />
                <ToggleInput label="Atraso Crescimento" value={formData.atrasoCrescimento} onChange={(v) => handleChange('atrasoCrescimento', v)} />
                <ToggleInput label="Diagnóstico TEA/TDAH" value={formData.diagnosticoNeuro} onChange={(v) => handleChange('diagnosticoNeuro', v)} />
              </div>

              <div className="mt-6 p-5 bg-blue-50/30 rounded-[30px] border border-blue-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-blue-800 uppercase italic">Faz tratamento especializado?</span>
                  <div className="flex gap-2">
                    {['Sim', 'Não'].map(opt => (
                      <button key={opt} type="button" onClick={() => handleChange('tratamentoEspecializado.possui', opt)} className={`px-5 py-2 rounded-xl text-[10px] font-black ${formData.tratamentoEspecializado.possui === opt ? 'bg-blue-600 text-white' : 'bg-white text-slate-300'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
                {formData.tratamentoEspecializado.possui === 'Sim' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-wrap gap-2">
                      {['psicologo', 'fonoaudiologo', 'terapiaOcupacional'].map((key) => (
                        <button key={key} type="button" onClick={() => handleChange(`tratamentoEspecializado.${key}`, !formData.tratamentoEspecializado[key])}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${formData.tratamentoEspecializado[key] ? 'border-blue-500 bg-white text-blue-600' : 'border-transparent bg-slate-100 text-slate-400'}`}>
                          {key === 'terapiaOcupacional' ? 'T.O' : key}
                        </button>
                      ))}
                    </div>
                    <input className="input-premium !py-2 !text-[10px]" placeholder="OUTRO QUAL?" value={formData.tratamentoEspecializado.outro} onChange={(e) => handleChange('tratamentoEspecializado.outro', e.target.value)} />
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard icon={<Activity size={18}/>} title="Dificuldades e Mobilidade">
              <div className="space-y-6">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assinale as dificuldades apresentadas:</span>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries({ enxergar: 'Enxergar', falar: 'Falar', ouvir: 'Ouvir', andar: 'Andar', movimentarMembros: 'Membros' }).map(([key, label]) => (
                    <button key={key} type="button" onClick={() => handleDificuldadeToggle(key)} 
                      className={`p-3 rounded-2xl border-2 text-[9px] font-black uppercase flex flex-col items-center gap-2 transition-all ${formData.dificuldades[key] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                      <CheckCircle2 size={16} className={formData.dificuldades[key] ? 'text-blue-500' : 'text-slate-200'} />
                      {label}
                    </button>
                  ))}
                </div>
                <RadioGroup label="Tem dificuldade para Caminhar?" value={formData.caminharDificuldade} onChange={(v) => handleChange('caminharDificuldade', v)} />
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <SectionCard icon={<ShieldCheck size={18}/>} title="Prevenção e Vacina">
              <InputBlock label="Calendário Vacinal">
                <select className="input-premium" value={formData.vacinaStatus} onChange={(e) => handleChange('vacinaStatus', e.target.value)}>
                  <option value="">SELECIONE...</option>
                  <option value="Atualizado">ATUALIZADO</option>
                  <option value="Atrasado">ATRASADO</option>
                  <option value="Sem informação">SEM INFORMAÇÃO</option>
                </select>
              </InputBlock>
              <div className="mt-4 grid gap-4">
                <InputBlock label="Dentista (Última Consulta)">
                  <select className="input-premium" value={formData.dentistaUltimaConsulta} onChange={(e) => handleChange('dentistaUltimaConsulta', e.target.value)}>
                    <option value="">SELECIONE...</option>
                    <option value="1 mês">1 MÊS</option>
                    <option value="3 meses">3 MESES</option>
                    <option value="6 meses">6 MESES</option>
                    <option value="1 ano ou mais">1 ANO OU MAIS</option>
                  </select>
                </InputBlock>
                <InputBlock label="Tipo de Parto">
                  <select className="input-premium" value={formData.tipoParto} onChange={(e) => handleChange('tipoParto', e.target.value)}>
                    <option value="">SELECIONE...</option>
                    <option value="Normal">NORMAL</option>
                    <option value="Cesária">CESÁRIA</option>
                    <option value="Fórceps">FÓRCEPS</option>
                    <option value="Prematuro">PREMATURO</option>
                  </select>
                </InputBlock>
              </div>
            </SectionCard>

            <SectionCard icon={<AlertTriangle size={18}/>} title="Emergência">
              <div className="space-y-4">
                <InputBlock label="Avisar em prioridade:">
                  <select className="input-premium" value={formData.contatoEmergenciaPrioridade} onChange={(e) => handleChange('contatoEmergenciaPrioridade', e.target.value)}>
                    <option value="">SELECIONE...</option>
                    <option value="Mãe">MÃE</option>
                    <option value="Pai">PAI</option>
                    <option value="Responsável">RESPONSÁVEL</option>
                    <option value="Outro">OUTRO</option>
                  </select>
                </InputBlock>
                
                {formData.contatos.map((contato, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <input placeholder="NOME" className="input-premium !py-2 !text-[10px]" value={contato.nome} onChange={(e) => handleContactChange(idx, 'nome', e.target.value)} />
                    <input placeholder="TELEFONE" className="input-premium !py-2 !text-[10px]" value={contato.telefone} onChange={(e) => handleContactChange(idx, 'telefone', e.target.value)} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className={`p-6 rounded-[32px] border-2 transition-all ${formData.autorizacaoEmergencia ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
              <label className="flex gap-4 cursor-pointer items-center">
                <input type="checkbox" className="w-6 h-6 rounded-lg" checked={formData.autorizacaoEmergencia} onChange={(e) => handleChange('autorizacaoEmergencia', e.target.checked)} />
                <span className="text-[10px] font-black uppercase">Autorizo encaminhamento de emergência.</span>
              </label>
            </div>
          </div>
        </div>
      </form>
      
      <style>{`
        .input-premium { width: 100%; padding: 0.9rem 1.2rem; background-color: #fff; border-radius: 16px; font-weight: 700; font-size: 0.75rem; border: 2px solid #f1f5f9; outline: none; transition: all 0.3s; text-transform: uppercase; }
        .input-premium:focus { border-color: #3b82f6; }
      `}</style>
    </div>
  );
};

const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm relative">
    <div className="flex items-center gap-3 mb-6">
      <div className="text-blue-600 bg-blue-50 p-2 rounded-xl">{icon}</div>
      <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">{title}</h2>
    </div>
    {children}
  </div>
);

const InputBlock = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const RadioGroup = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
    <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
    <div className="flex gap-2">
      {['Sim', 'Não'].map(opt => (
        <button key={opt} type="button" onClick={() => onChange(opt)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${value === opt ? 'bg-slate-800 text-white' : 'bg-white text-slate-300'}`}>{opt}</button>
      ))}
    </div>
  </div>
);

const ToggleInput = ({ label, value, onChange }) => (
  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-tighter">{label}</span>
      <div className="flex gap-1">
        {['Sim', 'Não'].map((opt) => (
          <button key={opt} type="button" onClick={() => onChange({ ...value, possui: opt })} className={`px-3 py-1.5 rounded-xl text-[9px] font-black ${value.possui === opt ? 'bg-blue-600 text-white' : 'bg-white text-slate-300'}`}>{opt}</button>
        ))}
      </div>
    </div>
    {value.possui === 'Sim' && (
      <input className="input-premium mt-3 !py-2 !text-[10px]" placeholder="ESPECIFIQUE..." value={value.detalhes} onChange={(e) => onChange({ ...value, detalhes: e.target.value })} />
    )}
  </div>
);

export default QuestionarioSaude;