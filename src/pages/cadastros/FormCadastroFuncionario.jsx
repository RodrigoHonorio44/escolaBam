import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { 
  Briefcase, Save, Loader2, CreditCard, ChevronLeft, AlertCircle 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ✅ Adicionada a prop onSucesso
const FormCadastroFuncionario = ({ onVoltar, dadosEdicao, onSucesso }) => {
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      naoSabeSus: false,
      sexo: '',
      temAlergia: 'Não',
      historicoMedico: '' 
    }
  });

  // --- EFEITO PARA CARREGAR DADOS VINDOS DA PASTA DIGITAL ---
  useEffect(() => {
    if (dadosEdicao) {
      reset({
        nome: dadosEdicao.nome || '',
        idade: dadosEdicao.idade || '',
        sexo: dadosEdicao.sexo || '',
        cargo: dadosEdicao.cargo || '',
        cartaoSus: dadosEdicao.cartaoSus === "NÃO INFORMADO" ? "" : dadosEdicao.cartaoSus,
        naoSabeSus: dadosEdicao.cartaoSus === "NÃO INFORMADO",
        temAlergia: dadosEdicao.alergias?.possui || 'Não',
        historicoMedico: dadosEdicao.alergias?.detalhes === "Nenhuma informada" ? "" : dadosEdicao.alergias?.detalhes
      });
    }
  }, [dadosEdicao, reset]);

  const naoSabeSus = watch("naoSabeSus");
  const temAlergia = watch("temAlergia");

  const onSubmit = async (data) => {
    const saveAction = async () => {
      const nomeLimpo = data.nome.trim();
      const nomeParaBusca = nomeLimpo.toUpperCase();

      let susFinal = data.cartaoSus;
      if (data.naoSabeSus || !susFinal) {
        susFinal = "NÃO INFORMADO";
      }

      const payload = {
        nome: nomeLimpo,
        nomeBusca: nomeParaBusca,
        tipoPerfil: 'funcionario',
        idade: data.idade,
        sexo: data.sexo,
        cargo: data.cargo,
        cartaoSus: susFinal,
        alergias: {
          possui: data.temAlergia,
          detalhes: data.temAlergia === "Sim" ? data.historicoMedico.trim() : "Nenhuma informada"
        },
        updatedAt: serverTimestamp()
      };

      if (dadosEdicao?.id) {
        // ATUALIZAÇÃO
        await setDoc(doc(db, "funcionario", dadosEdicao.id), payload, { merge: true });
      } else {
        // NOVO CADASTRO
        await addDoc(collection(db, "funcionario"), {
          ...payload,
          dataCadastro: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
      }
      
      // ✅ LOGICA DE RETORNO PARA A PASTA DIGITAL
      if (onSucesso) {
        setTimeout(() => {
          onSucesso({ nome: nomeLimpo }); // Passa o nome para o Dashboard reabrir a pasta
        }, 1500);
      } else if (!dadosEdicao) {
        reset();
      }
    };

    toast.promise(saveAction(), {
      loading: 'SALVANDO DADOS...',
      success: dadosEdicao ? 'DADOS ATUALIZADOS COM SUCESSO!' : 'STAFF CADASTRADO COM SUCESSO!',
      error: 'ERRO AO SALVAR.',
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
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-sm border border-slate-200 animate-in fade-in duration-500">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-3 rounded-2xl shadow-lg text-white">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
              {dadosEdicao ? 'Atualizar Staff' : 'Cadastro Staff'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               {dadosEdicao ? `Editando: ${dadosEdicao.nome}` : 'Registrar na coleção funcionario'}
            </p>
          </div>
        </div>
        <button 
          onClick={onVoltar}
          className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2"
        >
          <ChevronLeft size={14} /> Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nome */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
          <input {...register("nome")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-slate-900 focus:bg-white transition-all shadow-sm" required />
        </div>

        {/* Idade e Sexo */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Idade</label>
          <input type="number" {...register("idade")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-slate-900 focus:bg-white transition-all shadow-sm" required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Sexo</label>
          <select {...register("sexo")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-slate-900 focus:bg-white transition-all shadow-sm cursor-pointer" required>
            <option value="">Selecione...</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>

        {/* Cargo */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Cargo / Função</label>
          <input {...register("cargo")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-slate-700 focus:border-slate-900 focus:bg-white transition-all shadow-sm" required />
        </div>

        {/* Cartão SUS */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={12} className="text-blue-600"/> Cartão SUS
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" {...register("naoSabeSus")} className="w-3 h-3 text-blue-600 rounded" />
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
              : "bg-slate-50 border-transparent text-slate-700 focus:border-slate-900 focus:bg-white"
            }`}
          />
        </div>

        {/* Alergias */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} className="text-orange-500"/> Possui alguma alergia?
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
              <textarea 
                {...register("historicoMedico")} 
                className="w-full mt-2 px-5 py-4 bg-white border-2 border-orange-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-orange-500 transition-all shadow-sm resize-none" 
                rows="3"
                placeholder="Ex: Alérgico a penicilina..."
                required={temAlergia === "Sim"}
              ></textarea>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="md:col-span-2 mt-4 bg-slate-900 text-white py-5 rounded-[22px] font-black uppercase tracking-[0.2em] italic text-xs shadow-xl hover:bg-blue-600 transition-all disabled:bg-slate-300 flex items-center justify-center gap-3"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> {dadosEdicao ? 'Atualizar Dados' : 'Finalizar Registro Staff'}</>}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroFuncionario;