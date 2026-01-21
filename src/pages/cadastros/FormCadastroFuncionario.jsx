import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { 
  Briefcase, Save, Loader2, CreditCard, AlertCircle, MapPin, Phone, UserPlus2, X, ArrowLeft 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const FormCadastroFuncionario = ({ onVoltar, dadosEdicao, onSucesso }) => {
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
      cargo: '',
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

  const watchDataNasc = watch("dataNascimento");
  const naoSabeSus = watch("naoSabeSus");
  const temAlergia = watch("temAlergia");

  // Máscara de telefone padronizada
  const handleTelefoneChange = (e, fieldName) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 11) valor = valor.slice(0, 11);
    if (valor.length > 2) valor = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
    if (valor.length > 10) valor = `${valor.substring(0, 10)}-${valor.substring(10)}`;
    setValue(fieldName, valor);
  };

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

  useEffect(() => {
    if (dadosEdicao) {
      const possuiAlergia = dadosEdicao.alunoPossuiAlergia || dadosEdicao.alergias?.possui || 'Não';
      const detalhesAlergia = dadosEdicao.qualAlergia || (dadosEdicao.alergias?.detalhes === "Nenhuma informada" ? "" : dadosEdicao.alergias?.detalhes);

      reset({
        ...dadosEdicao,
        cartaoSus: dadosEdicao.cartaoSus === "NÃO INFORMADO" ? "" : (dadosEdicao.cartaoSus || ''),
        naoSabeSus: dadosEdicao.cartaoSus === "NÃO INFORMADO",
        temAlergia: possuiAlergia,
        historicoMedico: detalhesAlergia === "Nenhuma informada" ? "" : detalhesAlergia
      });
      if (dadosEdicao.endereco_rua) setMostrarEndereco(true);
      if (dadosEdicao.contato2) setMostrarSegundoContato(true);
    }
  }, [dadosEdicao, reset]);

  const onSubmit = async (data) => {
    const saveAction = async () => {
      const nomeLimpo = data.nome.trim();
      const dataNascLimpa = data.dataNascimento ? data.dataNascimento.replace(/-/g, '') : 'sem-data';
      
      // Geração de ID padrão
      const idPasta = `${nomeLimpo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${dataNascLimpa}`;

      const payload = {
        ...data,
        nome: nomeLimpo,
        nomeBusca: nomeLimpo.toUpperCase(),
        pacienteId: idPasta,
        tipoPerfil: 'funcionario',
        cartaoSus: data.naoSabeSus ? "NÃO INFORMADO" : data.cartaoSus,
        qualAlergia: data.temAlergia === "Sim" ? data.historicoMedico.trim() : "Nenhuma informada",
        updatedAt: serverTimestamp()
      };

      // 1. Salva na Pasta Digital
      await setDoc(doc(db, "pastas_digitais", idPasta), payload, { merge: true });

      // 2. Salva na coleção específica
      if (dadosEdicao?.id) {
        await setDoc(doc(db, "funcionario", dadosEdicao.id), payload, { merge: true });
      } else {
        await addDoc(collection(db, "funcionario"), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }

      // 3. LIMPA O FORMULÁRIO PARA O PRÓXIMO (SEM SAIR DA PÁGINA)
      reset();
      setMostrarEndereco(false);
      setMostrarSegundoContato(false);
    };

    toast.promise(saveAction(), {
      loading: 'SINCRONIZANDO STAFF...',
      success: 'SUCESSO! CAMPOS LIMPOS PARA NOVO STAFF.',
      error: 'ERRO AO SALVAR.'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-sm border border-slate-200">
      <Toaster position="top-center" />
      
      {/* HEADER COM NAVEGAÇÃO */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard')} 
            className="p-2 hover:bg-slate-100 text-slate-600 rounded-full transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg"><Briefcase size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
              {dadosEdicao ? 'Atualizar Staff' : 'Cadastro Staff'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Controle Interno de Funcionários</p>
          </div>
        </div>

        <button 
          type="button" 
          onClick={() => navigate('/dashboard')} 
          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"
        >
          <X size={28} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NOME COMPLETO */}
        <div className="md:col-span-2 space-y-2">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.nome ? 'text-red-500' : 'text-slate-400'}`}>Nome Completo</label>
          <input 
            {...register("nome", { 
                required: "Obrigatório", 
                pattern: { value: /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, message: "Apenas letras são permitidas" } 
            })} 
            placeholder="Digite nome e sobrenome"
            className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all ${errors.nome ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-slate-900'}`} 
          />
        </div>

        {/* DATA E IDADE */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
          <input type="date" {...register("dataNascimento")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-slate-900 outline-none" required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 italic">Idade (Automática)</label>
          <input type="number" {...register("idade")} readOnly className="w-full px-5 py-4 bg-blue-50 border-2 border-transparent rounded-2xl font-bold text-blue-700 outline-none" />
        </div>

        {/* CARGO E SEXO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Função</label>
          <input {...register("cargo")} placeholder="Ex: Professor, Zelador..." className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-slate-900 outline-none" required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
          <select {...register("sexo")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-slate-900 outline-none" required>
            <option value="">Selecione...</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
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
          <input {...register("cartaoSus")} disabled={naoSabeSus} placeholder={naoSabeSus ? "NÃO INFORMADO" : "000 0000 0000 0000"} className={`w-full px-5 py-4 border-2 rounded-2xl outline-none font-bold transition-all ${naoSabeSus ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-slate-50 border-transparent focus:border-slate-900"}`} />
        </div>

        {/* CONTATOS */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2 italic"><Phone size={14} className="text-blue-600"/> Contatos de Emergência</h3>
            {!mostrarSegundoContato && (
              <button type="button" onClick={() => setMostrarSegundoContato(true)} className="text-[9px] font-black text-blue-600 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50">
                <UserPlus2 size={12}/> ADICIONAR 2º CONTATO
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nome do Contato 01</label>
              <input {...register("nomeContato1")} placeholder="Ex: Esposa, Mãe" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-slate-900 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Telefone 01</label>
              <input 
                {...register("contato")} 
                onChange={(e) => handleTelefoneChange(e, "contato")} 
                placeholder="(21) 90000-0000" 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-slate-900 outline-none" 
              />
            </div>
          </div>
          {mostrarSegundoContato && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nome do Contato 02</label>
                  <button type="button" onClick={() => { setMostrarSegundoContato(false); setValue("contato2", ""); }} className="text-[8px] font-bold text-red-400 hover:text-red-600 uppercase">[REMOVER]</button>
                </div>
                <input {...register("nomeContato2")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-slate-900 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Telefone 02</label>
                <input 
                  {...register("contato2")} 
                  onChange={(e) => handleTelefoneChange(e, "contato2")} 
                  placeholder="(21) 90000-0000" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-slate-900 outline-none" 
                />
              </div>
            </div>
          )}
        </div>

        {/* ENDEREÇO */}
        <div className="md:col-span-2">
          <button type="button" onClick={() => setMostrarEndereco(!mostrarEndereco)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-4 py-3 rounded-2xl hover:bg-blue-100 transition-all">
            <MapPin size={14} /> {mostrarEndereco ? '[-] Ocultar Endereço' : '[+] Adicionar Endereço'}
          </button>
          {mostrarEndereco && (
            <div className="mt-4 p-6 bg-slate-50 rounded-[30px] border-2 border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
               <div className="md:col-span-2 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">Rua e Número</label><input {...register("endereco_rua")} className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none" /></div>
               <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">CEP</label><input {...register("endereco_cep")} placeholder="00000-000" className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none" /></div>
               <div className="md:col-span-3 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">Bairro e Cidade</label><input {...register("endereco_bairro")} className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none" /></div>
            </div>
          )}
        </div>

        {/* ALERGIAS */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><AlertCircle size={14} className="text-orange-500"/> Alergias?</label>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
              {["Sim", "Não"].map((op) => (
                <label key={op} className="cursor-pointer">
                  <input type="radio" value={op} {...register("temAlergia")} className="hidden peer" />
                  <span className="px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all peer-checked:bg-slate-900 peer-checked:text-white text-slate-400 block">{op}</span>
                </label>
              ))}
            </div>
          </div>
          {temAlergia === "Sim" && (
            <textarea {...register("historicoMedico")} className="w-full px-5 py-4 bg-white border-2 border-orange-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-orange-500 resize-none animate-in fade-in" rows="2" placeholder="Detalhes da alergia..."></textarea>
          )}
        </div>

        {/* BOTÃO SALVAR */}
        <button type="submit" disabled={isSubmitting} className="md:col-span-2 mt-4 bg-slate-900 text-white py-5 rounded-[22px] font-black uppercase italic text-xs shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} /> {dadosEdicao ? 'Atualizar Staff' : 'Salvar e Próximo Staff'}</>}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroFuncionario;