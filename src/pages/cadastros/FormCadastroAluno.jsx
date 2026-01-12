import { useForm } from 'react-hook-form';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const FormCadastroAluno = () => {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await addDoc(collection(db, "alunos"), {
        ...data,
        dataCadastro: new Date().toISOString()
      });
      alert("Aluno cadastrado com sucesso!");
      reset();
    } catch (error) {
      alert("Erro ao cadastrar aluno.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Cadastro de Aluno</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
          <input {...register("nome")} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turma/Ano</label>
          <input {...register("turma")} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Responsável</label>
          <input {...register("responsavel")} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contato</label>
          <input {...register("contato")} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="(00) 00000-0000" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações Médicas/Alergias</label>
          <textarea {...register("historicoMedico")} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows="3"></textarea>
        </div>
        <button type="submit" className="md:col-span-2 bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition">
          Salvar Cadastro
        </button>
      </form>
    </div>
  );
};

export default FormCadastroAluno;