import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom'; // <--- IMPORTADO
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { 
  UserPlus, Save, Loader2, AlertCircle, Lock, MapPin, Phone, CreditCard, UserPlus2, School, X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const FormCadastroAluno = ({ onVoltar, dadosEdicao }) => {
  const navigate = useNavigate(); // <--- INICIALIZADO
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

  // Preencher campos se for edição
  useEffect(() => {
    if (dadosEdicao) {
      reset(dadosEdicao);
      if (dadosEdicao.endereco_rua) setMostrarEndereco(true);
      if (dadosEdicao.contato2) setMostrarSegundoContato(true);
    }
  }, [dadosEdicao, reset]);

  const watchDataNasc = watch("dataNascimento");
  const naoSabeSus = watch("naoSabeSus");

  // Cálculo automático de idade
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

  const formatarTelefone = (valor) => {
    const tel = valor.replace(/\D/g, "");
    if (tel.length <= 11) {
      return tel.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
    }
    return valor;
  };

  const onSubmit = async (data) => {
    const saveAction = async () => {
      const nomeLimpo = data.nome.trim();
      const dataNascLimpa = data.dataNascimento ? data.dataNascimento.replace(/-/g, '') : 'sem-data';
      const idPasta = `${nomeLimpo.toLowerCase().replace(/\s+/g, '-')}-${dataNascLimpa}`;
      
      const payload = { 
        ...data, 
        nome: nomeLimpo,
        nomeBusca: nomeLimpo.toUpperCase(),
        pacienteId: idPasta,
        tipoPerfil: 'aluno',
        cartaoSus: data.naoSabeSus ? "NÃO INFORMADO" : data.cartaoSus,
        updatedAt: serverTimestamp() 
      };
      
      // 1. Salva na Pasta Digital (Centralizador)
      await setDoc(doc(db, "pastas_digitais", idPasta), payload, { merge: true });
      
      // 2. Salva na coleção específica de Alunos
      if (dadosEdicao?.id) {
        await setDoc(doc(db, "alunos", dadosEdicao.id), payload, { merge: true });
      } else {
        await addDoc(collection(db, "alunos"), { ...payload, createdAt: serverTimestamp() });
      }

      // 3. REDIRECIONAMENTO COM ESTADO
      // Enviamos o nome para a rota /pasta-digital que já está configurada no seu App.js
      setTimeout(() => {
        navigate('/pasta-digital', { 
          state: { 
            alunoParaReabrir: { 
              nome: nomeLimpo, 
              reabrir: true 
            } 
          } 
        });
      }, 1000);
    };

    toast.promise(saveAction(), { 
      loading: 'Sincronizando dados...', 
      success: 'Aluno registrado! Abrindo pasta...', 
      error: 'Erro ao salvar aluno.' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
      <Toaster position="top-center" />
      
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
            {dadosEdicao ? 'Editar Registro' : 'Cadastro de Aluno'}
          </h2>
        </div>
        <button onClick={onVoltar} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
          <X size={24} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NOME COMPLETO */}
        <div className="md:col-span-2 space-y-2">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.nome ? 'text-red-500' : 'text-slate-400'}`}>Nome Completo do Aluno</label>
          <input {...register("nome", { required: "Nome obrigatório", pattern: { value: /\s+/, message: "Digite nome e sobrenome" } })} placeholder="Ex: João Silva" className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all ${errors.nome ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-blue-600'}`} />
          {errors.nome && <span className="text-[9px] text-red-500 font-bold uppercase ml-2 italic tracking-tighter">{errors.nome.message}</span>}
        </div>

        {/* DATA E IDADE */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
          <input type="date" {...register("dataNascimento")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-600 outline-none shadow-sm" required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 italic">Idade Atual</label>
          <input type="number" {...register("idade")} readOnly className="w-full px-5 py-4 bg-blue-50 border-2 border-transparent rounded-2xl font-bold text-blue-700 outline-none cursor-not-allowed" />
        </div>

        {/* TURMA */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><School size={12}/> Turma / Ano</label>
          <input {...register("turma")} placeholder="Ex: 1º Ano A, 203, Jardim II" className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-600 outline-none shadow-sm" required />
        </div>

        {/* SEXO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
          <select {...register("sexo")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-600 outline-none shadow-sm" required>
            <option value="">Selecione...</option>
            <option value="Menino">Menino</option>
            <option value="Menina">Menina</option>
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
          <input {...register("responsavel")} placeholder="Nome de quem assina" className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-600 outline-none shadow-sm" required />
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
              <input {...register("nomeContato1")} placeholder="Ex: Maria (Mãe)" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone 01</label>
              <input {...register("contato")} onChange={(e) => setValue("contato", formatarTelefone(e.target.value))} placeholder="(21) 90000-0000" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-600" />
            </div>
          </div>

          {mostrarSegundoContato && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Contato 02</label>
                   <button type="button" onClick={() => { setMostrarSegundoContato(false); setValue("contato2", ""); setValue("nomeContato2", ""); }} className="text-[8px] font-bold text-red-400 hover:text-red-600 uppercase">[Remover]</button>
                </div>
                <input {...register("nomeContato2")} placeholder="Ex: José (Tio)" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-600" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone 02</label>
                <input {...register("contato2")} onChange={(e) => setValue("contato2", formatarTelefone(e.target.value))} placeholder="(21) 90000-0000" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-600" />
              </div>
            </div>
          )}
        </div>

        {/* ENDEREÇO */}
        <div className="md:col-span-2">
          <button type="button" onClick={() => setMostrarEndereco(!mostrarEndereco)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-4 py-3 rounded-2xl shadow-sm hover:bg-blue-100 transition-colors">
            <MapPin size={14} /> {mostrarEndereco ? '[-] Ocultar Endereço' : '[+] Adicionar Endereço Completo'}
          </button>
          {mostrarEndereco && (
            <div className="mt-4 p-6 bg-slate-50 rounded-[30px] border-2 border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
               <div className="md:col-span-2 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">Rua e Número</label><input {...register("endereco_rua")} placeholder="Ex: Rua das Flores, 123" className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none shadow-sm" /></div>
               <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">CEP</label><input {...register("endereco_cep")} placeholder="24000-000" className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none shadow-sm" /></div>
               <div className="md:col-span-3 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase">Bairro e Cidade</label><input {...register("endereco_bairro")} placeholder="Ex: Centro, Maricá/RJ" className="w-full px-4 py-3 rounded-xl border-none font-bold outline-none shadow-sm" /></div>
            </div>
          )}
        </div>

        {/* BOTÃO FINALIZAR */}
        <button type="submit" disabled={isSubmitting} className="md:col-span-2 mt-4 bg-blue-600 text-white py-5 rounded-[22px] font-black uppercase italic text-xs shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Finalizar Registro e Abrir Pasta</>}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroAluno;