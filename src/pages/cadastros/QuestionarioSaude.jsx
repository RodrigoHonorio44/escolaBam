import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit, orderBy, startAt, endAt } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; 
import { 
  ClipboardCheck, HeartPulse, ShieldCheck, AlertTriangle, 
  Phone, Save, FileText, Loader2, ChevronLeft, Heart, Search, CheckCircle2, User
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const QuestionarioSaude = ({ dadosEdicao, onVoltar, onSucesso, onClose, modoPastaDigital = !!dadosEdicao }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [buscandoNome, setBuscandoNome] = useState(false);
  
  // Estados para busca dinâmica
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
    diabetes: { possui: 'Não', detalhes: '' },
    asma: { possui: 'Não', detalhes: '' },
    doencasCardiacas: { possui: 'Não', detalhes: '' },
    epilepsia: { possui: 'Não' },
    carteiraVacina: 'Não',
    vacinaAtualizada: 'Não',
    contatoEmergenciaPrioridade: '',
    contatoEmergenciaOutro: '',
    planoSaude: { possui: 'Não', detalhes: '' },
    restricoesAlimentares: { possui: 'Não', detalhes: '' },
    necessidadesEspeciais: { possui: 'Não', detalhes: '' },
    historicoViolencia: { possui: 'Não', detalhes: '' },
    atestadoAtividadeFisica: '',
    contatos: [
      { nome: '', telefone: '' },
      { nome: '', telefone: '' }
    ],
    autorizacaoEmergencia: false,
    pacienteId: '' 
  }), []);

  const [formData, setFormData] = useState(estadoInicial);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const clickFora = (e) => {
      if (campoBuscaRef.current && !campoBuscaRef.current.contains(e.target)) setMostrarSugestoes(false);
    };
    document.addEventListener('mousedown', clickFora);
    return () => document.removeEventListener('mousedown', clickFora);
  }, []);

  const handleActionVoltar = () => {
    if (modoPastaDigital && onClose) onClose();
    else if (onVoltar) onVoltar();
    else navigate('/dashboard');
  };

  const formatarTelefone = (valor) => {
    const tel = (valor || "").replace(/\D/g, "");
    if (tel.length <= 11) return tel.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
    return valor;
  };

  const buscarSugestoes = async (valor) => {
    const termo = valor.toUpperCase();
    if (termo.length < 3) {
      setSugestoes([]);
      setMostrarSugestoes(false);
      return;
    }

    setBuscandoNome(true);
    try {
      const q = query(
        collection(db, "pastas_digitais"),
        orderBy("nomeBusca"),
        startAt(termo),
        endAt(termo + '\uf8ff'),
        limit(6)
      );
      
      const snap = await getDocs(q);
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSugestoes(lista);
      setMostrarSugestoes(true);
    } catch (error) {
      console.error(error);
    } finally {
      setBuscandoNome(false);
    }
  };

  const selecionarPaciente = async (paciente) => {
    setMostrarSugestoes(false);
    setFetching(true);
    try {
      const id = paciente.id;
      const questSnap = await getDoc(doc(db, "questionarios_saude", id));

      if (questSnap.exists()) {
        setFormData({ ...estadoInicial, ...questSnap.data(), pacienteId: id });
        toast.success("Prontuário recuperado!");
      } else {
        setFormData(prev => ({
          ...prev,
          pacienteId: id,
          alunoNome: paciente.nome || '',
          dataNascimento: paciente.dataNascimento || '',
          turma: paciente.turma || '',
          contatos: [
            { nome: paciente.nomeContato1 || paciente.responsavel || '', telefone: formatarTelefone(paciente.contato || '') },
            { nome: paciente.nomeContato2 || '', telefone: formatarTelefone(paciente.contato2 || '') }
          ]
        }));
        toast.success("Aluno vinculado!");
      }
    } catch (error) {
      toast.error("Erro ao carregar.");
    } finally {
      setFetching(false);
    }
  };

  const idadeCalculada = useMemo(() => {
    if (!formData.dataNascimento) return "";
    const hoje = new Date();
    const nasc = new Date(formData.dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade >= 0 ? `${idade} ANOS` : "";
  }, [formData.dataNascimento]);

  useEffect(() => {
    const carregarDados = async () => {
      if (!dadosEdicao?.id) return;
      setFetching(true);
      try {
        const idLimpo = String(dadosEdicao.id);
        const questSnap = await getDoc(doc(db, "questionarios_saude", idLimpo));
        if (questSnap.exists()) {
          setFormData({ ...estadoInicial, ...questSnap.data(), pacienteId: idLimpo });
        } else {
          setFormData(prev => ({
            ...prev,
            pacienteId: idLimpo,
            alunoNome: dadosEdicao.nome || '',
            dataNascimento: dadosEdicao.dataNascimento || '',
            turma: dadosEdicao.turma || '',
            contatos: [
              { nome: dadosEdicao.nomeContato1 || '', telefone: formatarTelefone(dadosEdicao.contato || '') },
              { nome: dadosEdicao.nomeContato2 || '', telefone: formatarTelefone(dadosEdicao.contato2 || '') }
            ]
          }));
        }
      } catch (error) { console.error(error); }
      finally { setFetching(false); }
    };
    carregarDados();
  }, [dadosEdicao, estadoInicial]);

  const handleChange = (path, value) => {
    const keys = path.split('.');
    if (keys.length > 1) {
      setFormData(prev => ({ ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: value ?? '' } }));
    } else {
      setFormData(prev => ({ ...prev, [path]: value ?? '' }));
    }
  };

  const handleContactChange = (index, field, value) => {
    setFormData(prev => {
      const novosContatos = [...prev.contatos];
      novosContatos[index] = { ...novosContatos[index], [field]: field === 'telefone' ? formatarTelefone(value) : value };
      return { ...prev, contatos: novosContatos };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pacienteId) return toast.error("Selecione um aluno da lista.");
    if (!formData.autorizacaoEmergencia) return toast.error("Autorize o encaminhamento de emergência.");

    setLoading(true);
    try {
      const dadosParaSalvar = { 
        ...formData, 
        nomeBusca: formData.alunoNome.trim().toUpperCase(), 
        updatedAt: serverTimestamp(), 
        statusFicha: 'Concluída' 
      };
      await setDoc(doc(db, "questionarios_saude", formData.pacienteId), dadosParaSalvar, { merge: true });
      await setDoc(doc(db, "pastas_digitais", formData.pacienteId), { 
        temQuestionarioSaude: true, 
        lastUpdate: serverTimestamp() 
      }, { merge: true });

      toast.success("Ficha Sincronizada!");
      if (onSucesso) onSucesso();
      if (modoPastaDigital && onClose) onClose();
    } catch (error) { toast.error("Erro ao salvar."); }
    finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-blue-600" size={40}/>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 bg-[#FBFDFF] min-h-screen selection:bg-blue-100">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-8">
        <button type="button" onClick={handleActionVoltar} className="group flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-all">
          <div className="p-2 rounded-xl group-hover:bg-blue-50 transition-colors"><ChevronLeft size={20} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
        </button>
        <div className="bg-rose-50 px-4 py-2 rounded-2xl flex items-center gap-3 border border-rose-100">
          <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse"/>
          <span className="text-rose-600 font-black uppercase text-[9px]">Prontuário Digital</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* CABEÇALHO PRINCIPAL */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 text-white p-5 rounded-3xl shadow-xl shadow-blue-100">
                {buscandoNome || loading ? <Loader2 className="animate-spin" size={32} /> : <ClipboardCheck size={32} />}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase italic">
                Ficha Médica <span className="text-blue-600">Escolar</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                {formData.pacienteId ? <><CheckCircle2 size={14} className="text-green-500"/> {formData.alunoNome}</> : 'Aguardando seleção de aluno'}
              </p>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full lg:w-auto bg-slate-900 hover:bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Finalizar e Salvar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUNA ESQUERDA */}
          <div className="lg:col-span-8 space-y-8">
            <SectionCard icon={<Search size={18}/>} title="Identificação do Aluno">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6 relative" ref={campoBuscaRef}>
                  <InputBlock label="Nome Completo">
                    <div className="relative">
                      <input 
                        className={`input-premium ${formData.pacienteId ? 'border-green-200 bg-green-50/20' : ''}`}
                        value={formData.alunoNome} 
                        onChange={(e) => {
                          const v = e.target.value;
                          handleChange('alunoNome', v);
                          buscarSugestoes(v);
                          if(formData.pacienteId) handleChange('pacienteId', '');
                        }}
                        placeholder="DIGITE PARA BUSCAR NA PASTA..."
                      />
                      <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </InputBlock>
                  
                  {mostrarSugestoes && sugestoes.length > 0 && (
                    <div className="absolute z-[100] w-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {sugestoes.map((p) => (
                        <div key={p.id} onClick={() => selecionarPaciente(p)} className="p-4 hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><User size={14}/></div>
                            <span className="text-[10px] font-black text-slate-700 uppercase">{p.nome}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">TURMA: {p.turma}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-3">
                  <InputBlock label="Nascimento">
                    <input type="date" className="input-premium" value={formData.dataNascimento} onChange={(e) => handleChange('dataNascimento', e.target.value)} />
                  </InputBlock>
                </div>
                <div className="md:col-span-3">
                  <InputBlock label="Idade">
                    <div className="input-premium bg-slate-50 flex items-center justify-center text-blue-600 font-black">
                      {idadeCalculada || '--'}
                    </div>
                  </InputBlock>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={<HeartPulse size={18}/>} title="Histórico Clínico Detalhado">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ToggleInput label="Alergias Graves" value={formData.alergias} onChange={(v) => handleChange('alergias', v)} />
                <ToggleInput label="Doenças Crônicas" value={formData.historicoDoencas} onChange={(v) => handleChange('historicoDoencas', v)} />
                <ToggleInput label="Uso de Medicação" value={formData.medicacaoContinua} onChange={(v) => handleChange('medicacaoContinua', v)} />
                <ToggleInput label="Cirurgias Recentes" value={formData.cirurgias} onChange={(v) => handleChange('cirurgias', v)} />
                <ToggleInput label="Diabetes" value={formData.diabetes} onChange={(v) => handleChange('diabetes', v)} />
                <ToggleInput label="Problemas Respiratórios" value={formData.asma} onChange={(v) => handleChange('asma', v)} />
                <ToggleInput label="Problemas Cardíacos" value={formData.doencasCardiacas} onChange={(v) => handleChange('doencasCardiacas', v)} />
                <ToggleInput label="Epilepsia" value={formData.epilepsia} onChange={(v) => handleChange('epilepsia', v)} />
              </div>
            </SectionCard>

            <SectionCard icon={<FileText size={18}/>} title="Restrições e Especialidades">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ToggleInput label="Restrição Alimentar" value={formData.restricoesAlimentares} onChange={(v) => handleChange('restricoesAlimentares', v)} isTextArea />
                  <ToggleInput label="Necessidades Especiais" value={formData.necessidadesEspeciais} onChange={(v) => handleChange('necessidadesEspeciais', v)} isTextArea />
                  <ToggleInput label="Plano de Saúde" value={formData.planoSaude} onChange={(v) => handleChange('planoSaude', v)} />
                  <ToggleInput label="Histórico de Violência" value={formData.historicoViolencia} onChange={(v) => handleChange('historicoViolencia', v)} />
               </div>
            </SectionCard>
          </div>

          {/* COLUNA DIREITA */}
          <div className="lg:col-span-4 space-y-8">
            <SectionCard icon={<ShieldCheck size={18}/>} title="Status Vacinal">
              <div className="space-y-4">
                <RadioGroup label="Possui Caderneta?" value={formData.carteiraVacina} onChange={(v) => handleChange('carteiraVacina', v)} />
                <RadioGroup label="Está Atualizada?" value={formData.vacinaAtualizada} onChange={(v) => handleChange('vacinaAtualizada', v)} />
              </div>
            </SectionCard>

            <SectionCard icon={<AlertTriangle size={18}/>} title="Emergência e Contatos">
              <div className="space-y-4">
                <InputBlock label="Avisar primeiro quem?">
                  <select className="input-premium" value={formData.contatoEmergenciaPrioridade} onChange={(e) => handleChange('contatoEmergenciaPrioridade', e.target.value)}>
                    <option value="">SELECIONE...</option>
                    <option value="Mãe">MÃE</option>
                    <option value="Pai">PAI</option>
                    <option value="Responsável">RESPONSÁVEL</option>
                    <option value="Outro">OUTRO</option>
                  </select>
                </InputBlock>
                
                {formData.contatoEmergenciaPrioridade === 'Outro' && (
                  <input placeholder="ESPECIFIQUE O CONTATO..." className="input-premium !py-2 !text-[10px]" value={formData.contatoEmergenciaOutro} onChange={(e) => handleChange('contatoEmergenciaOutro', e.target.value)} />
                )}

                <div className="pt-4 border-t border-slate-50 space-y-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contatos Auxiliares</span>
                  {formData.contatos.map((contato, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <input placeholder="NOME" className="input-premium !py-2 !text-[10px] !bg-white" value={contato.nome} onChange={(e) => handleContactChange(idx, 'nome', e.target.value)} />
                      <input placeholder="TELEFONE" className="input-premium !py-2 !text-[10px] !bg-white" value={contato.telefone} onChange={(e) => handleContactChange(idx, 'telefone', e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <div className={`p-6 rounded-[32px] border-2 transition-all ${formData.autorizacaoEmergencia ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-100' : 'bg-white border-slate-100 text-slate-400'}`}>
                <label className="flex gap-4 cursor-pointer items-center">
                    <input 
                      type="checkbox" 
                      className="w-6 h-6 rounded-lg border-2 border-slate-200 text-blue-500 focus:ring-0" 
                      checked={formData.autorizacaoEmergencia} 
                      onChange={(e) => handleChange('autorizacaoEmergencia', e.target.checked)} 
                    />
                    <span className="text-[10px] font-black uppercase tracking-tight leading-tight">
                        Autorizo o encaminhamento para unidade de saúde em caso de emergência.
                    </span>
                </label>
            </div>
          </div>
        </div>
      </form>

      <style>{`
        .input-premium { width: 100%; padding: 0.9rem 1.2rem; background-color: #fff; border-radius: 16px; font-weight: 700; font-size: 0.75rem; outline: none; border: 2px solid #f1f5f9; transition: all 0.3s ease; color: #1e293b; text-transform: uppercase; }
        .input-premium:focus { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08); }
        .input-premium::placeholder { color: #cbd5e1; font-size: 0.65rem; }
      `}</style>
    </div>
  );
};

// COMPONENTES AUXILIARES
const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white p-6 md:p-8 rounded-[35px] border border-slate-100 shadow-sm relative">
    <div className="flex items-center gap-3 mb-6">
        <div className="text-blue-600 bg-blue-50 p-2 rounded-xl">{icon}</div>
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">{title}</h2>
    </div>
    {children}
  </div>
);

const InputBlock = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    {children}
  </div>
);

const RadioGroup = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
    <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
    <div className="flex gap-2">
      {['Sim', 'Não'].map(opt => (
        <button key={opt} type="button" onClick={() => onChange(opt)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${value === opt ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-300 border border-slate-100'}`}>
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const ToggleInput = ({ label, value, onChange, isTextArea = false }) => (
  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 transition-all hover:bg-white group">
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-tighter">{label}</span>
      <div className="flex gap-1">
        {['Sim', 'Não'].map((opt) => (
          <button key={opt} type="button" onClick={() => onChange({ ...value, possui: opt })}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${value.possui === opt ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-300 border border-slate-100'}`}
          >{opt}</button>
        ))}
      </div>
    </div>
    {value.possui === 'Sim' && (
      <div className="animate-in slide-in-from-top-1 duration-200">
        {isTextArea ? (
           <textarea className="input-premium mt-3 !py-2 !text-[10px] border-blue-100 min-h-[60px]" placeholder="DESCREVA AQUI..." value={value.detalhes} onChange={(e) => onChange({ ...value, detalhes: e.target.value })} />
        ) : (
          <input className="input-premium mt-3 !py-2 !text-[10px] border-blue-100" placeholder="ESPECIFIQUE..." value={value.detalhes} onChange={(e) => onChange({ ...value, detalhes: e.target.value })} />
        )}
      </div>
    )}
  </div>
);

export default QuestionarioSaude;