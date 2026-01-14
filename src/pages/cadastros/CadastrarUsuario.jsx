import { useState } from 'react';
import { cadastrarUsuarioService } from '../../services/authService';
import toast, { Toaster } from 'react-hot-toast'; 
import { 
  UserPlus, Building2, Briefcase, CheckCircle2, 
  Loader2, ShieldCheck, Stethoscope, Gem
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

  // MÓDULOS NO FORMATO "MAP" (IGUAL AO SEU FIREBASE)
  const [modulos, setModulos] = useState({
    dashboard: true,
    atendimento: true,
    pasta_digital: true,
    pacientes: true,
    relatorios: false,
    relatorio_geral: false
  });

  const selecionarPlano = (plano) => {
    if (plano === 'basico') {
      setModulos({ dashboard: true, atendimento: true, pasta_digital: true, pacientes: true, relatorios: false, relatorio_geral: false });
    } else if (plano === 'premium') {
      setModulos({ dashboard: true, atendimento: true, pasta_digital: true, pacientes: true, relatorios: true, relatorio_geral: true });
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

      // MONTAGEM DOS DADOS FIEL AO SEU BANCO DE DADOS
      const dadosParaCadastro = {
        nome: nomeLimpo,
        email: formData.email,
        password: formData.senha,
        role: formData.role,
        escolaId: "E. M. Anísio Teixeira",
        
        // Formatos de Data
        dataExpiracao: expira.toISOString(),
        dataCadastro: new Date(), // Gera o Timestamp do Firebase
        createdAt: new Date().toISOString(),

        // Módulos no formato Map (como Maria Conceição)
        modulosSidebar: modulos, 
        
        // Logica de Primeiro Acesso
        primeiroAcesso: true, 
        
        // Status em dobro para compatibilidade
        status: 'ativo',
        statusLicenca: 'ativa',
        licencaStatus: 'ativa'
      };

      await cadastrarUsuarioService(dadosParaCadastro);

      toast.success(`Acesso liberado: ${nomeLimpo}`, {
        duration: 4000,
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
          <p className="text-slate-500 font-medium tracking-tight">O usuário deverá trocar a senha no primeiro login.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => selecionarPlano('basico')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all border border-slate-200">Plano Básico</button>
          <button type="button" onClick={() => selecionarPlano('premium')} className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-amber-100 transition-all"><Gem size={12}/> Plano Premium</button>
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
                <input required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-700" 
                  placeholder="Ex: Rodrigo Honório" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Unidade</label>
                <input readOnly className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-black outline-none border-none" value="E. M. ANÍSIO TEIXEIRA" />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-8 mt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail</label>
                  <input required type="email" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="usuario@gmail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Senha Inicial</label>
                  <input required type="password" minLength={6} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Senha provisória" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white border border-white/5">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 italic uppercase text-blue-400">
              <ShieldCheck size={24} /> Módulos Sidebar
            </h2>

            <div className="mb-6">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Validade</label>
              <select className="w-full p-4 bg-slate-800 rounded-2xl border-2 border-slate-700 outline-none font-bold text-sm"
                value={formData.prazo} onChange={e => setFormData({...formData, prazo: e.target.value})}>
                <option value="30">30 dias</option>
                <option value="90">90 dias</option>
                <option value="365">365 dias</option>
              </select>
            </div>

            <div className="space-y-2 mb-8">
              {Object.keys(modulos).map(m => (
                <label key={m} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${modulos[m] ? 'bg-blue-600/10 border-blue-500/50 text-white' : 'bg-slate-800/30 border-transparent text-slate-500'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{m.replace('_', ' ')}</span>
                  <input type="checkbox" className="hidden" checked={modulos[m]} onChange={() => setModulos({...modulos, [m]: !modulos[m]})} />
                  {modulos[m] ? <CheckCircle2 size={16} className="text-blue-400" /> : <div className="w-[16px] h-[16px] rounded-full border border-slate-600" />}
                </label>
              ))}
            </div>

            <button type="submit" disabled={loading} className={`w-full py-6 rounded-[24px] font-black uppercase text-[11px] tracking-widest transition-all ${loading ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/40'}`}>
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Liberar Credenciais'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CadastrarUsuario;