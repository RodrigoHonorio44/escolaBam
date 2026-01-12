import { useForm } from 'react-hook-form';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const FormBam = () => {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await addDoc(collection(db, "ocorrencias"), {
        ...data,
        dataOcorrencia: new Date().toISOString(),
        status: 'pendente'
      });
      alert("BAM registrado com sucesso!");
      reset();
    } catch (error) {
      alert("Erro ao registrar BAM.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-red-800">Novo BAM (Atendimento)</h2>
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Urgente</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aluno</label>
            <input {...register("aluno_nome")} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" placeholder="Nome do aluno" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ocorrência</label>
            <select {...register("tipo")} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500">
              <option value="clinico">Atendimento Clínico</option>
              <option value="comportamental">Comportamental</option>
              <option value="acidente">Acidente Escolar</option>
              <option value="conflito">Conflito entre Alunos</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Atendimento</label>
          <textarea {...register("descricao")} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" rows="5" placeholder="Detalhe o ocorrido..." required></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Providências Tomadas</label>
          <input {...register("providencias")} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500" placeholder="Ex: Contatado os pais, encaminhado ao hospital..." />
        </div>

        <button type="submit" className="w-full bg-red-700 text-white py-3 rounded-lg font-bold hover:bg-red-800 transition shadow-md">
          Finalizar e Registrar Ocorrência
        </button>
      </form>
    </div>
  );
};

export default FormBam;