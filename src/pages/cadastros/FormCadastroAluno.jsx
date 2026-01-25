import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, serverTimestamp, doc, getDocs, query, where, writeBatch 
} from 'firebase/firestore';
import { 
  UserPlus, Save, Loader2, AlertCircle, School, X, ArrowLeft,
  Ruler, Weight, Fingerprint, Search, Hash, MapPin, CreditCard, Users, Phone
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Função para aplicar máscara de celular: (21) 97596-6331
const aplicarMascaraTelefone = (valor) => {
  if (!valor) return "";
  const n = valor.replace(/\D/g, ""); // Remove tudo que não é número
  if (n.length <= 10) {
    // Formato para fixo ou celular antigo
    return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  // Formato para celular moderno (9 dígitos)
  return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const FormCadastroAluno = ({ onVoltar, dadosEdicao, alunoParaEditar, modoPastaDigital = !!(dadosEdicao || alunoParaEditar), onClose, onSucesso }) => {
  const navigate = useNavigate();
  const [buscando, setBuscando] = useState(false);

  const dadosIniciais = alunoParaEditar || dadosEdicao;

  // Normalização para minúsculas conforme diretriz R S
  const paraBanco = (txt) => txt ? String(txt).toLowerCase().trim() : "";

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm({
    mode: "onChange", 
    defaultValues: {
      nome: '',
      matriculaInteligente: '',
      naoSabeMatricula: false,
      cartaoSus: '',
      naoSabeEtnia: false,
      naoSabePeso: false,
      naoSabeAltura: false,
      naoSabeEndereco: false,
      sexo: '',
      dataNascimento: '',
      idade: '',
      turma: '',
      etnia: '',
      peso: '',
      altura: '',
      contato1_nome: '',
      contato1_parentesco: 'mãe',
      contato1_telefone: '',
      contato2_nome: '',
      contato2_parentesco: 'pai',
      contato2_telefone: '',
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
        cartaoSus: paraBanco(dadosIniciais.cartaoSus),
        contato1_nome: paraBanco(dadosIniciais.contato1_nome || dadosIniciais.responsavel),
        contato1_parentesco: paraBanco(dadosIniciais.contato1_parentesco || dadosIniciais.parentesco || 'mãe'),
        // Aplica máscara ao carregar do banco
        contato1_telefone: aplicarMascaraTelefone(dadosIniciais.contato1_telefone || ""),
        contato2_nome: paraBanco(dadosIniciais.contato2_nome),
        contato2_parentesco: paraBanco(dadosIniciais.contato2_parentesco || 'pai'),
        contato2_telefone: aplicarMascaraTelefone(dadosIniciais.contato2_telefone || ""),
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
          turma: paraBanco(dadosEncontrados.turma),
          sexo: paraBanco(dadosEncontrados.sexo),
          cartaoSus: paraBanco(dadosEncontrados.cartaoSus),
          contato1_telefone: aplicarMascaraTelefone(dadosEncontrados.contato1_telefone || ""),
          contato2_telefone: aplicarMascaraTelefone(dadosEncontrados.contato2_telefone || ""),
          contato1_nome: paraBanco(dadosEncontrados.contato1_nome || dadosEncontrados.responsavel)
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
  const naoSabeEndereco = watch("naoSabeEndereco");
  const naoSabeEtnia = watch("naoSabeEtnia");
  const naoSabePeso = watch("naoSabePeso");
  const naoSabeAltura = watch("naoSabeAltura");
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
        cartaoSus: paraBanco(data.cartaoSus),
        // Remove máscara para salvar apenas números
        contato1_telefone: data.contato1_telefone.replace(/\D/g, ""),
        contato2_telefone: data.contato2_telefone.replace(/\D/g, ""),
        contato1_nome: paraBanco(data.contato1_nome),
        contato1_parentesco: paraBanco(data.contato1_parentesco),
        contato2_nome: paraBanco(data.contato2_nome),
        contato2_parentesco: paraBanco(data.contato2_parentesco),
        responsavel: paraBanco(data.contato1_nome), 
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
        
        {/* DOCUMENTAÇÃO */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-blue-50 rounded-[30px] border-2 border-blue-100 shadow-inner">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Hash size={14}/> Matrícula Escolar</label>
                <div className="flex gap-2 items-center">
                  <input {...register("matriculaInteligente")} disabled={naoSabeMatricula} placeholder={naoSabeMatricula ? "PENDENTE" : "00000000"} className={`flex-1 px-5 py-4 rounded-2xl font-bold outline-none border-2 transition-all ${naoSabeMatricula ? 'bg-slate-200 border-transparent text-slate-400' : 'bg-white border-transparent focus:border-blue-600 text-blue-900'}`} />
                  <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                      <input type="checkbox" {...register("naoSabeMatricula")} className="w-4 h-4 rounded border-blue-300 text-blue-600" />
                      <span className="text-[9px] font-black text-slate-500 uppercase">N/P</span>
                  </label>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2"><CreditCard size={14}/> Cartão SUS</label>
                <input {...register("cartaoSus")} placeholder="000 0000 0000 0000" className="w-full px-5 py-4 rounded-2xl font-bold outline-none border-2 border-transparent bg-white focus:border-blue-600 text-blue-900 transition-all" />
            </div>
        </div>

        {/* NOME COMPLETO - APLICADO CAPITALIZE VISUAL */}
        <div className="md:col-span-2 space-y-2">
          <label className={`text-[10px] font-black uppercase tracking-widest ${errors.nome ? 'text-red-500' : 'text-slate-400'}`}>Nome Completo do Aluno</label>
          <div className="relative group">
            <input 
              {...register("nome", { 
                required: "digite o nome completo",
                pattern: { value: /^[a-zA-Zá-úÁ-Ú']+\s+[a-zA-Zá-úÁ-Ú']+.*$/, message: "digite nome e sobrenome" }
              })} 
              placeholder="ex: rodrigo honorio" 
              className={`w-full px-5 py-4 border-2 rounded-2xl font-bold outline-none transition-all capitalize ${errors.nome ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-transparent focus:border-blue-600'}`} 
            />
            <button type="button" onClick={buscarAluno} disabled={buscando} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all">
              {buscando ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </div>
          <p className="text-[8px] font-bold text-blue-500 uppercase ml-2 italic">Exibição: R S | Armazenamento: r s (lowercase)</p>
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

        {/* CONTATOS COM TRAVA DE MÁSCARA */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-200 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-2 italic"><Users size={14}/> Contatos de Emergência (Mínimo 2)</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contato 1 */}
            <div className="space-y-3 p-5 bg-white rounded-[25px] border border-slate-100 shadow-inner">
              <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">Contato Principal</p>
              <input {...register("contato1_nome", { required: true })} placeholder="nome do responsável" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none border border-transparent focus:border-blue-600 lowercase" />
              <div className="grid grid-cols-2 gap-2">
                <select {...register("contato1_parentesco")} className="px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none border border-transparent focus:border-blue-600 lowercase">
                  <option value="mãe">mãe</option>
                  <option value="pai">pai</option>
                  <option value="avó">avó</option>
                  <option value="avô">avô</option>
                  <option value="outros">outros</option>
                </select>
                <div className="relative">
                  <input 
                    {...register("contato1_telefone", { required: true })} 
                    onChange={(e) => setValue("contato1_telefone", aplicarMascaraTelefone(e.target.value))}
                    placeholder="(00) 00000-0000" 
                    maxLength={15}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none border border-transparent focus:border-blue-600" 
                  />
                  <Phone size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                </div>
              </div>
            </div>

            {/* Contato 2 */}
            <div className="space-y-3 p-5 bg-white rounded-[25px] border border-slate-100 shadow-inner">
              <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">Contato Secundário</p>
              <input {...register("contato2_nome")} placeholder="nome do segundo contato" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none border border-transparent focus:border-blue-600 lowercase" />
              <div className="grid grid-cols-2 gap-2">
                <select {...register("contato2_parentesco")} className="px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none border border-transparent focus:border-blue-600 lowercase">
                  <option value="pai">pai</option>
                  <option value="mãe">mãe</option>
                  <option value="avó">avó</option>
                  <option value="avô">avô</option>
                  <option value="outros">outros</option>
                </select>
                <div className="relative">
                  <input 
                    {...register("contato2_telefone")} 
                    onChange={(e) => setValue("contato2_telefone", aplicarMascaraTelefone(e.target.value))}
                    placeholder="(00) 00000-0000" 
                    maxLength={15}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none border border-transparent focus:border-blue-600" 
                  />
                  <Phone size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESTANTE DO FORMULÁRIO (ENDEREÇO, ETNIA, TURMA...) MANTIDO ORIGINAL */}
        <div className="md:col-span-2 p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 italic"><MapPin size={14}/> Endereço</label>
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("naoSabeEndereco")} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Não possui</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input {...register("endereco_cep")} disabled={naoSabeEndereco} onChange={handleCEPChange} placeholder="CEP" className="px-5 py-4 bg-white rounded-2xl font-bold outline-none border border-transparent focus:border-blue-600" />
            <input {...register("endereco_rua")} disabled={naoSabeEndereco} placeholder="rua" className="md:col-span-2 px-5 py-4 bg-white rounded-2xl font-bold outline-none border border-transparent focus:border-blue-600 lowercase" />
            <input {...register("endereco_bairro")} disabled={naoSabeEndereco} placeholder="bairro / cidade" className="md:col-span-3 px-5 py-4 bg-white rounded-2xl font-bold outline-none border border-transparent focus:border-blue-600 lowercase" />
          </div>
        </div>

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

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><School size={12}/> Turma</label>
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

        <div className="md:col-span-2 p-6 bg-red-50 rounded-[30px] border-2 border-red-100 space-y-4 shadow-sm">
          <label className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2 italic"><AlertCircle size={14}/> Alergias</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select {...register("temAlergia")} className="w-full px-5 py-4 bg-white border-2 border-red-100 rounded-2xl font-bold outline-none lowercase">
              <option value="não">não possui alergias</option>
              <option value="sim">sim, possui alergias</option>
            </select>
            {watchTemAlergia === 'sim' && (
              <input {...register("historicoMedico")} placeholder="quais as alergias?" className="w-full px-5 py-4 bg-white border-2 border-red-200 rounded-2xl font-bold text-red-700 focus:border-red-600 outline-none lowercase animate-in fade-in" />
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