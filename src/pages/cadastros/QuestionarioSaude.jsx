import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ClipboardCheck, HeartPulse, ShieldCheck, AlertTriangle, 
  Phone, User, Calendar, Save, FileText, CheckCircle2, Loader2, ChevronLeft, Heart
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const QuestionarioSaude = ({ dadosEdicao, onVoltar, onSucesso }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [formData, setFormData] = useState({
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
    carteiraVacina: '',
    vacinaAtualizada: '',
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
    autorizacaoEmergencia: false
  });

  // MÁSCARA DE TELEFONE AUTOMÁTICA
  const formatarTelefone = (valor) => {
    const tel = valor.replace(/\D/g, "");
    if (tel.length <= 11) {
      return tel.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
    }
    return valor;
  };

  useEffect(() => {
    const carregarDados = async () => {
      if (dadosEdicao?.id) {
        setFetching(true);
        try {
          const docRef = doc(db, "questionarios_saude", String(dadosEdicao.id));
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setFormData(docSnap.data());
          } else {
            // Se não existe o questionário, pré-preenche com os dados básicos do aluno
            setFormData(prev => ({
              ...prev,
              alunoNome: dadosEdicao.nome || '',
              dataNascimento: dadosEdicao.dataNascimento || '',
              turma: dadosEdicao.turma || '',
              // Tenta pegar os contatos já cadastrados no formulário principal
              contatos: [
                { nome: dadosEdicao.nomeContato1 || '', telefone: dadosEdicao.contato || '' },
                { nome: dadosEdicao.nomeContato2 || '', telefone: dadosEdicao.contato2 || '' }
              ]
            }));
          }
        } catch (error) {
          console.error("Erro ao carregar ficha:", error);
        } finally {
          setFetching(false);
        }
      }
    };
    carregarDados();
  }, [dadosEdicao]);

  const handleChange = (path, value) => {
    const keys = path.split('.');
    if (keys.length > 1) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: { ...prev[keys[0]], [keys[1]]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [path]: value }));
    }
  };

  const handleContactChange = (index, field, value) => {
    const novosContatos = [...formData.contatos];
    novosContatos[index][field] = field === 'telefone' ? formatarTelefone(value) : value;
    setFormData(prev => ({ ...prev, contatos: novosContatos }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.autorizacaoEmergencia) {
      toast.error("Você precisa autorizar o encaminhamento de emergência.");
      return;
    }

    setLoading(true);
    try {
      const docId = dadosEdicao?.id;
      const docRef = doc(db, "questionarios_saude", String(docId));

      const dadosParaSalvar = {
        ...formData,
        pacienteId: docId,
        updatedAt: serverTimestamp(),
        statusFicha: 'Concluída'
      };

      // Salva no questionário E atualiza um status na pasta digital
      await setDoc(docRef, dadosParaSalvar, { merge: true });
      await setDoc(doc(db, "pastas_digitais", String(docId)), {
        temQuestionarioSaude: true,
        dataQuestionario: serverTimestamp()
      }, { merge: true });

      toast.success("Ficha de Saúde Sincronizada!");
      if (onSucesso) onSucesso();
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-8">
        <button onClick={onVoltar} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="bg-rose-50 px-4 py-2 rounded-full flex items-center gap-2">
            <Heart size={14} className="text-rose-500 fill-rose-500"/>
            <span className="text-rose-600 font-black uppercase text-[9px] tracking-tighter">Prontuário Digital Ativo</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CABEÇALHO */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-lg shadow-blue-100"><ClipboardCheck size={32} /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase italic leading-tight">Ficha Médica</h1>
              <p className="text-xs font-bold text-blue-600 uppercase">{formData.alunoNome || 'Selecione um Aluno'}</p>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full md:w-auto bg-slate-900 text-white px-10 py-5 rounded-[22px] font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-3">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Finalizar e Salvar
          </button>
        </div>

        {/* IDENTIFICAÇÃO BÁSICA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SectionCard icon={<User size={18}/>} title="Identificação">
            <div className="space-y-4">
              <InputBlock label="Nome do Aluno">
                <input className="input-estilo" value={formData.alunoNome} readOnly />
              </InputBlock>
              <div className="grid grid-cols-2 gap-2">
                <InputBlock label="Nascimento">
                  <input type="date" className="input-estilo" value={formData.dataNascimento} readOnly />
                </InputBlock>
                <InputBlock label="Turma">
                  <input className="input-estilo bg-blue-50/50 border-blue-100" value={formData.turma} onChange={(e) => handleChange('turma', e.target.value)} />
                </InputBlock>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<ShieldCheck size={18}/>} title="Status Vacinal">
            <div className="space-y-3">
              <RadioGroup label="Possui caderneta?" name="v_pos" value={formData.carteiraVacina} onChange={(v) => handleChange('carteiraVacina', v)} />
              <RadioGroup label="Está em dia?" name="v_dia" value={formData.vacinaAtualizada} onChange={(v) => handleChange('vacinaAtualizada', v)} />
            </div>
          </SectionCard>

          <SectionCard icon={<AlertTriangle size={18}/>} title="Prioridade de Contato">
            <InputBlock label="Quem avisar primeiro?">
              <select className="input-estilo" value={formData.contatoEmergenciaPrioridade} onChange={(e) => handleChange('contatoEmergenciaPrioridade', e.target.value)}>
                <option value="">Selecione...</option>
                <option value="Mãe">Mãe</option>
                <option value="Pai">Pai</option>
                <option value="Avós">Avós</option>
                <option value="Outro">Outro Responsável</option>
              </select>
            </InputBlock>
            {formData.contatoEmergenciaPrioridade === 'Outro' && (
              <input placeholder="Especificar..." className="input-estilo mt-2" value={formData.contatoEmergenciaOutro} onChange={(e) => handleChange('contatoEmergenciaOutro', e.target.value)} />
            )}
          </SectionCard>
        </div>

        {/* CONDIÇÕES MÉDICAS DETALHADAS */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <HeartPulse className="text-rose-500" size={20}/> Condições de Saúde (Sim/Não)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <ToggleInput label="1. Alergias graves?" value={formData.alergias} onChange={(v) => handleChange('alergias', v)} />
            <ToggleInput label="2. Doenças Crônicas?" value={formData.historicoDoencas} onChange={(v) => handleChange('historicoDoencas', v)} />
            <ToggleInput label="3. Uso de medicação contínua?" value={formData.medicacaoContinua} onChange={(v) => handleChange('medicacaoContinua', v)} />
            <ToggleInput label="4. Cirurgias recentes?" value={formData.cirurgias} onChange={(v) => handleChange('cirurgias', v)} />
            <ToggleInput label="5. Diabetes?" value={formData.diabetes} onChange={(v) => handleChange('diabetes', v)} />
            <ToggleInput label="6. Asma / Problemas respiratórios?" value={formData.asma} onChange={(v) => handleChange('asma', v)} />
            <ToggleInput label="7. Problemas Cardíacos?" value={formData.doencasCardiacas} onChange={(v) => handleChange('doencasCardiacas', v)} />
            <ToggleInput label="8. Epilepsia?" value={formData.epilepsia} onChange={(v) => handleChange('epilepsia', v)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard icon={<FileText size={18}/>} title="Restrições e Cuidados">
            <div className="space-y-4">
               <ToggleInput label="Restrição Alimentar?" value={formData.restricoesAlimentares} onChange={(v) => handleChange('restricoesAlimentares', v)} isTextArea />
               <ToggleInput label="Necessidades Especiais?" value={formData.necessidadesEspeciais} onChange={(v) => handleChange('necessidadesEspeciais', v)} isTextArea />
            </div>
          </SectionCard>

          <SectionCard icon={<Phone size={18}/>} title="Contatos para Emergência">
            <div className="space-y-4">
              {formData.contatos.map((contato, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Contato {idx + 1}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Nome" className="input-estilo !bg-white" value={contato.nome} onChange={(e) => handleContactChange(idx, 'nome', e.target.value)} />
                    <input placeholder="Telefone" className="input-estilo !bg-white" value={contato.telefone} onChange={(e) => handleContactChange(idx, 'telefone', e.target.value)} />
                  </div>
                </div>
              ))}
              
              <div className={`mt-6 p-6 rounded-[28px] border-2 transition-all ${formData.autorizacaoEmergencia ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <label className="flex gap-4 cursor-pointer">
                  <input type="checkbox" className="w-6 h-6 mt-1 rounded-lg text-green-600" checked={formData.autorizacaoEmergencia} onChange={(e) => handleChange('autorizacaoEmergencia', e.target.checked)} />
                  <span className={`text-[11px] font-black leading-tight uppercase ${formData.autorizacaoEmergencia ? 'text-green-700' : 'text-amber-700'}`}>
                    Autorizo o encaminhamento para unidade de saúde em caso de emergência.
                  </span>
                </label>
              </div>
            </div>
          </SectionCard>
        </div>
      </form>

      <style>{`
        .input-estilo { width: 100%; padding: 0.8rem 1rem; background-color: #f8fafc; border-radius: 14px; font-weight: 800; font-size: 0.75rem; outline: none; border: 2px solid transparent; transition: all 0.2s; color: #1e293b; }
        .input-estilo:focus { background-color: #fff; border-color: #3b82f6; }
      `}</style>
    </div>
  );
};

// COMPONENTES AUXILIARES PADRONIZADOS
const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">{icon} {title}</h2>
    {children}
  </div>
);

const InputBlock = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{label}</label>
    {children}
  </div>
);

const RadioGroup = ({ label, name, value, onChange }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <span className="text-[9px] font-black text-slate-400 uppercase block mb-3">{label}</span>
    <div className="flex gap-4">
      {['Sim', 'Não'].map(opt => (
        <label key={opt} className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
          <input type="radio" name={name} value={opt} checked={value === opt} onChange={(e) => onChange(e.target.value)} className="w-4 h-4" /> {opt}
        </label>
      ))}
    </div>
  </div>
);

const ToggleInput = ({ label, value, onChange, placeholder = "Especifique aqui...", isTextArea = false }) => (
  <div className="p-4 bg-slate-50/50 rounded-3xl border border-slate-100/50 transition-all">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-tight">{label}</span>
      <div className="flex gap-2">
        {['Sim', 'Não'].map((opt) => (
          <button key={opt} type="button" onClick={() => onChange({ ...value, possui: opt })}
            className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${value.possui === opt ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
          >{opt}</button>
        ))}
      </div>
    </div>
    {value.possui === 'Sim' && (
      <div className="animate-in slide-in-from-top-1 duration-200">
        {isTextArea ? <textarea className="input-estilo min-h-[70px] mt-2 !bg-white" placeholder={placeholder} value={value.detalhes} onChange={(e) => onChange({ ...value, detalhes: e.target.value })} />
        : <input className="input-estilo mt-2 !bg-white" placeholder={placeholder} value={value.detalhes} onChange={(e) => onChange({ ...value, detalhes: e.target.value })} />}
      </div>
    )}
  </div>
);

export default QuestionarioSaude;