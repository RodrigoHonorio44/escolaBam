import React from 'react';
import { 
  X, Thermometer, Activity, MapPin, Clock, 
  Stethoscope, Building2, User, UserCheck, 
  AlertTriangle, HeartPulse
} from 'lucide-react';

const ModalDetalhesDigital = ({ atendimento, onClose }) => {
  if (!atendimento) return null;

  // LÓGICA DE LEITURA R S
  const queixaDisplay = atendimento.motivoAtendimento || "NÃO INFORMADA";
  const horarioDisplay = atendimento.horario || "--:--";
  
  // Identificação do Profissional
  const profissionalNome = atendimento.profissionalResponsavel || 'NÃO IDENTIFICADO';
  const profissionalRegistro = atendimento.registroProfissional || "S/I";
  
  // --- R S: LÓGICA DE CARGO CORRIGIDA ---
  const profissionalCargo = atendimento.profissionalCargo || (
    atendimento.role === 'tecnico_enfermagem' ? 'técnico de enfermagem' : 
    atendimento.role === 'enfermeiro' ? 'enfermeiro(a)' : 
    atendimento.role || "profissional"
  );
  
  // Verifica se está em aberto
  const statusTexto = (atendimento.statusAtendimento || "").toLowerCase();
  const estaAberto = statusTexto.includes("aberto") || statusTexto.includes("aguardando") || statusTexto.includes("pendente");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-end bg-slate-900/80 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-3xl h-[95vh] rounded-[45px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
        
        {/* HEADER */}
        <div className={`p-10 text-white flex justify-between items-start relative overflow-hidden transition-colors ${estaAberto ? 'bg-orange-600' : 'bg-slate-900'}`}>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className={`${estaAberto ? 'bg-orange-800' : 'bg-blue-600'} text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter`}>
                {estaAberto ? 'ATENDIMENTO PENDENTE' : 'DOCUMENTO BAM'}
              </span>
              <span className="text-[9px] font-black text-white/60 uppercase">
                {atendimento.data} às {horarioDisplay}
              </span>
            </div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
              {atendimento.baenf || 'S/N'}
            </h3>
            <p className="text-white/80 text-xs font-black uppercase italic mt-2 flex items-center gap-1">
              <UserCheck size={14}/> {atendimento.nomePaciente}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="relative z-10 p-3 bg-white/10 hover:bg-rose-600 rounded-2xl transition-all shadow-lg"
          >
            <X size={24}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30">
          
          {/* AVISO DE STATUS PENDENTE/ABERTO */}
          {estaAberto && (
            <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-[30px] flex items-center gap-4 animate-pulse">
              <AlertTriangle className="text-orange-600" size={32} />
              <div>
                <p className="text-orange-900 font-black uppercase italic text-sm leading-none">Aguardando Desfecho</p>
                <p className="text-orange-700 text-[10px] font-bold uppercase mt-1">Este atendimento ainda não foi finalizado r s.</p>
              </div>
            </div>
          )}

          {/* GRID DE SINAIS VITAIS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VitalCard icon={<Thermometer size={18} className="text-rose-500"/>} label="TEMPERATURA" value={`${atendimento.temperatura || '--'}°C`} />
            <VitalCard icon={<Activity size={18} className="text-blue-500"/>} label="P.A." value={atendimento.pa || 'N/A'} />
            <VitalCard icon={<HeartPulse size={18} className="text-emerald-500"/>} label="HGT" value={atendimento.hgt || 'N/A'} />
            <VitalCard icon={<Clock size={18} className="text-orange-500"/>} label="SAÍDA" value={atendimento.horarioSaida || '--'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailSection title="Avaliação Clínica">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Motivo do Atendimento</p>
                  <p className="text-sm font-black text-slate-900 uppercase italic leading-tight">{queixaDisplay}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Evolução / Observações</p>
                  <div className="p-5 bg-white rounded-3xl text-[11px] text-slate-600 font-bold uppercase leading-relaxed border border-slate-200 shadow-sm min-h-[100px]">
                    {atendimento.observacoes || "Nenhuma observação registrada."}
                  </div>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Conduta e Tratamento">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Procedimentos Realizados</p>
                  <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 text-[11px] text-blue-900 font-black uppercase italic min-h-[80px]">
                    {atendimento.procedimentos || "Nenhum procedimento registrado."}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Destino Pós-Atendimento</p>
                  <div className="p-5 bg-white rounded-3xl border border-slate-200 text-[11px] text-slate-800 font-black uppercase italic">
                    {atendimento.destinoHospital || "Escola / Sala de Aula"}
                  </div>
                </div>
              </div>
            </DetailSection>
          </div>

          {/* RODAPÉ COM PROFISSIONAL + CARGO R S */}
          <div className="bg-white rounded-[35px] border border-slate-200 p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Stethoscope size={12}/> Profissional Responsável</p>
                <p className="text-xs font-black text-slate-900 uppercase italic">
                  {profissionalNome}
                </p>
                {/* EXIBIÇÃO DO CARGO R S */}
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter leading-none mt-1">
                  {profissionalCargo}
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                  Registro: {profissionalRegistro}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Building2 size={12}/> Unidade</p>
                <p className="text-xs font-black text-slate-900 uppercase italic">{atendimento.escola || 'CEPT'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><User size={12}/> Status</p>
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full ${estaAberto ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {atendimento.statusAtendimento?.toUpperCase() || 'FINALIZADO'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-componentes
const VitalCard = ({ icon, label, value }) => (
  <div className="bg-white p-4 rounded-3xl flex flex-col items-center gap-2 border border-slate-200 shadow-sm text-center">
    <div className="p-2 bg-slate-50 rounded-xl shadow-inner">{icon}</div>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
    <p className="text-[12px] font-black text-slate-900 uppercase italic leading-none">{value}</p>
  </div>
);

const DetailSection = ({ title, children }) => (
  <div className="bg-white rounded-[35px] border border-slate-200 p-8 shadow-sm h-full flex flex-col">
    <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest mb-6">
      <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div> {title}
    </h4>
    {children}
  </div>
);

export default ModalDetalhesDigital;