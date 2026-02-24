import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Save, Loader2, CreditCard, AlertCircle, MapPin, Phone, UserPlus2, X, ArrowLeft,
  Ruler, Weight, Fingerprint
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useFormCadastroFuncionario } from '../../hooks/useFormCadastroFuncionario';

const FormCadastroFuncionario = ({ onVoltar, dadosEdicao, onSucesso, onClose, modoPastaDigital = !!dadosEdicao }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Define isRoot para evitar erro de variável não definida
  const isRoot = user?.role === 'root' || user?.email === 'suporte@rodhon.com';

  // Função de fechar/voltar estabilizada
  const handleActionVoltar = React.useCallback(() => {
    if (modoPastaDigital) {
      if (onClose) onClose();
      else if (onVoltar) onVoltar();
    } else {
      navigate('/dashboard');
    }
  }, [modoPastaDigital, onClose, onVoltar, navigate]);

  const {
    register, handleSubmit, onSubmit, errors, isSubmitting, setValue,
    watchValues, mostrarEndereco, setMostrarEndereco, mostrarSegundoContato, setMostrarSegundoContato,
    carregandoCep, buscandoDados, paraExibicao
  } = useFormCadastroFuncionario(dadosEdicao, modoPastaDigital, onSucesso, handleActionVoltar);

  // Máscara visual de telefone
  const handleTelefoneChange = (e, field) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
    if (v.length > 10) v = `${v.substring(0, 10)}-${v.substring(10)}`;
    setValue(field, v);
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
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">
              {modoPastaDigital ? 'Atualizar Staff' : 'Cadastro Staff'}
            </h2>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
              Unidade: {user?.escola || "Não Identificada"}
            </p>
          </div>
        </div>
        <button type="button" onClick={handleActionVoltar} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all">
          <X size={28} />
        </button>
      </div>

      {/* Importante: onSubmit={handleSubmit(onSubmit)} deve receber a função do hook */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* NOME COMPLETO - R S: Exibe Capitalizado / Salva Lowercase */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${errors.nome ? 'text-red-500' : 'text-slate-400'}`}>
              Nome Completo {buscandoDados && <Loader2 size={12} className="animate-spin text-blue-500" />}
            </label>
            {errors.nome && <span className="text-[9px] font-black text-red-500 uppercase italic animate-pulse">{errors.nome.message}</span>}
          </div>
          <input 
            {...register("nome", { 
              required: "obrigatório",
              pattern: { value: /^[a-zA-Zá-úÁ-Ú']+\s+[a-zA-Zá-úÁ-Ú']+.*$/, message: "digite nome e sobrenome" }
            })} 
            onInput={(e) => {
              e.target.value = paraExibicao(e.target.value);
            }}
            readOnly={modoPastaDigital && !isRoot}
            placeholder="Rogeria dos Santos Silva"
            className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all ${modoPastaDigital && !isRoot ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : errors.nome ? 'border-red-500 bg-red-50' : 'bg-slate-50 border-transparent focus:border-slate-900'}`} 
          />
        </div>

        {/* DATA E IDADE */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Nascimento</label>
          <input type="date" {...register("dataNascimento")} className="w-full px-5 py-4 border-2 rounded-2xl font-bold bg-slate-50 border-transparent focus:border-slate-900 outline-none" required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 italic block">Idade</label>
          <input type="number" {...register("idade")} readOnly className="w-full px-5 py-4 bg-blue-50 border-none rounded-2xl font-bold text-blue-700 cursor-not-allowed" />
        </div>

        {/* ETNIA, PESO, ALTURA */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Fingerprint size={12}/> Etnia</label>
              <input type="checkbox" {...register("naoSabeEtnia")} className="w-3 h-3" />
            </div>
            <select {...register("etnia")} disabled={watchValues.naoSabeEtnia} className="w-full px-5 py-4 bg-white rounded-2xl font-bold outline-none shadow-sm">
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
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Weight size={12}/> Peso (kg)</label>
              <input type="checkbox" {...register("naoSabePeso")} className="w-3 h-3" />
            </div>
            <input {...register("peso")} disabled={watchValues.naoSabePeso} placeholder="00.0" className="w-full px-5 py-4 bg-white rounded-2xl font-bold outline-none shadow-sm" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Ruler size={12}/> Altura (m)</label>
              <input type="checkbox" {...register("naoSabeAltura")} className="w-3 h-3" />
            </div>
            <input {...register("altura")} disabled={watchValues.naoSabeAltura} placeholder="0.00" className="w-full px-5 py-4 bg-white rounded-2xl font-bold outline-none shadow-sm" />
          </div>
        </div>

        {/* CARGO E SEXO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Cargo</label>
          <input {...register("cargo")} placeholder="ex: professor" className="w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none bg-slate-50 border-transparent focus:border-slate-900" required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Sexo</label>
          <select {...register("sexo")} className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl font-bold outline-none focus:border-slate-900" required>
            <option value="">selecione...</option>
            <option value="masculino">masculino</option>
            <option value="feminino">feminino</option>
          </select>
        </div>

        {/* CARTÃO SUS */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><CreditCard size={12}/> Cartão SUS</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("naoSabeSus")} className="w-3 h-3" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Não informado</span>
            </label>
          </div>
          <input {...register("cartaoSus")} disabled={watchValues.naoSabeSus} placeholder="000 0000 0000 0000" className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-slate-900 disabled:opacity-50 shadow-inner" />
        </div>

        {/* CONTATOS DE EMERGÊNCIA */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2 italic"><Phone size={14} className="text-blue-600"/> Contatos de Emergência</h3>
            {!mostrarSegundoContato && (
              <button type="button" onClick={() => setMostrarSegundoContato(true)} className="text-[9px] font-black text-blue-600 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50 transition-all">
                <UserPlus2 size={12}/> ADICIONAR 2º CONTATO
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input {...register("nomeContato1")} placeholder="nome contato 1" className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-slate-900 shadow-sm" />
            <input {...register("contato")} value={watchValues.contato || ""} onChange={(e) => handleTelefoneChange(e, "contato")} placeholder="telefone 1" className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-slate-900 shadow-sm" />
          </div>
          {mostrarSegundoContato && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 animate-in slide-in-from-top-2">
              <input {...register("nomeContato2")} placeholder="nome contato 2" className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-slate-900 shadow-sm" />
              <input {...register("contato2")} value={watchValues.contato2 || ""} onChange={(e) => handleTelefoneChange(e, "contato2")} placeholder="telefone 2" className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-slate-900 shadow-sm" />
            </div>
          )}
        </div>

        {/* ENDEREÇO */}
        <div className="md:col-span-2">
          <button type="button" onClick={() => setMostrarEndereco(!mostrarEndereco)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-4 py-3 rounded-2xl hover:bg-blue-100 transition-all">
            <MapPin size={14} /> {mostrarEndereco ? '[-] ocultar endereço' : '[+] adicionar endereço'}
          </button>
          {mostrarEndereco && (
            <div className="mt-4 p-6 bg-slate-50 rounded-[30px] border-2 border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2">CEP {carregandoCep && <Loader2 className="animate-spin w-3 h-3 text-blue-500"/>}</label>
                  <input {...register("endereco_cep")} placeholder="00000-000" className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none shadow-sm" />
                </div>
                <div className="md:col-span-2 space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Rua</label><input {...register("endereco_rua")} className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none shadow-sm" /></div>
                <div className="md:col-span-3 space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Bairro/Cidade</label><input {...register("endereco_bairro")} className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none shadow-sm" /></div>
            </div>
          )}
        </div>

        {/* ALERGIAS */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 italic"><AlertCircle size={14} className="text-orange-500"/> Alergias?</label>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              {["sim", "não"].map((op) => (
                <label key={op} className="cursor-pointer">
                  <input type="radio" value={op} {...register("temAlergia")} className="hidden peer" />
                  <span className="px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all peer-checked:bg-slate-900 peer-checked:text-white text-slate-400 block">{op}</span>
                </label>
              ))}
            </div>
          </div>
          {watchValues.temAlergia === "sim" && (
            <textarea {...register("historicoMedico")} className="w-full px-5 py-4 bg-white border-2 border-orange-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-orange-500 resize-none animate-in fade-in" rows="2" placeholder="detalhes da alergia..."></textarea>
          )}
        </div>

        {/* BOTÃO SUBMIT */}
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`md:col-span-2 mt-4 py-5 rounded-[22px] font-black uppercase italic text-xs shadow-xl transition-all flex items-center justify-center gap-3 
            ${Object.keys(errors).length > 0 ? 'bg-red-500' : 'bg-slate-900 hover:bg-blue-600'} text-white disabled:bg-slate-300 active:scale-[0.98]`}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Save size={18} /> 
              {modoPastaDigital ? 'atualizar staff' : 'salvar e próximo staff'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroFuncionario;