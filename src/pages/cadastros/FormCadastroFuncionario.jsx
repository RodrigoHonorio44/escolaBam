import { useForm } from 'react-hook-form';
import { funcionarioService } from '../../api/funcionarioService';

const FormCadastroFuncionario = () => {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await funcionarioService.cadastrar(data);
      alert("Funcionário cadastrado com sucesso! Senha padrão: mudar123");
      reset();
    } catch (error) {
      alert("Erro ao realizar cadastro: " + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cadastrar Funcionário</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome Completo</label>
          <input {...register("nome")} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">E-mail (Login)</label>
            <input type="email" {...register("email")} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nível de Acesso</label>
            <select {...register("role")} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="enfermeiro">Enfermeiro</option>
              <option value="diretor">Diretor</option>
              <option value="gestao">Gestão</option>
            </select>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition">
          Confirmar Cadastro
        </button>
      </form>
    </div>
  );
};

export default FormCadastroFuncionario;