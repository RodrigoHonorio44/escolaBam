import { useForm } from 'react-hook-form';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  UserPlus, Users, Phone, ShieldAlert, Save, 
  Loader2, CreditCard, Calendar, User 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const FormCadastroAluno = ({ onVoltar }) => {
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      naoSabeSus: false,
      cartaoSus: '',
      sexo: ''
    }
  });

  const naoSabeSus = watch("naoSabeSus");

  const onSubmit = async (data) => {
    const saveAction = async () => {
      await addDoc(collection(db, "alunos"), {
        ...data,
        nomeUpperCase: data.nome.toUpperCase(),
        dataCadastro: new Date().toISOString(),
        createdAt: serverTimestamp(),
        cartaoSus: data.naoSabeSus ? "NÃO INFORMADO" : data.cartaoSus
      });
      reset();
    };

    toast.promise(saveAction(), {
      loading: 'SALVANDO DADOS...',
      success: 'ALUNO CADASTRADO COM SUCESSO!',
      error: 'ERRO AO SALVAR.',
    }, {
      style: {
        minWidth: '250px',
        background: '#0f172a',
        color: '#fff',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '900',
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-sm border border-slate-200">
      <Toaster position="top-center" />
      
      <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg text-white">
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Novo Cadastro</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrar aluno no sistema</p>
          </div>
        </div>
        <button 
          onClick={onVoltar}
          className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
        >
          [ Voltar ]
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nome */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
          <input 
            {...register("nome")} 
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm" 
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
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm" 
            placeholder="Ex: 12"
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
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
            required
          >
            <option value="">Selecione...</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        {/* Cartão SUS */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={12} className="text-blue-600"/> Cartão SUS
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                {...register("naoSabeSus")}
                className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[9px] font-black text-slate-400 group-hover:text-orange-500 uppercase transition-colors">Não informado</span>
            </label>
          </div>
          <input 
            {...register("cartaoSus")} 
            disabled={naoSabeSus}
            placeholder={naoSabeSus ? "NÃO INFORMADO" : "000 0000 0000 0000"}
            className={`w-full px-4 py-3.5 border-2 rounded-2xl outline-none font-bold transition-all shadow-sm ${
              naoSabeSus 
              ? "bg-slate-100 border-slate-200 text-slate-400 italic" 
              : "bg-slate-50 border-transparent text-slate-700 focus:border-blue-600 focus:bg-white"
            }`}
          />
        </div>

        {/* Turma */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Users size={12} className="text-blue-600"/> Turma / Ano
          </label>
          <input 
            {...register("turma")} 
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm" 
            placeholder="Ex: 6º Ano A"
            required 
          />
        </div>

        {/* Responsável */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Responsável</label>
          <input 
            {...register("responsavel")} 
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm" 
            required 
          />
        </div>

        {/* Contato */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Phone size={12} className="text-blue-600"/> Contato
          </label>
          <input 
            {...register("contato")} 
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm" 
            placeholder="(00) 00000-0000" 
          />
        </div>

        {/* Histórico Médico */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <ShieldAlert size={12} className="text-orange-500"/> Observações / Alergias
          </label>
          <textarea 
            {...register("historicoMedico")} 
            className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm resize-none" 
            rows="3"
            placeholder="Alergias, remédios, restrições..."
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="md:col-span-2 mt-4 bg-blue-600 text-white py-5 rounded-[20px] font-black uppercase tracking-[0.2em] italic text-xs shadow-xl hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-slate-300"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Salvar Aluno</>}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroAluno;