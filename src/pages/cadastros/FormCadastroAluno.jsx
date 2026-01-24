import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, serverTimestamp, doc, getDocs, query, where, writeBatch 
} from 'firebase/firestore';
import { 
  UserPlus, Save, Loader2, AlertCircle, School, X, ArrowLeft,
  Ruler, Weight, Fingerprint, Search, Hash, MapPin
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const FormCadastroAluno = ({ onVoltar, dadosEdicao, alunoParaEditar, modoPastaDigital = !!(dadosEdicao || alunoParaEditar), onClose, onSucesso }) => {
  const navigate = useNavigate();
  const [buscando, setBuscando] = useState(false);

  const dadosIniciais = alunoParaEditar || dadosEdicao;

  // Normalização para minúsculas
  const paraBanco = (txt) => txt ? String(txt).toLowerCase().trim() : "";

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm({
    mode: "onChange", 
    defaultValues: {
      nome: '',
      matriculaInteligente: '',
      naoSabeMatricula: false,
      naoSabeEtnia: false,
      naoSabePeso: false,
      naoSabeAltura: false,
      naoSabeEndereco: false,
      cartaoSus: '',
      sexo: '',
      dataNascimento: '',
      idade: '',
      turma: '',
      etnia: '',
      peso: '',
      altura: '',
      parentesco: 'mãe',
      responsavel: '',
      temAlergia: 'não',
      historicoMedico: '',
      endereco_rua: '',
      endereco_cep: '',
      endereco_bairro: ''
    }
  });

  // Carregamento inicial de dados para edição
  useEffect(() => {
    if (dadosIniciais) {
      const mapeado = {
        ...dadosIniciais,
        nome: paraBanco(dadosIniciais.nome || dadosIniciais.nomePaciente || ""),
        turma: paraBanco(dadosIniciais.turma),
        sexo: paraBanco(dadosIniciais.sexo),
        peso: dadosIniciais.peso ? String(dadosIniciais.peso) : "",
        altura: dadosIniciais.altura ? String(dadosIniciais.altura) : "",
        temAlergia: dadosIniciais.alunoPossuiAlergia || dadosIniciais.temAlergia || 'não',
        historicoMedico: dadosIniciais.qualAlergia || dadosIniciais.historicoMedico || '',
        endereco_rua: paraBanco(dadosIniciais.endereco_rua),
        endereco_bairro: paraBanco(dadosIniciais.endereco_bairro)
      };

      reset(mapeado);
      setValue("naoSabeEtnia", !dadosIniciais.etnia);
      setValue("naoSabePeso", !dadosIniciais.peso);
      setValue("naoSabeAltura", !dadosIniciais.altura);
      setValue("naoSabeEndereco", !!dadosIniciais.naoSabeEndereco);
      setValue("naoSabeMatricula", !dadosIniciais.matriculaInteligente);
    }
  }, [dadosIniciais, reset, setValue]);

  // --- BUSCA GLOBAL EM TODAS AS COLEÇÕES ---
  const buscarAluno = async () => {
    const nomeBusca = paraBanco(watch("nome"));
    if (nomeBusca.length < 3) {
      toast.error("digite ao menos 3 letras para buscar");
      return;
    }

    setBuscando(true);
    try {
      const colecoes = ["alunos", "pastas_digitais", "atendimentos_enfermagem", "triagens"];
      let dadosEncontrados = null;

      for (const col of colecoes) {
        // Atendimento de enfermagem usa 'nomePaciente', as outras usam 'nome'
        const campoFiltro = col === "atendimentos_enfermagem" ? "nomePaciente" : "nome";
        const q = query(collection(db, col), where(campoFiltro, "==", nomeBusca));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          dadosEncontrados = querySnapshot.docs[0].data();
          break; 
        }
      }

      if (dadosEncontrados) {
        const payloadNormalizado = {
          ...dadosEncontrados,
          nome: paraBanco(dadosEncontrados.nome || dadosEncontrados.nomePaciente),
          temAlergia: dadosEncontrados.alunoPossuiAlergia || dadosEncontrados.temAlergia || 'não',
          historicoMedico: dadosEncontrados.qualAlergia || dadosEncontrados.historicoMedico || '',
          peso: dadosEncontrados.peso ? String(dadosEncontrados.peso) : "",
          altura: dadosEncontrados.altura ? String(dadosEncontrados.altura) : "",
          turma: paraBanco(dadosEncontrados.turma),
          sexo: paraBanco(dadosEncontrados.sexo)
        };
        reset(payloadNormalizado);
        toast.success("registro localizado e importado!");
      } else {
        toast.error("não encontrado em nenhuma base.");
      }
    } catch (error) {
      toast.error("erro na busca global.");
    } finally {
      setBuscando(false);
    }
  };

  const watchDataNasc = watch("dataNascimento");
  const naoSabeMatricula = watch("naoSabeMatricula");
  const naoSabeEtnia = watch("naoSabeEtnia");
  const naoSabePeso = watch("naoSabePeso");
  const naoSabeAltura = watch("naoSabeAltura");
  const naoSabeEndereco = watch("naoSabeEndereco");
  const watchTemAlergia = watch("temAlergia");

  const handleCEPChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, "");
    setValue("endereco_cep", cep);
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setValue("endereco_rua", paraBanco(data.logradouro));
          setValue("endereco_bairro", paraBanco(`${data.bairro}, ${data.localidade}/${data.uf}`));
          toast.success("endereço localizado!");
        }
      } catch (error) { toast.error("erro ao buscar cep"); }
    }
  };

  useEffect(() => {
    if (watchDataNasc) {
      const hoje = new Date();
      const nasc = new Date(watchDataNasc);
      let idade = hoje.getFullYear() - nasc.getFullYear();
      if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) idade--;
      setValue("idade", idade >= 0 ? idade : "");
    }
  }, [watchDataNasc, setValue]);

  const handleActionVoltar = () => {
    if (modoPastaDigital) { (onClose ? onClose() : onVoltar()); } 
    else { navigate('/dashboard'); }
  };

  const onSubmit = async (data) => {
    const saveAction = async () => {
      const nomeNormalizado = paraBanco(data.nome);
      const dataNascLimpa = data.dataNascimento ? data.dataNascimento.replace(/-/g, '') : 'sem-data';
      const idGerado = dadosIniciais?.pacienteId || `${nomeNormalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${dataNascLimpa}`;
      
      const payload = { 
        ...data, 
        nome: nomeNormalizado,
        nomeBusca: nomeNormalizado,
        responsavel: paraBanco(data.responsavel),
        turma: paraBanco(data.turma),
        sexo: paraBanco(data.sexo),
        etnia: data.naoSabeEtnia ? "" : paraBanco(data.etnia),
        peso: data.naoSabePeso ? "" : String(data.peso).replace(',', '.'),
        altura: data.naoSabeAltura ? "" : String(data.altura).replace(',', '.'),
        endereco_rua: data.naoSabeEndereco ? "pendente" : paraBanco(data.endereco_rua),
        endereco_bairro: data.naoSabeEndereco ? "pendente" : paraBanco(data.endereco_bairro),
        pacienteId: idGerado,
        tipoPerfil: 'aluno',
        updatedAt: serverTimestamp(),
        alunoPossuiAlergia: paraBanco(data.temAlergia),
        qualAlergia: data.temAlergia === "sim" ? paraBanco(data.historicoMedico) : ""
      };
      
      const batch = writeBatch(db);
      batch.set(doc(db, "pastas_digitais", idGerado), payload, { merge: true });
      batch.set(doc(db, "alunos", idGerado), { ...payload, createdAt: dadosIniciais?.createdAt || serverTimestamp() }, { merge: true });

      await batch.commit();
      if (onSucesso) onSucesso();
      if (modoPastaDigital) { handleActionVoltar(); } 
      else { reset(); }
    };
    toast.promise(saveAction(), { loading: 'sincronizando...', success: 'base atualizada!', error: 'erro ao salvar.' });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[40px] shadow-2xl border border-slate-200 font-sans">
      <Toaster position="top-center" />
      
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={handleActionVoltar} className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-all"><ArrowLeft size={24} /></button>
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><UserPlus size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
              {dadosIniciais ? 'Atualizar Pasta' : 'Cadastro de Aluno'}
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Sincronismo Digital Ativado</p>
          </div>
        </div>
        <button type="button" onClick={handleActionVoltar} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={28} /></button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MATRÍCULA */}
        <div className="md:col-span-2 p-5 bg-blue-50 rounded-[30px] border-2 border-blue-100 flex flex-col md:flex-row gap-4 items-end shadow-inner">
            <div className="flex-1 space-y-2 w-full">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Hash size={14}/> Matrícula Escolar</label>
                <input {...register("matriculaInteligente")} disabled={naoSabeMatricula} placeholder={naoSabeMatricula ? "PENDENTE" : "00000000"} className={`w-full px-5 py-4 rounded-2xl font-bold outline-none border-2 transition-all ${naoSabeMatricula ? 'bg-slate-200 border-transparent text-slate-400' : 'bg-white border-transparent focus:border-blue-600 text-blue-900'}`} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" {...register("naoSabeMatricula")} className="w-4 h-4 rounded border-blue-300 text-blue-600" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Não possui</span>
            </label>
        </div>

        {/* NOME COMPLETO */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className={`text-[10px] font-black uppercase tracking-widest ${errors.nome ? 'text-red-500' : 'text-slate-400'}`}>Nome Completo do Aluno</label>
            {errors.nome && <span className="text-[9px] font-black text-red-500 uppercase italic animate-pulse">{errors.nome.message}</span>}
          </div>
          <div className="relative group">
            <input 
              {...register("nome", { 
                required: "digite o nome completo",
                pattern: { value: /^[a-zA-Zá-úÁ-Ú']+\s+[a-zA-Zá-úÁ-Ú']+.*$/, message: "digite nome e sobrenome" }
              })} 
              placeholder="ex: Rodrigo Honorio" 
              className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all ${errors.nome ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-blue-600'}`} 
            />
            <button type="button" onClick={buscarAluno} disabled={buscando} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all">
              {buscando ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </div>
        </div>

        {/* DATA E IDADE */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
          <input type="date" {...register("dataNascimento")} className="w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none bg-slate-50 border-transparent focus:border-blue-600" required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 italic">Idade Atual</label>
          <input type="number" {...register("idade")} readOnly className="w-full px-5 py-4 bg-blue-50 rounded-2xl font-bold text-blue-700 outline-none" />
        </div>

        {/* ENDEREÇO */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 italic"><MapPin size={14}/> Localização e Endereço</label>
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("naoSabeEndereco")} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Não possui endereço</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">CEP</label>
              <input {...register("endereco_cep")} disabled={naoSabeEndereco} onChange={handleCEPChange} placeholder={naoSabeEndereco ? "PENDENTE" : "00000-000"} className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all ${naoSabeEndereco ? 'bg-slate-200 border-transparent' : 'bg-white border-transparent focus:border-blue-600'}`} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Rua / Logradouro</label>
              <input {...register("endereco_rua")} disabled={naoSabeEndereco} placeholder={naoSabeEndereco ? "ENDEREÇO NÃO INFORMADO" : ""} className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all lowercase ${naoSabeEndereco ? 'bg-slate-200 border-transparent' : 'bg-white border-transparent focus:border-blue-600'}`} />
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bairro / Cidade / UF</label>
              <input {...register("endereco_bairro")} disabled={naoSabeEndereco} placeholder={naoSabeEndereco ? "PENDENTE" : ""} className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all lowercase ${naoSabeEndereco ? 'bg-slate-200 border-transparent' : 'bg-white border-transparent focus:border-blue-600'}`} />
            </div>
          </div>
        </div>

        {/* BIOMETRIA */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Fingerprint size={12}/> Etnia</label>
              <input type="checkbox" {...register("naoSabeEtnia")} className="w-3 h-3" />
            </div>
            <select {...register("etnia")} disabled={naoSabeEtnia} className="w-full px-4 py-3 bg-white rounded-xl font-bold outline-none border border-slate-200 focus:border-blue-600 lowercase">
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
            <input {...register("peso")} placeholder="00.0" className="w-full px-4 py-3 bg-white rounded-xl font-bold border border-slate-200 outline-none focus:border-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Ruler size={12}/> Altura (m)</label>
              <input type="checkbox" {...register("naoSabeAltura")} className="w-3 h-3" />
            </div>
            <input {...register("altura")} placeholder="0.00" className="w-full px-4 py-3 bg-white rounded-xl font-bold border border-slate-200 outline-none focus:border-blue-600" />
          </div>
        </div>

        {/* TURMA E SEXO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><School size={12}/> Turma Escolar</label>
          <input {...register("turma")} placeholder="ex: 1º ano a" className="w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none bg-slate-50 border-transparent focus:border-blue-600 lowercase" required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
          <select {...register("sexo")} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-600 outline-none lowercase" required>
            <option value="">selecione...</option>
            <option value="masculino">masculino</option>
            <option value="feminino">feminino</option>
          </select>
        </div>

        {/* ALERGIAS */}
        <div className="md:col-span-2 p-6 bg-red-50 rounded-[30px] border-2 border-red-100 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2 italic"><AlertCircle size={14}/> Sinais Vitais e Alergias</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select {...register("temAlergia")} className="w-full px-5 py-4 bg-white border-2 border-red-100 rounded-2xl font-bold outline-none lowercase">
              <option value="não">não possui alergias</option>
              <option value="sim">sim, possui alergias</option>
            </select>
            {watchTemAlergia === 'sim' && (
              <input {...register("historicoMedico")} placeholder="quais as alergias?" className="w-full px-5 py-4 bg-white border-2 border-red-200 rounded-2xl font-bold text-red-700 focus:border-red-600 outline-none lowercase animate-in fade-in slide-in-from-left-2" />
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`md:col-span-2 mt-4 py-6 rounded-[30px] font-black uppercase italic shadow-2xl flex items-center justify-center gap-4 transition-all 
            ${Object.keys(errors).length > 0 ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} 
            disabled:opacity-50`}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar e Sincronizar Tudo</>}
        </button>
      </form>
    </div>
  );
};

export default FormCadastroAluno;