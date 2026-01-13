import { useState } from 'react';
import { cadastrarUsuarioService } from '../../services/authService';
import toast, { Toaster } from 'react-hot-toast'; 
import { 
  UserPlus, Building2, Briefcase, CheckCircle2, 
  Star, CalendarDays, Loader2, ShieldCheck, Stethoscope 
} from 'lucide-react';

const CadastrarUsuario = () => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '', 
    email: '', 
    senha: '', 
    role: 'enfermeiro', 
    prazo: '365'
  });

  const [modulos, setModulos] = useState({
    atendimento: true,
    triagem: true,
    estoque_medicamentos: false,
    relatorios_saude: false
  });

  const selecionarPlano = (plano) => {
    if (plano === 'basico') {
      setModulos({ atendimento: true, triagem: true, estoque_medicamentos: false, relatorios_saude: false });
    } else if (plano === 'premium') {
      setModulos({ atendimento: true, triagem: true, estoque_medicamentos: true, relatorios_saude: true });
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    
    // 1. VALIDAÇÃO DE NOME COMPLETO (Trava de Sobrenome)
    const nomeLimpo = formData.nome.trim();
    const partesDoNome = nomeLimpo.split(/\s+/); // Divide o nome pelos espaços
    
    if (partesDoNome.length < 2) {
      toast.error("Por favor, insira o nome e pelo menos um sobrenome.", {
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
      });
      return;
    }

    setLoading(true);

    try {
      const expira = new Date();
      expira.setDate(expira.getDate() + parseInt(formData.prazo));

      // 2. MONTAGEM DOS DADOS (Blindagem de Unidade Escolar)
      const dadosParaCadastro = {
        nome: nomeLimpo,
        email: formData.email,
        password: formData.senha,
        role: formData.role,
        escolaId: "E. M. Anísio Teixeira", // <--- TRAVADO PARA NÃO SALVAR HOSPITAL
        prazo: formData.prazo,
        dataExpiracao: expira.toISOString().split('T')[0],
        modulos: Object.keys(modulos).filter(key => modulos[key]),
        primeiroAcesso: true,
        status: 'ativo',
        statusLicenca: 'ativa',
        createdAt: new Date().toISOString()
      };

      await cadastrarUsuarioService(dadosParaCadastro);

      toast.success(`Acesso liberado: ${nomeLimpo}`, {
        duration: 4000,
        position: 'top-right',
        style: { background: '#1e40af', color: '#fff', borderRadius: '20px' }
      });
      
      setFormData({ ...formData, nome: '', email: '', senha: '' });

    } catch (error) { 
      toast.error("Erro ao cadastrar: " + error.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans animate-in fade-in duration-500">
      <Toaster /> 
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase flex items-center gap-3">
            <Stethoscope size={40} className="text-blue-600" /> Gestão de Acessos
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">Credenciamento de profissionais de saúde</p>
        </div>
        <div className="bg-blue-600/10 px-4 py-2 rounded-2xl border border-blue-200">
           <span className="text-blue-700 text-[10px] font-black uppercase tracking-widest italic">Rodhon System v2.0</span>
        </div>
      </div>

      <form onSubmit={handleCadastro} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 relative overflow-hidden">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-800 uppercase italic">
              <UserPlus className="text-blue-600" size={24} /> Identificação
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Nome Completo</label>
                <input 
                  required 
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300" 
                  placeholder="Ex: Rodrigo Honório" 
                  value={formData.nome} 
                  onChange={e => setFormData({...formData, nome: e.target.value})} 
                />
                <p className="text-[9px] text-slate-400 mt-2 ml-1 font-bold uppercase italic">* Obrigatório nome e sobrenome</p>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Cargo / Função</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-4 text-slate-400" size={18} />
                  <select className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="enfermeiro">Enfermeiro(a)</option>
                    <option value="tecnico_enfermagem">Técnico(a) Enfermagem</option>
                    <option value="medico">Médico(a)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Unidade Escolar</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-4 text-blue-600" size={18} />
                  <input readOnly className="w-full p-4 pl-12 bg-blue-50 text-blue-700 border-none rounded-2xl font-black outline-none cursor-not-allowed"
                    value="E. M. ANÍSIO TEIXEIRA" />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-8 mt-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">E-mail Corporativo</label>
                  <input required type="email" autoComplete="off" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700" 
                    placeholder="acesso@rhodhon.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Senha Provisória</label>
                  <input required type="password" minLength={6} autoComplete="new-password" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700" 
                    placeholder="Mínimo 6 caracteres" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO - ASSINATURA */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-blue-900/30 text-white border border-white/5 relative overflow-hidden">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 italic uppercase relative z-10">
              <ShieldCheck className="text-blue-400" size={24} /> Assinatura
            </h2>

            <div className="mb-6 relative z-10">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Validade do Acesso</label>
              <select className="w-full p-4 bg-slate-800 rounded-2xl border-2 border-slate-700 outline-none font-bold text-sm appearance-none cursor-pointer"
                value={formData.prazo} onChange={e => setFormData({...formData, prazo: e.target.value})}>
                <option value="30">30 dias</option>
                <option value="180">180 dias</option>
                <option value="365">365 dias</option>
              </select>
            </div>

            <div className="space-y-2 mb-8 relative z-10">
              {Object.keys(modulos).map(m => (
                <label key={m} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${modulos[m] ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-800/30 border-transparent'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{m.replace('_', ' ')}</span>
                  <input type="checkbox" className="hidden" checked={modulos[m]} onChange={() => setModulos({...modulos, [m]: !modulos[m]})} />
                  {modulos[m] ? <CheckCircle2 size={16} className="text-blue-400" /> : <div className="w-[16px] h-[16px] rounded-full border border-slate-600" />}
                </label>
              ))}
            </div>

            <button type="submit" disabled={loading} className={`w-full flex items-center justify-center gap-3 py-6 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] transition-all
                ${loading ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/40'}`}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Liberar Acesso'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CadastrarUsuario;