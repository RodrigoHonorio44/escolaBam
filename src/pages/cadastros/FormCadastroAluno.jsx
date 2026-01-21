import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { 
  UserPlus, Save, Loader2, AlertCircle, MapPin, Phone, CreditCard, UserPlus2, School, X, ArrowLeft
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Mantive onClose e onVoltar para evitar erros de undefined
const FormCadastroAluno = ({ onVoltar, dadosEdicao, modoPastaDigital = !!dadosEdicao, onClose }) => {
  const navigate = useNavigate();
  const [mostrarEndereco, setMostrarEndereco] = useState(false);
  const [mostrarSegundoContato, setMostrarSegundoContato] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm({
    mode: "onChange", 
    defaultValues: {
      nome: '',
      naoSabeSus: false,
      cartaoSus: '',
      sexo: '',
      dataNascimento: '',
      idade: '',
      turma: '',
      parentesco: 'Mãe',
      responsavel: '',
      nomeContato1: '',
      contato: '',
      nomeContato2: '',
      contato2: '',
      temAlergia: 'Não',
      historicoMedico: '',
      endereco_rua: '',
      endereco_cep: '',
      endereco_bairro: ''
    }
  });

  // --- MÁSCARA DE TELEFONE ---
  const handleTelefoneChange = (e, fieldName) => {
    let valor = e.target.value.replace(/\D/g, ""); 
    if (valor.length > 11) valor = valor.slice(0, 11); 
    
    if (valor.length > 2) {
      valor = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
    }
    if (valor.length > 10) {
      valor = `${valor.substring(0, 10)}-${valor.substring(10)}`;
    }
    
    setValue(fieldName, valor);
  };

  useEffect(() => {
    if (dadosEdicao) {
      reset({
        ...dadosEdicao,
        temAlergia: (dadosEdicao.alergias || dadosEdicao.historicoMedico || dadosEdicao.alunoPossuiAlergia === "Sim") ? "Sim" : "Não",
        historicoMedico: dadosEdicao.alergias || dadosEdicao.historicoMedico || ''
      });
      if (dadosEdicao.endereco_rua) setMostrarEndereco(true);
      if (dadosEdicao.contato2) setMostrarSegundoContato(true);
    }
  }, [dadosEdicao, reset]);

  const watchDataNasc = watch("dataNascimento");
  const naoSabeSus = watch("naoSabeSus");
  const watchTemAlergia = watch("temAlergia");

  useEffect(() => {
    if (watchDataNasc) {
      const hoje = new Date();
      const nasc = new Date(watchDataNasc);
      let idade = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
      setValue("idade", idade >= 0 ? idade : "");
    }
  }, [watchDataNasc, setValue]);

  // Lógica de saída centralizada
  const handleActionVoltar = () => {
    if (modoPastaDigital) {
      if (onClose) onClose();
      else if (onVoltar) onVoltar();
    } else {
      navigate('/dashboard');
    }
  };

  const onSubmit = async (data) => {
    const saveAction = async () => {
      const nomeLimpo = data.nome.trim();
      const dataNascLimpa = data.dataNascimento ? data.dataNascimento.replace(/-/g, '') : 'sem-data';
      const idGerado = `${nomeLimpo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${dataNascLimpa}`;
      
      const payload = { 
        ...data, 
        nome: nomeLimpo,
        nomeBusca: nomeLimpo.toUpperCase(),
        pacienteId: idGerado,
        tipoPerfil: 'aluno',
        cartaoSus: data.naoSabeSus ? "NÃO INFORMADO" : data.cartaoSus,
        updatedAt: serverTimestamp(),
        alunoPossuiAlergia: data.temAlergia,
        alergias: data.temAlergia === "Sim" ? data.historicoMedico : ""
      };
      
      await setDoc(doc(db, "pastas_digitais", idGerado), payload, { merge: true });
      await setDoc(doc(db, "alunos", idGerado), {
        ...payload,
        createdAt: dadosEdicao?.createdAt || serverTimestamp()
      }, { merge: true });

      // LOGICA DE REDIRECIONAMENTO APÓS SALVAR
      if (modoPastaDigital) {
          // Pequeno delay para o usuário ver o feedback de sucesso antes de fechar
          setTimeout(() => {
            handleActionVoltar();
          }, 800);
      } else {
          reset();
          setMostrarEndereco(false);
          setMostrarSegundoContato(false);
      }
    };

    toast.promise(saveAction(), { 
      loading: 'Sincronizando Identidade Digital...', 
      success: modoPastaDigital ? 'Dados atualizados!' : 'Aluno salvo! Formulário pronto para novo cadastro.', 
      error: 'Erro ao salvar aluno.' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
      <Toaster position="top-center" />
      
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={handleActionVoltar} 
            className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-all"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
            {modoPastaDigital ? 'Confirmar Identificação' : 'Cadastro de Aluno'}
          </h2>
        </div>

        <button 
          type="button" 
          onClick={handleActionVoltar} 
          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"
        >
          <X size={28} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NOME COMPLETO */}
        <div className="md:col-span-2 space-y-2">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.nome ? 'text-red-500' : 'text-slate-400'}`}>Nome Completo do Aluno</label>
          <input 
            {...register("nome", { 
              required: "Nome obrigatório", 
              pattern: { 
                value: /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, 
                message: "O nome deve conter apenas letras" 
              } 
            })} 
            readOnly={modoPastaDigital}
            placeholder="Ex: João Silva" 
            className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all 
            ${modoPastaDigital ? 'bg-slate-100 border-transparent text-slate-500 cursor-not-allowed' : errors.nome ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-blue-600'}`} 
          />
          {errors.nome && <span className="text-[9px] text-red-500 font-bold uppercase ml-2 italic tracking-tighter">{errors.nome.message}</span>}
        </div>

        {/* DATA E IDADE */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
          <input 
            type="date" 
            {...register("dataNascimento")} 
            readOnly={modoPastaDigital}
            className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none shadow-sm 
            ${modoPastaDigital ? 'bg-slate-100 border-transparent text-slate-500' : 'bg-slate-50 border-transparent focus:border-blue-600'}`} 
            required 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 italic">Idade Atual</label>
          <input type="number" {...register("idade")} readOnly className="w-full px-5 py-4 bg-blue-50 border-2 border-transparent rounded-2xl font-bold text-blue-700 outline-none cursor-not-allowed" />
        </div>

        {/* TURMA */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><School size={12}/> Turma / Ano</label>
          <input 
            {...register("turma")} 
            readOnly={modoPastaDigital}
            placeholder="Ex: 1º Ano A" 
            className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none shadow-sm 
            ${modoPastaDigital ? 'bg-slate-100 border-transparent text-slate-500' : 'bg-slate-50 border-transparent focus:border-blue-600'}`} 
            required 
          />
        </div>

        {/* SEXO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
          <select {...register("sexo")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-600 outline-none shadow-sm" required>
            <option value="">Selecione...</option>
            <option value="Menino">Masculino</option>
            <option value="Menina">Feminino</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        {/* CARTÃO SUS */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={12}/> Cartão SUS</label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" {...register("naoSabeSus")} className="w-3 h-3 rounded" />
              <span className="text-[9px] font-black text-slate-400 group-hover:text-orange-500 uppercase transition-colors">Não informado</span>
            </label>
          </div>
          <input {...register("cartaoSus")} disabled={naoSabeSus} placeholder={naoSabeSus ? "NÃO INFORMADO" : "000 0000 0000 0000"} className={`w-full px-5 py-4 border-2 rounded-2xl outline-none font-bold transition-all ${naoSabeSus ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-slate-50 border-transparent focus:border-blue-600 shadow-sm"}`} />
        </div>

        {/* RESPONSÁVEL */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vínculo</label>
          <select {...register("parentesco")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-600 outline-none shadow-sm">
            <option value="Mãe">Mãe</option>
            <option value="Pai">Pai</option>
            <option value="Avô/Avó">Avô/Avó</option>
            <option value="Tio/Tia">Tio/Tia</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Responsável</label>
          <input 
            {...register("responsavel", { pattern: { value: /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, message: "Apenas letras" } })} 
            placeholder="Nome de quem assina" 
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-600 outline-none shadow-sm" 
            required 
          />
        </div>

        {/* CONTATOS */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-6 shadow-inner">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2 italic"><Phone size={14} className="text-blue-600"/> Contatos de Emergência</h3>
            {!mostrarSegundoContato && (
              <button type="button" onClick={() => setMostrarSegundoContato(true)} className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50 transition-all">
                <UserPlus2 size={12}/> ADICIONAR 2º CONTATO
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Contato 01</label>
              <input {...register("nomeContato1", { pattern: { value: /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, message: "Apenas letras" } })} placeholder="Ex: Maria (Mãe)" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone 01 (Celular)</label>
              <input 
                {...register("contato")} 
                onChange={(e) => handleTelefoneChange(e, "contato")}
                placeholder="(21) 97596-6340" 
                maxLength={15}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-600" 
              />
            </div>
          </div>

          {mostrarSegundoContato && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Contato 02</label>
                    <button type="button" onClick={() => { setMostrarSegundoContato(false); setValue("contato2", ""); setValue("nomeContato2", ""); }} className="text-[8px] font-bold text-red-400 hover:text-red-600 uppercase">[Remover]</button>
                </div>
                <input {...register("nomeContato2", { pattern: { value: /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, message: "Apenas letras" } })} placeholder="Ex: José (Tio)" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-600" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone 02 (Celular)</label>
                <input 
                  {...register("contato2")} 
                  onChange={(e) => handleTelefoneChange(e, "contato2")}
                  placeholder="(21) 97596-6340" 
                  maxLength={15}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-600" 
                />
              </div>
            </div>
          )}
        </div>

        {/* ALERGIAS */}
        <div className="md:col-span-2 p-6 bg-red-50 rounded-[30px] border-2 border-red-100 space-y-4">
          <label className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2 italic">
            <AlertCircle size={14}/> Controle de Alergias (Sincronizado)
          </label>
          <select {...register("temAlergia")} className="w-full px-5 py-4 bg-white border-2 border-red-100 rounded-2xl font-bold focus:border-red-600 outline-none shadow-sm">
            <option value="Não">Não possui alergias</option>
            <option value="Sim">Sim, possui alergias</option>
          </select>
          {watchTemAlergia === 'Sim' && (
            <textarea 
              {...register("historicoMedico")} 
              placeholder="Descreva as alergias (Ex: DIPIRONA)" 
              className="w-full px-5 py-4 bg-white border-2 border-red-200 rounded-2xl font-bold text-red-700 focus:border-red-600 outline-none"
              rows="2"
            />
          )}
        </div>

        {/* ENDEREÇO */}
        <div className="md:col-span-2">
          <button type="button" onClick={() => setMostrarEndereco(!mostrarEndereco)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-4 py-3 rounded-2xl shadow-sm hover:bg-blue-100 transition-colors">
            <MapPin size={14} /> {mostrarEndereco ? '[-] Ocultar Endereço' : '[+] Adicionar Endereço Completo'}
          </button>
          {mostrarEndereco && (
            <div className="mt-4 p-6 bg-slate-50 rounded-[30px] border-2 border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
               <div className="md:col-span-2 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">Rua e Número</label><input {...register("endereco_rua")} placeholder="Rua das Flores, 123" className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none shadow-sm" /></div>
               <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">CEP</label><input {...register("endereco_cep")} placeholder="24000-000" className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none shadow-sm" /></div>
               <div className="md:col-span-3 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">Bairro e Cidade</label><input {...register("endereco_bairro")} placeholder="Ex: Centro, Maricá/RJ" className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none shadow-sm" /></div>
            </div>
          )}
        </div>

        {/* BOTÃO FINALIZAR */}
        <button type="submit" disabled={isSubmitting} className="md:col-span-2 mt-4 bg-blue-600 text-white py-5 rounded-[22px] font-black uppercase italic text-xs shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} /> {modoPastaDigital ? 'Atualizar Identificação' : 'Salvar e Iniciar Novo Cadastro'}</>}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroAluno;