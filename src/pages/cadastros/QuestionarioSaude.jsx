import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; 
import { 
  ClipboardCheck, HeartPulse, ShieldCheck, AlertTriangle, 
  Phone, User, Calendar, Save, FileText, Loader2, ChevronLeft, Heart, X, Search
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const QuestionarioSaude = ({ dadosEdicao, onVoltar, onSucesso, onClose, modoPastaDigital = !!dadosEdicao }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [buscandoNome, setBuscandoNome] = useState(false);
  
  const estadoInicial = {
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
  };

  const [formData, setFormData] = useState(estadoInicial);

  // Lógica de saída centralizada
  const handleActionVoltar = () => {
    if (modoPastaDigital && onClose) {
      onClose();
    } else {
      navigate('/dashboard');
    }
  };

  const buscarPacientePorNome = async (nomeDigitado) => {
    if (!nomeDigitado || nomeDigitado.length < 3 || formData.pacienteId || modoPastaDigital) return;

    setBuscandoNome(true);
    try {
      const q = query(
        collection(db, "pastas_digitais"),
        where("nomeBusca", "==", nomeDigitado.trim().toUpperCase()),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const d = docSnap.data();
        const idEncontrado = docSnap.id;

        toast.success("Paciente localizado!");
        
        const questRef = doc(db, "questionarios_saude", idEncontrado);
        const questSnap = await getDoc(questRef);

        if (questSnap.exists()) {
          setFormData({ ...estadoInicial, ...questSnap.data(), pacienteId: idEncontrado });
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
        }
      }
    } catch (error) {
      console.error("Erro na busca:", error);
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

  const formatarTelefone = (valor) => {
    const tel = (valor || "").replace(/\D/g, "");
    if (tel.length <= 11) return tel.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
    return valor;
  };

  useEffect(() => {
    const carregarViaProp = async () => {
      if (!dadosEdicao?.id) return;
      setFetching(true);
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
          turma: dadosEdicao.turma || '',
          contatos: [
            { nome: dadosEdicao.nomeContato1 || '', telefone: dadosEdicao.contato || '' },
            { nome: dadosEdicao.nomeContato2 || '', telefone: dadosEdicao.contato2 || '' }
          ]
        }));
      }
      setFetching(false);
    };
    carregarViaProp();
  }, [dadosEdicao]);

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
    novosContatos[index][field] = field === 'telefone' ? formatarTelefone(value) : (value ?? '');
    setFormData(prev => ({ ...prev, contatos: novosContatos }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const docId = formData.pacienteId || (dadosEdicao?.id ? String(dadosEdicao.id) : null);
    
    if (!docId) {
      toast.error("Vincule um paciente da Pasta Digital primeiro.");
      return;
    }

    setLoading(true);
    try {
      const nomeBusca = (formData.alunoNome || "").trim().toUpperCase();
      
      await setDoc(doc(db, "questionarios_saude", docId), {
        ...formData,
        pacienteId: docId,
        nomeBusca,
        updatedAt: serverTimestamp(),
        statusFicha: 'Concluída'
      }, { merge: true });
      
      await setDoc(doc(db, "pastas_digitais", docId), {
        temQuestionarioSaude: true,
        alergias: formData.alergias.possui,
        lastUpdate: serverTimestamp()
      }, { merge: true });

      toast.success("Ficha sincronizada com sucesso!");
      
      if (modoPastaDigital && onClose) {
        onClose();
      } else {
        setFormData(estadoInicial);
      }
      
      if (onSucesso) onSucesso();
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-8">
        <button type="button" onClick={handleActionVoltar} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors">
          <ChevronLeft size={16} /> {modoPastaDigital ? 'Voltar para Pasta' : 'Dashboard'}
        </button>
        <button type="button" onClick={handleActionVoltar} className="text-slate-300 hover:text-red-500 transition-colors">
            <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-rose-500 text-white p-4 rounded-3xl shadow-lg shadow-rose-100">
              {buscandoNome ? <Loader2 className="animate-spin" size={32} /> : <ClipboardCheck size={32} />}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase italic leading-tight">
                {modoPastaDigital ? 'Atualizar Ficha Médica' : 'Ficha Médica'}
              </h1>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Sincronização Hospitalar</p>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full md:w-auto bg-slate-900 text-white px-10 py-5 rounded-[22px] font-black uppercase text-xs tracking-widest hover:bg-rose-500 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            {modoPastaDigital ? 'Confirmar Atualização' : 'Salvar e Sincronizar'}
          </button>
        </div>

        <SectionCard icon={<Search size={18}/>} title="Busca e Identificação">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <InputBlock label="Nome do Paciente">
                <div className="relative">
                  <input 
                    className={`input-estilo uppercase ${formData.pacienteId ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'} ${modoPastaDigital ? 'cursor-not-allowed opacity-75' : ''}`}
                    value={formData.alunoNome || ''} 
                    readOnly={modoPastaDigital}
                    onChange={(e) => {
                        handleChange('alunoNome', e.target.value);
                        if(formData.pacienteId) handleChange('pacienteId', ''); 
                    }}
                    onBlur={(e) => buscarPacientePorNome(e.target.value)}
                    placeholder="DIGITE PARA LOCALIZAR NA PASTA..."
                  />
                  {formData.pacienteId && <div className="absolute right-4 top-4 text-green-500 font-bold text-[9px] uppercase">Vinculado</div>}
                </div>
              </InputBlock>
            </div>
            <div className="md:col-span-3">
              <InputBlock label="Data de Nascimento">
                <input 
                    type="date" 
                    className={`input-estilo bg-white border-slate-200 ${modoPastaDigital ? 'cursor-not-allowed opacity-75' : ''}`} 
                    value={formData.dataNascimento || ''} 
                    readOnly={modoPastaDigital}
                    onChange={(e) => handleChange('dataNascimento', e.target.value)} 
                />
              </InputBlock>
            </div>
            <div className="md:col-span-1">
              <InputBlock label="Idade">
                <div className="input-estilo bg-slate-50 text-blue-600 border-none flex items-center justify-center font-black">
                  {idadeCalculada || "--"}
                </div>
              </InputBlock>
            </div>
            <div className="md:col-span-2">
              <InputBlock label="Turma/Setor">
                <input className="input-estilo bg-blue-50/50 border-blue-100 uppercase" value={formData.turma || ''} onChange={(e) => handleChange('turma', e.target.value)} />
              </InputBlock>
            </div>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard icon={<ShieldCheck size={18}/>} title="Status Vacinal">
            <div className="space-y-3">
              <RadioGroup label="Possui caderneta?" name="v_pos" value={formData.carteiraVacina} onChange={(v) => handleChange('carteiraVacina', v)} />
              <RadioGroup label="Está em dia?" name="v_dia" value={formData.vacinaAtualizada} onChange={(v) => handleChange('vacinaAtualizada', v)} />
            </div>
          </SectionCard>
          <SectionCard icon={<AlertTriangle size={18}/>} title="Prioridade de Contato">
            <InputBlock label="Quem avisar primeiro?">
              <select className="input-estilo bg-white border-slate-200" value={formData.contatoEmergenciaPrioridade} onChange={(e) => handleChange('contatoEmergenciaPrioridade', e.target.value)}>
                <option value="">Selecione...</option>
                <option value="Mãe">Mãe</option>
                <option value="Pai">Pai</option>
                <option value="Cônjuge">Cônjuge</option>
                <option value="Filho(a)">Filho(a)</option>
                <option value="Outro">Outro Responsável</option>
              </select>
            </InputBlock>
          </SectionCard>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <HeartPulse className="text-rose-500" size={20}/> Histórico Clínico
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
          <SectionCard icon={<FileText size={18}/>} title="Observações Especiais">
            <div className="space-y-4">
               <ToggleInput label="Restrição Alimentar?" value={formData.restricoesAlimentares} onChange={(v) => handleChange('restricoesAlimentares', v)} isTextArea />
               <ToggleInput label="Necessidades Especiais?" value={formData.necessidadesEspeciais} onChange={(v) => handleChange('necessidadesEspeciais', v)} isTextArea />
               <ToggleInput label="Plano de Saúde?" value={formData.planoSaude} onChange={(v) => handleChange('planoSaude', v)} />
               <ToggleInput label="Histórico de Violência?" value={formData.historicoViolencia} onChange={(v) => handleChange('historicoViolencia', v)} />
            </div>
          </SectionCard>

          <SectionCard icon={<Phone size={18}/>} title="Contatos de Emergência">
            <div className="space-y-4">
              {formData.contatos.map((contato, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Nome" className="input-estilo !bg-white border-slate-100" value={contato.nome || ''} onChange={(e) => handleContactChange(idx, 'nome', e.target.value)} />
                    <input placeholder="Telefone" className="input-estilo !bg-white border-slate-100" value={contato.telefone || ''} onChange={(e) => handleContactChange(idx, 'telefone', e.target.value)} />
                  </div>
                </div>
              ))}
              <div className={`mt-6 p-6 rounded-[28px] border-2 transition-all ${formData.autorizacaoEmergencia ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <label className="flex gap-4 cursor-pointer items-start">
                  <input type="checkbox" className="w-6 h-6 rounded-lg text-green-600 mt-1" checked={formData.autorizacaoEmergencia} onChange={(e) => handleChange('autorizacaoEmergencia', e.target.checked)} />
                  <span className="text-[10px] font-black leading-tight uppercase">Autorizo o encaminhamento para unidade de saúde em caso de urgência.</span>
                </label>
              </div>
            </div>
          </SectionCard>
        </div>
      </form>

      <style>{`
        .input-estilo { width: 100%; height: 52px; padding: 0 1rem; background-color: #f8fafc; border-radius: 14px; font-weight: 800; font-size: 0.8rem; outline: none; border: 2px solid transparent; transition: all 0.2s; color: #1e293b; }
        .input-estilo:focus { border-color: #3b82f6; background-color: #fff; }
      `}</style>
    </div>
  );
};

// COMPONENTES AUXILIARES
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
          <input type="radio" name={name} value={opt} checked={(value || 'Não') === opt} onChange={(e) => onChange(e.target.value)} className="w-5 h-5" /> {opt}
        </label>
      ))}
    </div>
  </div>
);

const ToggleInput = ({ label, value, onChange, placeholder = "Especifique detalhes...", isTextArea = false }) => {
  const possui = value?.possui || 'Não';
  const detalhes = value?.detalhes || '';
  return (
    <div className="p-4 bg-slate-50/50 rounded-3xl border border-slate-100/50 mb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-tight">{label}</span>
        <div className="flex gap-2">
          {['Sim', 'Não'].map((opt) => (
            <button key={opt} type="button" onClick={() => onChange({ ...value, possui: opt })}
              className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${possui === opt ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
            >{opt}</button>
          ))}
        </div>
      </div>
      {possui === 'Sim' && (
        <div className="animate-in slide-in-from-top-1 duration-200">
          {isTextArea ? 
            <textarea className="input-estilo min-h-[80px] mt-2 !bg-white border-slate-200" placeholder={placeholder} value={detalhes} onChange={(e) => onChange({ ...value, detalhes: e.target.value })} /> :
            <input className="input-estilo mt-2 !bg-white border-slate-200" placeholder={placeholder} value={detalhes} onChange={(e) => onChange({ ...value, detalhes: e.target.value })} />
          }
        </div>
      )}
    </div>
  );
};

export default QuestionarioSaude;