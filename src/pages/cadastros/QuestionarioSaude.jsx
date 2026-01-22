import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; 
import { 
  ClipboardCheck, HeartPulse, ShieldCheck, 
  Phone, Save, Loader2, ChevronLeft, Heart, Search, CheckCircle2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const QuestionarioSaude = ({ dadosEdicao, onVoltar, onSucesso, onClose, modoPastaDigital = !!dadosEdicao }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [buscandoNome, setBuscandoNome] = useState(false);
  
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
    contatos: [
      { nome: '', telefone: '' },
      { nome: '', telefone: '' }
    ],
    autorizacaoEmergencia: false,
    pacienteId: '' 
  }), []);

  const [formData, setFormData] = useState(estadoInicial);

  // Handlers
  const handleActionVoltar = useCallback(() => {
    if (modoPastaDigital && onClose) return onClose();
    if (onVoltar) return onVoltar();
    navigate('/dashboard');
  }, [modoPastaDigital, onClose, onVoltar, navigate]);

  const formatarTelefone = (valor) => {
    const tel = (valor || "").replace(/\D/g, "");
    if (tel.length <= 11) return tel.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
    return valor;
  };

  const buscarPacientePorNome = async (nomeDigitado) => {
    const nomeLimpo = nomeDigitado?.trim().toUpperCase();
    if (!nomeLimpo || nomeLimpo.length < 3 || formData.pacienteId || modoPastaDigital) return;

    setBuscandoNome(true);
    try {
      const q = query(collection(db, "pastas_digitais"), where("nomeBusca", "==", nomeLimpo), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const d = docSnap.data();
        const idEncontrado = docSnap.id;
        
        const questRef = doc(db, "questionarios_saude", idEncontrado);
        const questSnap = await getDoc(questRef);

        if (questSnap.exists()) {
          setFormData({ ...estadoInicial, ...questSnap.data(), pacienteId: idEncontrado });
          toast.success("Prontuário recuperado!");
        } else {
          setFormData(prev => ({
            ...prev,
            pacienteId: idEncontrado,
            alunoNome: d.nome || '',
            dataNascimento: d.dataNascimento || '',
            turma: d.turma || '',
            contatos: [
              { nome: d.nomeContato1 || d.responsavel || '', telefone: d.contato || '' },
              { nome: d.nomeContato2 || '', telefone: d.contato2 || '' }
            ]
          }));
          toast.success("Paciente vinculado!");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBuscandoNome(false);
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
        const questRef = doc(db, "questionarios_saude", idLimpo);
        const questSnap = await getDoc(questRef);
        if (questSnap.exists()) {
          setFormData({ ...estadoInicial, ...questSnap.data(), pacienteId: idLimpo });
        } else {
          setFormData(prev => ({
            ...prev,
            pacienteId: idLimpo,
            alunoNome: dadosEdicao.nome || '',
            dataNascimento: dadosEdicao.dataNascimento || '',
            contatos: [
              { nome: dadosEdicao.nomeContato1 || '', telefone: dadosEdicao.contato || '' },
              { nome: dadosEdicao.nomeContato2 || '', telefone: dadosEdicao.contato2 || '' }
            ]
          }));
        }
      } catch (error) {
        toast.error("Falha ao sincronizar dados.");
      } finally {
        setFetching(false);
      }
    };
    carregarDados();
  }, [dadosEdicao, estadoInicial]);

  const handleChange = (path, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      if (keys.length > 1) return { ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: value ?? '' } };
      return { ...prev, [path]: value ?? '' };
    });
  };

  const handleContactChange = (index, field, value) => {
    const novosContatos = [...formData.contatos];
    novosContatos[index] = { ...novosContatos[index], [field]: field === 'telefone' ? formatarTelefone(value) : (value ?? '') };
    setFormData(prev => ({ ...prev, contatos: novosContatos }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const docId = formData.pacienteId || (dadosEdicao?.id ? String(dadosEdicao.id) : null);
    if (!docId) return toast.error("Selecione um paciente válido.");
    if (!formData.autorizacaoEmergencia) return toast.error("Confirme a autorização de emergência.");
    
    setLoading(true);
    try {
      const dadosParaSalvar = { 
        ...formData, 
        pacienteId: docId, 
        updatedAt: serverTimestamp(), 
        statusFicha: 'Concluída' 
      };
      await setDoc(doc(db, "questionarios_saude", docId), dadosParaSalvar, { merge: true });
      await setDoc(doc(db, "pastas_digitais", docId), { temQuestionarioSaude: true, lastUpdate: serverTimestamp() }, { merge: true });
      
      toast.success("Ficha Salva com Sucesso!");
      if (onSucesso) onSucesso();
      if (modoPastaDigital && onClose) onClose();
    } catch (error) {
      toast.error("Erro ao salvar prontuário.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando Prontuário</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 bg-[#FBFDFF] min-h-screen font-sans selection:bg-blue-100">
      <Toaster position="top-right" />
      
      {/* HEADER NAVEGAÇÃO */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={handleActionVoltar} className="group flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-all">
          <div className="p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="bg-rose-50 px-4 py-2 rounded-2xl flex items-center gap-3 border border-rose-100">
            <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse"/>
            <span className="text-rose-600 font-black uppercase text-[9px]">Sessão Ativa</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* HERO SECTION */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 text-white p-5 rounded-3xl shadow-xl shadow-blue-100">
                {buscandoNome ? <Loader2 className="animate-spin" size={32} /> : <ClipboardCheck size={32} />}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase italic">
                Questionário de <span className="text-blue-600">Saúde</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                {formData.alunoNome ? <><CheckCircle2 size={14} className="text-green-500"/> {formData.alunoNome}</> : 'Aguardando Identificação'}
              </p>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full lg:w-auto bg-slate-900 hover:bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3 disabled:bg-slate-200">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            Salvar Registro
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LADO ESQUERDO */}
          <div className="lg:col-span-8 space-y-8">
            <SectionCard icon={<Search size={18}/>} title="Identificação">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <InputBlock label="Nome do Aluno (Busca Automática)">
                    <div className="relative group">
                      <input 
                        className={`input-premium ${formData.pacienteId ? 'border-green-200 bg-green-50/20' : ''}`}
                        value={formData.alunoNome} 
                        onChange={(e) => {
                          handleChange('alunoNome', e.target.value);
                          if(formData.pacienteId) handleChange('pacienteId', '');
                        }}
                        onBlur={(e) => buscarPacientePorNome(e.target.value)}
                        placeholder="DIGITE O NOME PARA PESQUISAR..."
                      />
                      <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </InputBlock>
                </div>
                <div className="md:col-span-4">
                  <InputBlock label="Data de Nascimento">
                    <input type="date" className="input-premium" value={formData.dataNascimento} onChange={(e) => handleChange('dataNascimento', e.target.value)} />
                  </InputBlock>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={<HeartPulse size={18}/>} title="Triagem Clínica">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ToggleInput label="Alergias" value={formData.alergias} onChange={(v) => handleChange('alergias', v)} />
                <ToggleInput label="Doenças Crônicas" value={formData.historicoDoencas} onChange={(v) => handleChange('historicoDoencas', v)} />
                <ToggleInput label="Medicação Contínua" value={formData.medicacaoContinua} onChange={(v) => handleChange('medicacaoContinua', v)} />
                <ToggleInput label="Cirurgias" value={formData.cirurgias} onChange={(v) => handleChange('cirurgias', v)} />
                <ToggleInput label="Diabetes" value={formData.diabetes} onChange={(v) => handleChange('diabetes', v)} />
                <ToggleInput label="Asma / Respiratório" value={formData.asma} onChange={(v) => handleChange('asma', v)} />
                <ToggleInput label="Cardiopatias" value={formData.doencasCardiacas} onChange={(v) => handleChange('doencasCardiacas', v)} />
                <ToggleInput label="Epilepsia" value={formData.epilepsia} onChange={(v) => handleChange('epilepsia', v)} />
              </div>
            </SectionCard>
          </div>

          {/* LADO DIREITO */}
          <div className="lg:col-span-4 space-y-8">
            <SectionCard icon={<ShieldCheck size={18}/>} title="Vacinação">
              <div className="space-y-4">
                <RadioGroup label="Possui Caderneta?" value={formData.carteiraVacina} onChange={(v) => handleChange('carteiraVacina', v)} />
                <RadioGroup label="Está Atualizada?" value={formData.vacinaAtualizada} onChange={(v) => handleChange('vacinaAtualizada', v)} />
              </div>
            </SectionCard>

            <SectionCard icon={<Phone size={18}/>} title="Contatos">
              <div className="space-y-4">
                <InputBlock label="Parentesco Prioritário">
                  <select className="input-premium cursor-pointer" value={formData.contatoEmergenciaPrioridade} onChange={(e) => handleChange('contatoEmergenciaPrioridade', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Responsável">Responsável</option>
                  </select>
                </InputBlock>

                {formData.contatos.map((contato, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <input placeholder="NOME DO CONTATO" className="input-premium !py-2 !text-[10px]" value={contato.nome} onChange={(e) => handleContactChange(idx, 'nome', e.target.value)} />
                    <input placeholder="TELEFONE" className="input-premium !py-2 !text-[10px]" value={contato.telefone} onChange={(e) => handleContactChange(idx, 'telefone', e.target.value)} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className={`p-6 rounded-[30px] border-2 transition-all ${formData.autorizacaoEmergencia ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-100 text-slate-400'}`}>
                <label className="flex gap-4 cursor-pointer items-center">
                    <input 
                      type="checkbox" 
                      className="w-6 h-6 rounded-lg border-2 border-slate-200 text-blue-500 focus:ring-0" 
                      checked={formData.autorizacaoEmergencia} 
                      onChange={(e) => handleChange('autorizacaoEmergencia', e.target.checked)} 
                    />
                    <span className="text-[10px] font-black uppercase tracking-tight leading-tight">
                        Autorizo encaminhamento médico em caso de urgência.
                    </span>
                </label>
            </div>
          </div>
        </div>
      </form>

      <style>{`
        .input-premium { 
          width: 100%; 
          padding: 0.9rem 1.2rem; 
          background-color: #fff; 
          border-radius: 16px; 
          font-weight: 700; 
          font-size: 0.75rem; 
          outline: none; 
          border: 2px solid #f1f5f9; 
          transition: all 0.3s ease; 
          color: #1e293b; 
          text-transform: uppercase;
        }
        .input-premium:focus { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08); }
        .input-premium::placeholder { color: #cbd5e1; font-size: 0.65rem; }
      `}</style>
    </div>
  );
};

// Sub-componentes
const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white p-6 md:p-8 rounded-[35px] border border-slate-100 shadow-sm">
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
        <button key={opt} type="button" onClick={() => onChange(opt)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${value === opt ? 'bg-slate-800 text-white' : 'bg-white text-slate-300 border border-slate-100'}`}>
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const ToggleInput = ({ label, value, onChange }) => (
  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 transition-all hover:bg-white">
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-tighter">{label}</span>
      <div className="flex gap-1">
        {['Sim', 'Não'].map((opt) => (
          <button 
            key={opt} 
            type="button" 
            onClick={() => onChange({ ...value, possui: opt })}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${value.possui === opt ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white text-slate-300 border border-slate-100'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
    {value.possui === 'Sim' && (
      <input 
        className="input-premium mt-3 !py-2 !text-[10px] border-blue-100" 
        placeholder="DETALHES..." 
        value={value.detalhes} 
        onChange={(e) => onChange({ ...value, detalhes: e.target.value })} 
      />
    )}
  </div>
);

export default QuestionarioSaude;