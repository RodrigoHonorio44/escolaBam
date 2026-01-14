import React, { useState } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ClipboardCheck, HeartPulse, ShieldCheck, AlertTriangle, 
  Phone, User, Calendar, Save, FileText, CheckCircle2, Loader2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// IMPORTANTE: Importe o componente de impressão que criamos antes
import PrintFichaSaude from '../../components/PrintFichaSaude'; 

const QuestionarioSaude = () => {
  const [loading, setLoading] = useState(false);
  const [modoImpressao, setModoImpressao] = useState(false); // Estado para trocar de tela
  
  const [formData, setFormData] = useState({
    alunoNome: '',
    dataNascimento: '',
    turma: '', // Adicionado para constar na impressão
    historicoDoencas: { possui: '', detalhes: '' },
    alergias: { possui: '', detalhes: '' },
    medicacaoContinua: { possui: '', detalhes: '' },
    cirurgias: { possui: '', detalhes: '' },
    diabetes: { possui: '', detalhes: '' },
    asma: { possui: '', detalhes: '' },
    doencasCardiacas: { possui: '', detalhes: '' },
    epilepsia: { possui: '' },
    carteiraVacina: '',
    vacinaAtualizada: '',
    contatoEmergenciaPrioridade: '',
    contatoEmergenciaOutro: '',
    planoSaude: { possui: '', detalhes: '' },
    restricoesAlimentares: { possui: '', detalhes: '' },
    necessidadesEspeciais: { possui: '', detalhes: '' },
    historicoViolencia: { possui: '', detalhes: '' },
    atestadoAtividadeFisica: '',
    contatos: [
      { nome: '', telefone: '' },
      { nome: '', telefone: '' },
      { nome: '', telefone: '' }
    ],
    autorizacaoEmergencia: false
  });

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
    novosContatos[index][field] = value;
    setFormData(prev => ({ ...prev, contatos: novosContatos }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.autorizacaoEmergencia) {
      toast.error("É necessário autorizar o encaminhamento em caso de emergência.");
      return;
    }

    setLoading(true);
    try {
      // 1. Salva no Firebase
      await addDoc(collection(db, "questionarios_saude"), {
        ...formData,
        dataCriacao: serverTimestamp(),
        status: 'pendente_revisao'
      });

      toast.success("Dados salvos! Gerando ficha para impressão...");

      // 2. Aguarda um pequeno delay para o enfermeiro ver o feedback e troca a tela
      setTimeout(() => {
        setModoImpressao(true);
        setLoading(false);
      }, 1200);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar questionário.");
      setLoading(false);
    }
  };

  // ✅ LÓGICA DE TROCA DE TELA PARA IMPRESSÃO
  if (modoImpressao) {
    return <PrintFichaSaude data={formData} onVoltar={() => setModoImpressao(false)} />;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <Toaster position="top-right" />
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* HEADER */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200">
              <ClipboardCheck size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase italic leading-tight">Questionário de Saúde Escolar</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ficha Médica Cadastral do Aluno</p>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-200"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={18} /> Salvando...</>
            ) : (
              <><Save size={18} /> Salvar e Imprimir</>
            )}
          </button>
        </div>

        {/* DADOS BÁSICOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SectionCard icon={<User size={18}/>} title="Identificação">
            <div className="space-y-4">
              <InputBlock label="Nome Completo do Aluno">
                <input 
                  className="input-estilo" 
                  value={formData.alunoNome}
                  onChange={(e) => handleChange('alunoNome', e.target.value)}
                  placeholder="Ex: João Silva Santos"
                  required
                />
              </InputBlock>
              <div className="grid grid-cols-2 gap-2">
                <InputBlock label="Nascimento">
                  <input 
                    type="date" 
                    className="input-estilo"
                    value={formData.dataNascimento}
                    onChange={(e) => handleChange('dataNascimento', e.target.value)}
                    required
                  />
                </InputBlock>
                <InputBlock label="Turma">
                  <input 
                    className="input-estilo"
                    value={formData.turma}
                    onChange={(e) => handleChange('turma', e.target.value)}
                    placeholder="Ex: 1001"
                  />
                </InputBlock>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<ShieldCheck size={18}/>} title="Vacinação">
            <div className="space-y-4">
              <RadioGroup 
                label="Possui carteira de vacinação?" 
                name="vacina_possui"
                value={formData.carteiraVacina}
                onChange={(v) => handleChange('carteiraVacina', v)} 
              />
              <RadioGroup 
                label="Vacinação está atualizada?" 
                name="vacina_ok"
                value={formData.vacinaAtualizada}
                onChange={(v) => handleChange('vacinaAtualizada', v)} 
              />
            </div>
          </SectionCard>

          <SectionCard icon={<AlertTriangle size={18}/>} title="Emergência">
            <div className="space-y-4">
              <InputBlock label="Entrar em contato com:">
                <select 
                  className="input-estilo"
                  value={formData.contatoEmergenciaPrioridade}
                  onChange={(e) => handleChange('contatoEmergenciaPrioridade', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Pai">Pai</option>
                  <option value="Outros">Outros</option>
                </select>
              </InputBlock>
              {formData.contatoEmergenciaPrioridade === 'Outros' && (
                <input 
                  placeholder="Especifique quem..." 
                  className="input-estilo"
                  value={formData.contatoEmergenciaOutro}
                  onChange={(e) => handleChange('contatoEmergenciaOutro', e.target.value)}
                />
              )}
            </div>
          </SectionCard>
        </div>

        {/* INFORMAÇÕES MÉDICAS DETALHADAS */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <HeartPulse className="text-rose-500" size={20}/> Condições Médicas e Histórico
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <ToggleInput label="1. Doenças Crônicas?" value={formData.historicoDoencas} onChange={(v) => handleChange('historicoDoencas', v)} />
            <ToggleInput label="2. Alergias conhecidas?" value={formData.alergias} onChange={(v) => handleChange('alergias', v)} />
            <ToggleInput label="3. Uso de medicação contínua?" value={formData.medicacaoContinua} onChange={(v) => handleChange('medicacaoContinua', v)} />
            <ToggleInput label="4. Já realizou cirurgia?" value={formData.cirurgias} onChange={(v) => handleChange('cirurgias', v)} />
            <ToggleInput label="5. Possui Diabetes?" value={formData.diabetes} onChange={(v) => handleChange('diabetes', v)} placeholder="Qual tipo?" />
            <ToggleInput label="6. Possui Asma?" value={formData.asma} onChange={(v) => handleChange('asma', v)} />
            <ToggleInput label="7. Doenças Cardíacas?" value={formData.doencasCardiacas} onChange={(v) => handleChange('doencasCardiacas', v)} />
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <span className="text-xs font-bold text-slate-600 uppercase">8. Possui Epilepsia?</span>
               <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input type="radio" name="epilepsia" value="Sim" checked={formData.epilepsia.possui === 'Sim'} onChange={(e) => handleChange('epilepsia.possui', e.target.value)} /> SIM
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input type="radio" name="epilepsia" value="Não" checked={formData.epilepsia.possui === 'Não'} onChange={(e) => handleChange('epilepsia.possui', e.target.value)} /> NÃO
                  </label>
               </div>
            </div>
          </div>
        </div>

        {/* INFORMAÇÕES ADICIONAIS E CONTATOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard icon={<FileText size={18}/>} title="Informações Adicionais">
            <div className="space-y-6">
              <ToggleInput label="Restrições alimentares?" value={formData.restricoesAlimentares} onChange={(v) => handleChange('restricoesAlimentares', v)} isTextArea />
              <ToggleInput label="Necessidades especiais?" value={formData.necessidadesEspeciais} onChange={(v) => handleChange('necessidadesEspeciais', v)} isTextArea />
              <ToggleInput label="Histórico de violência/abuso?" value={formData.historicoViolencia} onChange={(v) => handleChange('historicoViolencia', v)} isTextArea />
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase block mb-3">Atestado para atividades físicas?</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input type="radio" name="atestado" value="Sim" checked={formData.atestadoAtividadeFisica === 'Sim'} onChange={(e) => handleChange('atestadoAtividadeFisica', e.target.value)} /> SIM
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input type="radio" name="atestado" value="Não" checked={formData.atestadoAtividadeFisica === 'Não'} onChange={(e) => handleChange('atestadoAtividadeFisica', e.target.value)} /> NÃO
                  </label>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Phone size={18}/>} title="Lista de Contatos">
            <div className="space-y-4">
              {formData.contatos.map((contato, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2">
                  <input 
                    placeholder="Nome" 
                    className="input-estilo !py-3" 
                    value={contato.nome}
                    onChange={(e) => handleContactChange(idx, 'nome', e.target.value)}
                  />
                  <input 
                    placeholder="Telefone" 
                    className="input-estilo !py-3" 
                    value={contato.telefone}
                    onChange={(e) => handleContactChange(idx, 'telefone', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-[24px] border border-blue-100 shadow-inner">
              <label className="flex gap-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 mt-1 rounded-md border-blue-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.autorizacaoEmergencia}
                  onChange={(e) => handleChange('autorizacaoEmergencia', e.target.checked)}
                />
                <span className="text-[11px] font-bold text-blue-900 leading-relaxed uppercase">
                  Eu, responsável legal, autorizo esta Unidade Escolar em caso de emergência, 
                  levar meu filho(a) ao posto médico/hospitalar até minha chegada.
                </span>
              </label>
            </div>
          </SectionCard>
        </div>
      </form>

      <style>{`
        .input-estilo {
          width: 100%;
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 1rem;
          font-weight: 700;
          font-size: 0.75rem;
          outline: none;
          border: 1px solid #f1f5f9;
          transition: all 0.3s;
        }
        .input-estilo:focus {
          background-color: #fff;
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
        }
      `}</style>
    </div>
  );
};

/* COMPONENTES INTERNOS MANTIDOS */
const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-full">
    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
      {icon} {title}
    </h2>
    {children}
  </div>
);

const InputBlock = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    {children}
  </div>
);

const RadioGroup = ({ label, name, value, onChange }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <span className="text-[10px] font-black text-slate-400 uppercase block mb-3">{label}</span>
    <div className="flex gap-6">
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
        <input type="radio" name={name} value="Sim" checked={value === 'Sim'} onChange={(e) => onChange(e.target.value)} className="w-4 h-4" /> SIM
      </label>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
        <input type="radio" name={name} value="Não" checked={value === 'Não'} onChange={(e) => onChange(e.target.value)} className="w-4 h-4" /> NÃO
      </label>
    </div>
  </div>
);

const ToggleInput = ({ label, value, onChange, placeholder = "Especifique...", isTextArea = false }) => (
  <div className="space-y-3 p-4 bg-slate-50/50 rounded-[24px] border border-slate-50">
    <div className="flex items-center justify-between">
      <span className="text-xs font-black text-slate-600 uppercase">{label}</span>
      <div className="flex gap-3">
        {['Sim', 'Não'].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange({ ...value, possui: opt })}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
              value.possui === opt ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
    {value.possui === 'Sim' && (
      isTextArea ? (
        <textarea className="input-estilo min-h-[80px]" placeholder={placeholder} value={value.detalhes} onChange={(e) => onChange({ ...value, detalhes: e.target.value })} />
      ) : (
        <input className="input-estilo" placeholder={placeholder} value={value.detalhes} onChange={(e) => onChange({ ...value, detalhes: e.target.value })} />
      )
    )}
  </div>
);

export default QuestionarioSaude;