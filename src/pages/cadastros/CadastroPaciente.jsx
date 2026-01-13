import { useState } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserPlus, IdentificationCard, GraduationCap, MapPin, Save } from 'lucide-react';

const CadastroPaciente = ({ user }) => {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    turma: '',
    nomeResponsavel: '',
    telefoneResponsavel: '',
    alergias: 'Nenhuma informada'
  });

  const handleCadastro = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "pacientes"), {
        ...formData,
        escolaId: user.escolaId,
        dataCriacao: serverTimestamp(),
        criadoPor: user.nome
      });
      alert("Paciente cadastrado com sucesso!");
      setFormData({ nome: '', cpf: '', dataNascimento: '', turma: '', nomeResponsavel: '', telefoneResponsavel: '', alergias: 'Nenhuma informada' });
    } catch (error) {
      alert("Erro ao cadastrar: " + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-800 uppercase italic">
          <UserPlus className="text-blue-600" size={28} /> Cadastrar Aluno / Paciente
        </h2>

        <form onSubmit={handleCadastro} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nome Completo</label>
            <input required className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:border-blue-500 outline-none font-bold text-slate-700" 
              placeholder="Nome do aluno" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block font-sans">CPF / Matrícula</label>
            <div className="relative">
              <IdentificationCard className="absolute left-4 top-4 text-slate-400" size={18} />
              <input required className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border border-transparent focus:border-blue-500 outline-none font-bold text-slate-700" 
                placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block font-sans">Turma / Série</label>
            <div className="relative">
              <GraduationCap className="absolute left-4 top-4 text-slate-400" size={18} />
              <input className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border border-transparent focus:border-blue-500 outline-none font-bold text-slate-700" 
                placeholder="Ex: 5º Ano B" value={formData.turma} onChange={e => setFormData({...formData, turma: e.target.value})} />
            </div>
          </div>

          <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
            <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 italic">Informações de Saúde e Contato</h3>
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block font-sans text-red-500">Alergias ou Restrições</label>
            <textarea className="w-full p-4 bg-red-50/30 rounded-2xl border border-transparent focus:border-red-500 outline-none font-bold text-slate-700" 
              rows={2} value={formData.alergias} onChange={e => setFormData({...formData, alergias: e.target.value})} />
          </div>

          <button type="submit" className="md:col-span-2 bg-slate-900 hover:bg-blue-600 text-white font-black py-5 rounded-[24px] shadow-lg shadow-slate-200 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
            <Save size={20} /> Finalizar Cadastro
          </button>
        </form>
      </div>
    </div>
  );
};

export default CadastroPaciente;