import { useState } from 'react';
import { cadastrarUsuarioService } from '../../services/authService';
import toast, { Toaster } from 'react-hot-toast'; 
import { 
  UserPlus, CheckCircle2, 
  Loader2, ShieldCheck, Stethoscope, Gem, Hash, Lock, Calendar
} from 'lucide-react';

const CadastrarUsuario = () => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '', 
    email: '', 
    senha: '', 
    role: 'enfermeiro', 
    prazo: '365', // Valor padrão: 1 ano
    registroProfissional: ''
  });

  const [modulos, setModulos] = useState({
    dashboard: true,       
    atendimento: true,     
    pasta_digital: true,   
    pacientes: true,       
    relatorios: true,      
    dashboard_admin: false 
  });

  const moduloLabels = {
    dashboard: "Dashboard",
    atendimento: "Atendimento",
    pasta_digital: "Pasta Digital",
    pacientes: "Cadastros (Alunos/Ficha)",
    relatorios: "BAENF Antigos",
    dashboard_admin: "Relatório Geral"
  };

  const selecionarPlano = (plano) => {
    if (plano === 'basico') {
      setModulos({ 
        dashboard: true, atendimento: true, pasta_digital: true, 
        pacientes: true, relatorios: false, dashboard_admin: false 
      });
    } else if (plano === 'premium') {
      setModulos({ 
        dashboard: true, atendimento: true, pasta_digital: true, 
        pacientes: true, relatorios: true, dashboard_admin: true 
      });
    }
    toast(`Configuração ${plano} aplicada`, { icon: '⚙️' });
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    const nomeLimpo = formData.nome.trim();
    if (nomeLimpo.split(/\s+/).length < 2) {
      toast.error("Por favor, insira o nome e pelo menos um sobrenome.");
      return;
    }

    setLoading(true);
    try {
      const expira = new Date();
      expira.setDate(expira.getDate() + parseInt(formData.prazo));

      const dadosParaCadastro = {
        nome: nomeLimpo,
        email: formData.email,
        password: formData.senha,
        role: formData.role,
        registroProfissional: formData.registroProfissional.toUpperCase(),
        escolaId: "E. M. Anísio Teixeira",
        dataExpiracao: expira.toISOString(),
        dataCadastro: new Date(), 
        createdAt: new Date().toISOString(),
        modulosSidebar: modulos, 
        primeiroAcesso: true, 
        status: 'ativo',
        statusLicenca: 'ativa',
        licencaStatus: 'ativa'
      };

      await cadastrarUsuarioService(dadosParaCadastro);
      toast.success(`Acesso liberado: ${nomeLimpo}`);
      setFormData({ ...formData, nome: '', email: '', senha: '', registroProfissional: '', prazo: '365' });

    } catch (error) { 
      toast.error("Erro: " + error.message); 
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
          <p className="text-slate-500 font-medium tracking-tight">Vincule os módulos e defina o tempo de licença.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => selecionarPlano('basico')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 border border-slate-200 transition-all">Plano Básico</button>
          <button type="button" onClick={() => selecionarPlano('premium')} className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-amber-100 transition-all"><Gem size={12}/> Plano Premium</button>
        </div>
      </div>

      <form onSubmit={handleCadastro} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-800 uppercase italic">
              <UserPlus className="text-blue-600" size={24} /> Identificação Profissional
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Nome Completo</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700" 
                  placeholder="Nome do Profissional" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Cargo</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700 cursor-pointer"
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="enfermeiro">Enfermeiro(a)</option>
                  <option value="tecnico_enfermagem">Técnico(a) Enfermagem</option>
                  <option value="medico">Médico(a)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Registro Profissional (COREN/CRM)</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700 uppercase" 
                    placeholder="000000-UF" value={formData.registroProfissional} onChange={e => setFormData({...formData, registroProfissional: e.target.value})} />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-8 mt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail de Login</label>
                  <input required type="email" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-slate-700" placeholder="email@baenf.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Senha Inicial</label>
                  <input required type="password" minLength={6} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-slate-700" placeholder="******" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white border border-white/5">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 italic uppercase text-blue-400">
              <ShieldCheck size={24} /> Acesso Sidebar
            </h2>

            {/* ✅ SELETOR DE PRAZO ATUALIZADO: 30, 90, 180, 365 */}
            <div className="mb-6">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block flex items-center gap-2">
                <Calendar size={12} /> Período da Licença
              </label>
              <select className="w-full p-4 bg-slate-800 rounded-2xl border-2 border-slate-700 outline-none font-bold text-sm text-white cursor-pointer hover:border-blue-500 transition-colors"
                value={formData.prazo} onChange={e => setFormData({...formData, prazo: e.target.value})}>
                <option value="30">30 dias (Mensal)</option>
                <option value="90">90 dias (Trimestral)</option>
                <option value="180">180 dias (Semestral)</option>
                <option value="365">365 dias (Anual)</option>
              </select>
            </div>

            <div className="space-y-2 mb-8">
              {Object.keys(modulos).map(m => (
                <label key={m} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${modulos[m] ? 'bg-blue-600/10 border-blue-500/50 text-white' : 'bg-slate-800/30 border-transparent text-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    {!modulos[m] && <Lock size={12} className="text-slate-600" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{moduloLabels[m]}</span>
                  </div>
                  <input type="checkbox" className="hidden" checked={modulos[m]} onChange={() => setModulos({...modulos, [m]: !modulos[m]})} />
                  {modulos[m] ? <CheckCircle2 size={16} className="text-blue-400" /> : <div className="w-[16px] h-[16px] rounded-full border border-slate-600" />}
                </label>
              ))}
            </div>

            <button type="submit" disabled={loading} className={`w-full py-6 rounded-[24px] font-black uppercase text-[11px] tracking-widest transition-all ${loading ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/40'}`}>
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Liberar Acesso Profissional'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CadastrarUsuario;