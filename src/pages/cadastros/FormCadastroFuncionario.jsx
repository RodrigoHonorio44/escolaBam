import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { collection, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { 
  Briefcase, Save, Loader2, CreditCard, AlertCircle, MapPin, Phone, UserPlus2, X, ArrowLeft,
  Ruler, Weight, Fingerprint
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const FormCadastroFuncionario = ({ onVoltar, dadosEdicao, onSucesso, onClose, modoPastaDigital = !!dadosEdicao }) => {
  const navigate = useNavigate();
  const [mostrarEndereco, setMostrarEndereco] = useState(false);
  const [mostrarSegundoContato, setMostrarSegundoContato] = useState(false);
  const [carregandoCep, setCarregandoCep] = useState(false);

  const paraBanco = (val) => val ? String(val).toLowerCase().trim() : "";

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm({
    mode: "onChange",
    defaultValues: dadosEdicao || {
      nome: '',
      naoSabeSus: false,
      naoSabeEtnia: false,
      naoSabePeso: false,
      naoSabeAltura: false,
      cartaoSus: '',
      sexo: '',
      dataNascimento: '',
      idade: '',
      cargo: '',
      etnia: '',
      peso: '',
      altura: '',
      nomeContato1: '',
      contato: '',
      nomeContato2: '',
      contato2: '',
      temAlergia: 'não',
      historicoMedico: '',
      endereco_rua: '',
      endereco_cep: '',
      endereco_bairro: ''
    }
  });

  const watchDataNasc = watch("dataNascimento");
  const naoSabeSus = watch("naoSabeSus");
  const naoSabeEtnia = watch("naoSabeEtnia");
  const naoSabePeso = watch("naoSabePeso");
  const naoSabeAltura = watch("naoSabeAltura");
  const temAlergia = watch("temAlergia");
  const watchCep = watch("endereco_cep");

  useEffect(() => {
    const buscarCep = async () => {
      const cepLimpo = watchCep?.replace(/\D/g, '');
      if (cepLimpo?.length === 8) {
        setCarregandoCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
          const data = await response.json();
          if (!data.erro) {
            setValue("endereco_rua", paraBanco(data.logradouro));
            setValue("endereco_bairro", paraBanco(`${data.bairro} - ${data.localidade}/${data.uf}`));
            toast.success("endereço localizado!");
          }
        } catch (error) {
          toast.error("erro ao buscar cep");
        } finally {
          setCarregandoCep(false);
        }
      }
    };
    buscarCep();
  }, [watchCep, setValue]);

  const handleActionVoltar = () => {
    if (modoPastaDigital) {
      if (onClose) onClose();
      else if (onVoltar) onVoltar();
    } else {
      navigate('/dashboard');
    }
  };

  const handleNumericInput = (e, fieldName) => {
    let valor = e.target.value.replace(/[^0-9.]/g, "");
    setValue(fieldName, valor);
  };

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

  const onSubmit = async (data) => {
    const saveAction = async () => {
      const nomeNormalizado = paraBanco(data.nome);
      const dataNascLimpa = data.dataNascimento ? data.dataNascimento.replace(/-/g, '') : 'sem-data';
      const idPasta = `${nomeNormalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${dataNascLimpa}`;

      const payload = {
        ...data,
        nome: nomeNormalizado,
        nomeBusca: nomeNormalizado,
        pacienteId: idPasta,
        tipoPerfil: 'funcionario',
        cargo: paraBanco(data.cargo),
        sexo: paraBanco(data.sexo),
        etnia: data.naoSabeEtnia ? "não informado" : paraBanco(data.etnia),
        peso: data.naoSabePeso ? "não informado" : data.peso,
        altura: data.naoSabeAltura ? "não informado" : data.altura,
        cartaoSus: data.naoSabeSus ? "não informado" : data.cartaoSus,
        nomeContato1: paraBanco(data.nomeContato1),
        nomeContato2: paraBanco(data.nomeContato2),
        endereco_rua: paraBanco(data.endereco_rua),
        endereco_bairro: paraBanco(data.endereco_bairro),
        alunoPossuiAlergia: paraBanco(data.temAlergia),
        qualAlergia: data.temAlergia === "sim" ? paraBanco(data.historicoMedico) : "nenhuma",
        updatedAt: serverTimestamp()
      };

      const batch = writeBatch(db);
      batch.set(doc(db, "pastas_digitais", idPasta), payload, { merge: true });
      batch.set(doc(db, "funcionario", idPasta), payload, { merge: true });
      await batch.commit();
      
      if (modoPastaDigital) {
        setTimeout(() => handleActionVoltar(), 800);
      } else {
        reset();
        setMostrarEndereco(false);
        setMostrarSegundoContato(false);
      }
      if (onSucesso) onSucesso();
    };

    toast.promise(saveAction(), {
      loading: 'sincronizando staff...',
      success: 'dados salvos com sucesso!',
      error: 'erro ao salvar staff.'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-sm border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
      <Toaster position="top-center" />
      
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={handleActionVoltar} className="p-2 hover:bg-slate-100 text-slate-600 rounded-full transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg"><Briefcase size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
              {modoPastaDigital ? 'Atualizar Staff' : 'Cadastro Staff'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Controle Interno de Funcionários</p>
          </div>
        </div>
        <button type="button" onClick={handleActionVoltar} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all">
          <X size={28} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* Nome com Validação de Sobrenome */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className={`text-[10px] font-black uppercase tracking-widest block ${errors.nome ? 'text-red-500' : 'text-slate-400'}`}>Nome Completo</label>
            {errors.nome && <span className="text-[9px] font-black text-red-500 uppercase italic animate-pulse">{errors.nome.message}</span>}
          </div>
          <input 
            {...register("nome", { 
              required: "campo obrigatório",
              pattern: {
                value: /^[a-zA-Zá-úÁ-Ú']+\s+[a-zA-Zá-úÁ-Ú']+.*$/,
                message: "digite o nome e sobrenome"
              }
            })} 
            readOnly={modoPastaDigital}
            placeholder="ex: caio giromba"
            className={`w-full px-5 py-4 border-2 rounded-2xl font-bold lowercase outline-none transition-all ${modoPastaDigital ? 'bg-slate-100 cursor-not-allowed border-transparent text-slate-500' : errors.nome ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600' : 'bg-slate-50 border-transparent focus:border-slate-900'}`} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Data de Nascimento</label>
          <input type="date" {...register("dataNascimento")} readOnly={modoPastaDigital} className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none ${modoPastaDigital ? 'bg-slate-100 border-transparent' : 'bg-slate-50 border-transparent focus:border-slate-900'}`} required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 italic block">Idade (Automática)</label>
          <input type="number" {...register("idade")} readOnly className="w-full px-5 py-4 bg-blue-50 border-2 border-transparent rounded-2xl font-bold text-blue-700 outline-none cursor-not-allowed" />
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 shadow-inner">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Fingerprint size={12}/> Etnia</label>
              <input type="checkbox" {...register("naoSabeEtnia")} className="w-3 h-3 rounded" />
            </div>
            <select {...register("etnia")} disabled={naoSabeEtnia} className="w-full px-5 py-4 bg-white border-2 border-transparent rounded-2xl font-bold focus:border-slate-900 outline-none shadow-sm lowercase">
              <option value="">selecione...</option>
              <option value="branca">branca</option>
              <option value="preta">preta</option>
              <option value="parda">parda</option>
              <option value="amarela">amarela</option>
              <option value="indígena">indígena</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Weight size={12}/> Peso (kg)</label>
              <input type="checkbox" {...register("naoSabePeso")} className="w-3 h-3 rounded" />
            </div>
            <input {...register("peso")} disabled={naoSabePeso} onChange={(e) => handleNumericInput(e, "peso")} placeholder={naoSabePeso ? "n/a" : "00.0"} className="w-full px-5 py-4 bg-white border-2 border-transparent rounded-2xl font-bold focus:border-slate-900 outline-none shadow-sm" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Ruler size={12}/> Altura (m)</label>
              <input type="checkbox" {...register("naoSabeAltura")} className="w-3 h-3 rounded" />
            </div>
            <input {...register("altura")} disabled={naoSabeAltura} onChange={(e) => handleNumericInput(e, "altura")} placeholder={naoSabeAltura ? "n/a" : "0.00"} className="w-full px-5 py-4 bg-white border-2 border-transparent rounded-2xl font-bold focus:border-slate-900 outline-none shadow-sm" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Cargo / Função</label>
          <input {...register("cargo")} readOnly={modoPastaDigital} placeholder="ex: professor" className={`w-full px-5 py-4 border-2 rounded-2xl font-bold lowercase outline-none ${modoPastaDigital ? 'bg-slate-100 border-transparent' : 'bg-slate-50 border-transparent focus:border-slate-900'}`} required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Sexo</label>
          <select {...register("sexo")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-slate-900 outline-none lowercase" required>
            <option value="">selecione...</option>
            <option value="masculino">masculino</option>
            <option value="feminino">feminino</option>
          </select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={12}/> Cartão SUS</label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" {...register("naoSabeSus")} className="w-3 h-3 rounded" />
              <span className="text-[9px] font-black text-slate-400 group-hover:text-orange-500 uppercase transition-colors">Não informado</span>
            </label>
          </div>
          <input {...register("cartaoSus")} disabled={naoSabeSus} placeholder={naoSabeSus ? "não informado" : "000 0000 0000 0000"} className={`w-full px-5 py-4 border-2 rounded-2xl outline-none font-bold transition-all ${naoSabeSus ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-slate-50 border-transparent focus:border-slate-900"}`} />
        </div>

        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2 italic"><Phone size={14} className="text-blue-600"/> Contatos de Emergência</h3>
            {!mostrarSegundoContato && (
              <button type="button" onClick={() => setMostrarSegundoContato(true)} className="text-[9px] font-black text-blue-600 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50 flex items-center gap-2">
                <UserPlus2 size={12}/> ADICIONAR 2º CONTATO
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Nome do Contato 01</label>
              <input {...register("nomeContato1")} placeholder="nome do contato" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold lowercase focus:border-slate-900 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Telefone 01</label>
              <input {...register("contato")} onChange={(e) => handleTelefoneChange(e, "contato")} placeholder="(21) 90000-0000" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-slate-900 outline-none" />
            </div>
          </div>
          {mostrarSegundoContato && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Nome do Contato 02</label>
                  <button type="button" onClick={() => { setMostrarSegundoContato(false); setValue("contato2", ""); setValue("nomeContato2", ""); }} className="text-[8px] font-bold text-red-400 hover:text-red-600 uppercase">[REMOVER]</button>
                </div>
                <input {...register("nomeContato2")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold lowercase focus:border-slate-900 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Telefone 02</label>
                <input {...register("contato2")} onChange={(e) => handleTelefoneChange(e, "contato2")} placeholder="(21) 90000-0000" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:border-slate-900 outline-none" />
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <button type="button" onClick={() => setMostrarEndereco(!mostrarEndereco)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-4 py-3 rounded-2xl hover:bg-blue-100 transition-all">
            <MapPin size={14} /> {mostrarEndereco ? '[-] ocultar endereço' : '[+] adicionar endereço'}
          </button>
          {mostrarEndereco && (
            <div className="mt-4 p-6 bg-slate-50 rounded-[30px] border-2 border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2">CEP {carregandoCep && <Loader2 className="animate-spin w-3 h-3 text-blue-500"/>}</label>
                  <input {...register("endereco_cep")} placeholder="00000-000" className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none shadow-sm" />
                </div>
                <div className="md:col-span-2 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase block">Rua e Número</label><input {...register("endereco_rua")} className="w-full px-4 py-3 rounded-xl border-none font-bold lowercase outline-none shadow-sm" /></div>
                <div className="md:col-span-3 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase block">Bairro e Cidade</label><input {...register("endereco_bairro")} className="w-full px-4 py-3 rounded-xl border-none font-bold lowercase outline-none shadow-sm" /></div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic"><AlertCircle size={14} className="text-orange-500"/> Alergias?</label>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
              {["sim", "não"].map((op) => (
                <label key={op} className="cursor-pointer">
                  <input type="radio" value={op} {...register("temAlergia")} className="hidden peer" />
                  <span className="px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all peer-checked:bg-slate-900 peer-checked:text-white text-slate-400 block">{op}</span>
                </label>
              ))}
            </div>
          </div>
          {temAlergia === "sim" && (
            <textarea {...register("historicoMedico")} className="w-full px-5 py-4 bg-white border-2 border-orange-200 rounded-2xl outline-none font-bold lowercase text-slate-700 focus:border-orange-500 resize-none animate-in fade-in" rows="2" placeholder="detalhes da alergia..."></textarea>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`md:col-span-2 mt-4 py-5 rounded-[22px] font-black uppercase italic text-xs shadow-xl transition-all flex items-center justify-center gap-3 
            ${Object.keys(errors).length > 0 ? 'bg-red-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'} 
            disabled:bg-slate-300`}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} /> {modoPastaDigital ? 'atualizar staff' : 'salvar e próximo staff'}</>}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroFuncionario;