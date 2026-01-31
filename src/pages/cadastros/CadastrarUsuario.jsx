import { useState } from 'react';
import { cadastrarUsuarioService } from '../../services/authService';
import { db } from '../../firebase/firebaseConfig'; 
import { Timestamp } from 'firebase/firestore'; 
import toast, { Toaster } from 'react-hot-toast'; 
import { 
  UserPlus, CheckCircle2, 
  Loader2, ShieldCheck, Stethoscope, Gem, Hash, Lock, Calendar, UserCog
} from 'lucide-react';

const CadastrarUsuario = () => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '', 
    email: '', 
    senha: '', 
    role: 'enfermeiro', 
    prazo: '365', 
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
      const dataHoje = new Date();
      const dataExpira = new Date();
      dataExpira.setDate(dataHoje.getDate() + parseInt(formData.prazo));

      const dadosParaCadastro = {
        nome: nomeLimpo.toLowerCase(), // Normalizando para lowercase conforme solicitado
        email: formData.email.trim().toLowerCase(),
        password: formData.senha,
        role: formData.role,
        registroProfissional: formData.registroProfissional.toUpperCase() || "N/A",
        escolaId: "E. M. Anísio Teixeira",
        dataExpiracao: Timestamp.fromDate(dataExpira), 
        dataCadastro: Timestamp.fromDate(dataHoje),
        createdAt: dataHoje.toISOString(),
        modulosSidebar: modulos, 
        primeiroAcesso: true, 
        status: 'ativo',
        statusLicenca: 'ativa',
        licencaStatus: 'ativa'
      };

      await cadastrarUsuarioService(dadosParaCadastro);
      
      toast.success(`Acesso liberado: ${nomeLimpo.toUpperCase()}`, {
        style: { background: '#0f172a', color: '#fff', fontWeight: 'bold' }
      });

      setFormData({ ...formData, nome: '', email: '', senha: '', registroProfissional: '', prazo: '365' });

    } catch (error) { 
      toast.error("ERRO NO CADASTRO: " + error.message.toUpperCase()); 
    } finally {
      setLoading(false);
    }
  };

  // Verifica se o cargo exige registro profissional obrigatório
  const isHealthRole = ['enfermeiro', 'tecnico_enfermagem', 'medico'].includes(formData.role);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans animate-in fade-in duration-500">
      <Toaster position="top-right" /> 
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase flex items-center gap-3">
            <UserCog size={40} className="text-blue-600" /> Gestão de Acessos
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Controle de Licenças e Módulos Profissionais</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => selecionarPlano('basico')} className="px-5 py-2.5 bg-white text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 border border-slate-200 shadow-sm transition-all">Plano Básico</button>
          <button type="button" onClick={() => selecionarPlano('premium')} className="px-5 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-amber-100 shadow-sm transition-all"><Gem size={14}/> Plano Premium</button>
        </div>
      </div>

      <form onSubmit={handleCadastro} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[45px] shadow-sm border border-slate-100">
            <h2 className="text-xl font-black mb-10 flex items-center gap-3 text-slate-800 uppercase italic">
              <UserPlus className="text-blue-600" size={24} /> Identificação do Usuário
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Nome Completo</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all" 
                  placeholder="Ex: Marcelo Silva" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Função / Cargo</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 cursor-pointer transition-all"
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <optgroup label="Saúde">
                    <option value="enfermeiro">Enfermeiro(a)</option>
                    <option value="tecnico_enfermagem">Técnico(a) Enfermagem</option>
                    <option value="medico">Médico(a)</option>
                  </optgroup>
                  <optgroup label="Administrativo">
                    <option value="diretora">Diretora</option>
                    <option value="diretor">Diretor</option>
                    <option value="administrativo">Administrativo</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                  {isHealthRole ? "Registro (COREN/CRM)" : "Identificação (Opcional)"}
                </label>
                <div className="relative">
                  <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required={isHealthRole} className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 uppercase transition-all" 
                    placeholder={isHealthRole ? "000000-UF" : "MATRÍCULA OU RG"} value={formData.registroProfissional} onChange={e => setFormData({...formData, registroProfissional: e.target.value})} />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 pt-10 mt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4">E-mail de Acesso</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input required type="email" className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-bold border-none text-slate-700 focus:ring-2 ring-blue-500/20" placeholder="usuario@sistema.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Senha Temporária</label>
                  <input required type="password" minLength={6} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-slate-700 focus:ring-2 ring-blue-500/20" placeholder="******" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-10 rounded-[45px] shadow-2xl text-white border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
            
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 italic uppercase text-blue-400 relative z-10">
              <ShieldCheck size={24} /> Configurações
            </h2>

            <div className="mb-8 relative z-10">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 mb-3 block flex items-center gap-2">
                <Calendar size={14} /> Validade da Licença
              </label>
              <select className="w-full p-5 bg-slate-800/50 rounded-[24px] border-2 border-slate-700 outline-none font-bold text-sm text-white cursor-pointer hover:border-blue-500 transition-all"
                value={formData.prazo} onChange={e => setFormData({...formData, prazo: e.target.value})}>
                <option value="30">30 dias (Mensal)</option>
                <option value="90">90 dias (Trimestral)</option>
                <option value="180">180 dias (Semestral)</option>
                <option value="365">365 dias (Anual)</option>
              </select>
            </div>

            <div className="space-y-3 mb-10 relative z-10">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 mb-2">Módulos Habilitados</p>
              {Object.keys(modulos).map(m => (
                <label key={m} className={`flex items-center justify-between p-4 rounded-[22px] cursor-pointer transition-all border ${modulos[m] ? 'bg-blue-600/20 border-blue-500/40 text-white' : 'bg-slate-800/20 border-transparent text-slate-600'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest">{moduloLabels[m]}</span>
                  </div>
                  <input type="checkbox" className="hidden" checked={modulos[m]} onChange={() => setModulos({...modulos, [m]: !modulos[m]})} />
                  {modulos[m] ? <CheckCircle2 size={18} className="text-blue-400" /> : <Lock size={14} className="text-slate-700" />}
                </label>
              ))}
            </div>

            <button type="submit" disabled={loading} className={`w-full py-6 rounded-[28px] font-black uppercase text-[11px] tracking-widest transition-all relative z-10 ${loading ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-600/30 hover:-translate-y-1'}`}>
              {loading ? <Loader2 className="animate-spin mx-auto" size={22} /> : 'Ativar Acesso'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CadastrarUsuario;