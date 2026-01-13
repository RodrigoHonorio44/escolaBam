import { useForm } from 'react-hook-form';
import { funcionarioService } from '../../api/funcionarioService';
import { 
  UserPlus, 
  Briefcase, 
  Save, 
  Calendar, 
  User, // Ícone universal para substituir o VenusMars
  Loader2, 
  CreditCard, 
  ShieldAlert, 
  ChevronLeft 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const FormCadastroFuncionario = ({ onVoltar }) => {
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      naoSabeSus: false,
      sexo: ''
    }
  });

  const naoSabeSus = watch("naoSabeSus");

  const onSubmit = async (data) => {
    const saveAction = async () => {
      const payload = {
        ...data,
        cartaoSus: data.naoSabeSus ? "NÃO INFORMADO" : data.cartaoSus,
        dataCadastro: new Date().toISOString()
      };
      
      await funcionarioService.cadastrar(payload);
      reset();
    };

    toast.promise(saveAction(), {
      loading: 'CADASTRANDO...',
      success: 'SUCESSO!',
      error: (err) => `ERRO: ${err.message}`,
    }, {
      style: {
        minWidth: '300px',
        background: '#0f172a',
        color: '#fff',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '900',
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-sm border border-slate-200">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-3 rounded-2xl shadow-lg text-white">
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Cadastro Staff</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrar novo profissional</p>
          </div>
        </div>
        <button 
          onClick={onVoltar}
          className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest"
        >
          <ChevronLeft size={14} /> Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nome Completo */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
          <input 
            {...register("nome")} 
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-slate-900 focus:bg-white transition-all shadow-sm" 
            placeholder="Nome do funcionário"
            required 
          />
        </div>

        {/* Idade */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Calendar size={12} className="text-blue-600"/> Idade
          </label>
          <input 
            type="number"
            {...register("idade")} 
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm" 
            placeholder="Ex: 35"
            required 
          />
        </div>

        {/* Sexo */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <User size={12} className="text-blue-600"/> Sexo
          </label>
          <select 
            {...register("sexo")} 
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm cursor-pointer"
            required
          >
            <option value="">Selecione...</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        {/* Cargo */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Briefcase size={12} className="text-blue-600"/> Cargo / Função
          </label>
          <input 
            {...register("cargo")} 
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm" 
            placeholder="Ex: Professor"
            required 
          />
        </div>

        {/* Cartão SUS */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={12} className="text-blue-600"/> Cartão SUS
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" {...register("naoSabeSus")} className="w-3 h-3 text-blue-600" />
              <span className="text-[9px] font-black text-slate-400 group-hover:text-orange-500 uppercase transition-colors">Não informado</span>
            </label>
          </div>
          <input 
            {...register("cartaoSus")} 
            disabled={naoSabeSus}
            placeholder={naoSabeSus ? "NÃO INFORMADO" : "000 0000 0000 0000"}
            className={`w-full px-5 py-4 border-2 rounded-2xl outline-none font-bold transition-all shadow-sm ${
              naoSabeSus 
              ? "bg-slate-100 border-slate-200 text-slate-400 italic" 
              : "bg-slate-50 border-transparent text-slate-700 focus:border-blue-600 focus:bg-white"
            }`}
          />
        </div>

        {/* Histórico Clínico */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <ShieldAlert size={12} className="text-orange-500"/> Histórico / Alergias
          </label>
          <textarea 
            {...register("historicoMedico")} 
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm resize-none" 
            rows="3"
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="md:col-span-2 mt-4 bg-slate-900 text-white py-5 rounded-[22px] font-black uppercase tracking-[0.2em] italic text-xs shadow-xl hover:bg-blue-600 transition-all disabled:bg-slate-300 flex items-center justify-center gap-3"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Finalizar Registro Staff</>}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroFuncionario;