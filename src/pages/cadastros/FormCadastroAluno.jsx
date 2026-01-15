import { useForm } from 'react-hook-form';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  UserPlus, Users, Phone, ShieldAlert, Save, 
  Loader2, CreditCard, Calendar, User, AlertCircle 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const FormCadastroAluno = ({ onVoltar }) => {
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      naoSabeSus: false,
      cartaoSus: '',
      sexo: '',
      temAlergia: 'Não',
      historicoMedico: ''
    }
  });

  const naoSabeSus = watch("naoSabeSus");
  const temAlergia = watch("temAlergia");

  const onSubmit = async (data) => {
    const saveAction = async () => {
      const nomeLimpo = data.nome.trim();
      const nomeParaBusca = nomeLimpo.toUpperCase();

      await addDoc(collection(db, "alunos"), {
        nome: nomeLimpo,
        nomeBusca: nomeParaBusca,
        tipoPerfil: 'aluno',
        idade: data.idade,
        sexo: data.sexo,
        turma: data.turma,
        responsavel: data.responsavel,
        contato: data.contato,
        cartaoSus: data.naoSabeSus ? "NÃO INFORMADO" : data.cartaoSus,
        alergias: {
          possui: data.temAlergia,
          detalhes: data.temAlergia === "Sim" ? data.historicoMedico.trim() : "Nenhuma"
        },
        dataCadastro: new Date().toISOString(),
        createdAt: serverTimestamp(),
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
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-sm border border-slate-200 animate-in fade-in duration-500">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg text-white">
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Novo Aluno</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrar aluno no sistema</p>
          </div>
        </div>
        <button onClick={onVoltar} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2">
          [ Voltar ]
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nome */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
          <input 
            {...register("nome")} 
            placeholder="Ex: João Silva Sauro"
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm placeholder:text-slate-300 placeholder:font-medium" 
            required 
          />
        </div>

        {/* Idade e Sexo */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Idade</label>
          <input 
            type="number" 
            {...register("idade")} 
            placeholder="Ex: 12"
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm placeholder:text-slate-300 placeholder:font-medium" 
            required 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Sexo</label>
          <select {...register("sexo")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm" required>
            <option value="">Selecione...</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>

        {/* Cartão SUS */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cartão SUS</label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" {...register("naoSabeSus")} className="w-3 h-3 rounded text-blue-600" />
              <span className="text-[9px] font-black text-slate-400 group-hover:text-orange-500 uppercase transition-colors">Não informado</span>
            </label>
          </div>
          <input 
            {...register("cartaoSus")} 
            disabled={naoSabeSus} 
            placeholder={naoSabeSus ? "NÃO INFORMADO" : "000 0000 0000 0000"} 
            className={`w-full px-5 py-4 border-2 rounded-2xl outline-none font-bold transition-all placeholder:text-slate-300 placeholder:font-medium ${naoSabeSus ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-slate-50 border-transparent text-slate-700 focus:border-blue-600 focus:bg-white"}`} 
          />
        </div>

        {/* Turma */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turma / Ano</label>
          <input 
            {...register("turma")} 
            placeholder="Ex: 6º Ano A (Tarde)"
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm placeholder:text-slate-300 placeholder:font-medium" 
            required 
          />
        </div>

        {/* Responsável e Contato */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável</label>
          <input 
            {...register("responsavel")} 
            placeholder="Nome do pai, mãe ou tutor"
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm placeholder:text-slate-300 placeholder:font-medium" 
            required 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Contato</label>
          <input 
            {...register("contato")} 
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-600 focus:bg-white transition-all shadow-sm placeholder:text-slate-300 placeholder:font-medium" 
            placeholder="(21) 99999-9999" 
          />
        </div>

        {/* --- CAMPO DE ALERGIAS --- */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <AlertCircle size={14} className="text-orange-500"/> O aluno possui alguma alergia?
            </label>
            
            <div className="flex bg-white p-1 rounded-xl shadow-inner border border-slate-200">
              {["Sim", "Não"].map((opcao) => (
                <label key={opcao} className="cursor-pointer">
                  <input type="radio" value={opcao} {...register("temAlergia")} className="hidden peer" />
                  <span className="px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all peer-checked:bg-slate-900 peer-checked:text-white text-slate-400 block">
                    {opcao}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {temAlergia === "Sim" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[9px] font-black text-orange-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                 <ShieldAlert size={12}/> Detalhes Médicos / Alergias
              </label>
              <textarea 
                {...register("historicoMedico")} 
                className="w-full mt-2 px-5 py-4 bg-white border-2 border-orange-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-orange-500 transition-all shadow-sm resize-none placeholder:text-orange-200 placeholder:font-medium" 
                rows="3"
                placeholder="Descreva aqui: Ex: Alérgico a Dipirona, Corantes, Picada de abelha..."
                required={temAlergia === "Sim"}
              ></textarea>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="md:col-span-2 mt-4 bg-blue-600 text-white py-5 rounded-[22px] font-black uppercase tracking-[0.2em] italic text-xs shadow-xl hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-slate-300"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Finalizar Cadastro Aluno</>}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroAluno;