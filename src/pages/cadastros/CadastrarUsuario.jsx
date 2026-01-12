import { useState } from 'react';
import { db, auth } from '../../firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { UserPlus, Shield, Building2, Briefcase, CheckCircle2, Star } from 'lucide-react';

const CadastrarUsuario = () => {
  const [formData, setFormData] = useState({
    nome: '', 
    email: '', 
    senha: '', 
    role: 'enfermeiro', 
    prazo: '30',
    escolaId: 'Escola Municipal Anísio Teixeira'
  });

  const [modulos, setModulos] = useState({
    financeiro: false,
    pacientes: true,
    estoque: false,
    relatorios: false
  });

  const selecionarPlano = (plano) => {
    if (plano === 'basico') {
      setModulos({ financeiro: false, pacientes: true, estoque: false, relatorios: false });
    } else if (plano === 'premium') {
      setModulos({ financeiro: true, pacientes: true, estoque: true, relatorios: true });
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    try {
      // 1. Cria o usuário no Firebase Auth com a senha padrão definida pelo Admin
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      const uid = userCredential.user.uid;
      
      const expira = new Date();
      expira.setDate(expira.getDate() + parseInt(formData.prazo));
      const modulosAtivos = Object.keys(modulos).filter(key => modulos[key]);

      // 2. Salva no Firestore com a flag 'primeiroAcesso' para forçar a troca de senha
      await setDoc(doc(db, "users", uid), {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
        licencaStatus: 'ativo',
        dataExpiracao: expira.toISOString(),
        modulos: modulosAtivos,
        primeiroAcesso: true, // 🚩 ESSENCIAL: Força o redirecionamento no primeiro login
        lastAccess: new Date().toISOString(),
        escolaId: formData.escolaId,
        dataCriacao: new Date().toISOString()
      });

      alert("Usuário criado! Ele deverá trocar a senha no primeiro acesso.");
      setFormData({ ...formData, nome: '', email: '', senha: '' });
    } catch (error) { 
      alert("Erro ao cadastrar: " + error.message); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Novo Acesso SaaS</h1>
        <p className="text-slate-500 font-medium">Defina a senha padrão e os módulos do novo funcionário.</p>
      </div>

      <form onSubmit={handleCadastro} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800">
              <UserPlus className="text-blue-600" /> Identificação do Usuário
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block font-sans">Nome Completo</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700" 
                  placeholder="Nome do funcionário" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block font-sans">Cargo / Função</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-4 text-slate-400" size={18} />
                  <select className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="enfermeiro">Enfermeiro</option>
                    <option value="enfermeira">Enfermeira</option>
                    <option value="diretor">Diretor</option>
                    <option value="diretora">Diretora</option>
                    <option value="psicologa">Psicóloga</option>
                    <option value="administrativo">Administrativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block font-sans">Unidade Escolar</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-4 text-slate-400" size={18} />
                  <select className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none"
                    value={formData.escolaId} onChange={e => setFormData({...formData, escolaId: e.target.value})}>
                    <option value="Escola Municipal Anísio Teixeira">E. M. Anísio Teixeira</option>
                    <option value="Hosp. Conde Modesto Leal">Hosp. Conde Modesto Leal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block font-sans">E-mail de Login</label>
                <input required type="email" className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700" 
                  placeholder="email@escola.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block font-sans">Senha Padrão (Admin)</label>
                <input required type="password" className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner" 
                  placeholder="Senha que você criou" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-blue-900/20 text-white">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Shield className="text-blue-400" /> Plano & Módulos
            </h2>

            <div className="flex gap-2 mb-8 bg-slate-800 p-1.5 rounded-2xl">
              <button type="button" onClick={() => selecionarPlano('basico')} className="flex-1 text-[9px] font-black p-3 rounded-xl transition-all hover:bg-slate-700 uppercase tracking-widest font-sans">Básico</button>
              <button type="button" onClick={() => selecionarPlano('premium')} className="flex-1 text-[9px] font-black p-3 rounded-xl bg-blue-600 text-white uppercase tracking-widest flex items-center justify-center gap-1 shadow-lg shadow-blue-600/20 font-sans">
                <Star size={12} fill="white" /> Premium
              </button>
            </div>

            <div className="space-y-3 mb-8">
              {Object.keys(modulos).map(m => (
                <label key={m} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${modulos[m] ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-800 border-transparent'}`}>
                  <span className="text-xs font-bold capitalize tracking-wide font-sans">{m}</span>
                  <input type="checkbox" className="hidden" checked={modulos[m]} onChange={() => setModulos({...modulos, [m]: !modulos[m]})} />
                  {modulos[m] ? <CheckCircle2 size={18} className="text-blue-400" /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-600" />}
                </label>
              ))}
            </div>

            <div className="mb-8">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block font-sans text-left">Período de Validade</label>
              <select className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm"
                value={formData.prazo} onChange={e => setFormData({...formData, prazo: e.target.value})}>
                <option value="30">30 Dias (Mensal)</option>
                <option value="90">90 Dias (Trimestral)</option>
                <option value="365">1 Ano (Anual)</option>
              </select>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] shadow-lg shadow-blue-600/40 transition-all uppercase tracking-[0.2em] text-xs font-sans">
              Ativar Acesso
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CadastrarUsuario;