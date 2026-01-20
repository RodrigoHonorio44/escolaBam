import React from 'react';
import { 
  X, Thermometer, Activity, MapPin, Clock, 
  Stethoscope, Building2, User, UserCheck, 
  ShieldAlert, ClipboardList 
} from 'lucide-react';

const ModalDetalhesDigital = ({ atendimento, onClose }) => {
  if (!atendimento) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-end bg-slate-900/80 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-3xl h-[95vh] rounded-[45px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
        
        {/* HEADER */}
        <div className="p-10 bg-slate-900 text-white flex justify-between items-start relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Documento BAM</span>
              <span className="text-[9px] font-black text-slate-400 uppercase">
                {atendimento.dataAtendimento} às {atendimento.horario}
              </span>
            </div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
              {atendimento.baenf || 'S/N'}
            </h3>
            <p className="text-blue-400 text-xs font-black uppercase italic mt-2 flex items-center gap-1">
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
          
          {/* GRID DE SINAIS VITAIS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VitalCard icon={<Thermometer size={18} className="text-rose-500"/>} label="TEMPERATURA" value={`${atendimento.temperatura || '--'}°C`} />
            <VitalCard icon={<Activity size={18} className="text-blue-500"/>} label="PRESSÃO" value={atendimento.pressaoArterial || '--'} />
            <VitalCard icon={<MapPin size={18} className="text-green-500"/>} label="DESTINO" value={atendimento.destinoHospital || 'Escola'} />
            <VitalCard icon={<Clock size={18} className="text-orange-500"/>} label="DURAÇÃO" value={atendimento.tempoAtendimento || '--'} />
          </div>

          {/* CONTEÚDO TÉCNICO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailSection title="Avaliação Clínica">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Motivo / Queixa Principal</p>
                  <p className="text-sm font-black text-slate-900 uppercase italic leading-tight">{atendimento.motivoAtendimento}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Evolução de Enfermagem</p>
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
                    {atendimento.procedimentos || "Procedimentos de rotina."}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Medicações Administradas</p>
                  <div className="p-5 bg-white rounded-3xl border border-slate-200 text-[11px] text-slate-800 font-black uppercase italic">
                    {atendimento.medicacao || "Nenhuma medicação informada."}
                  </div>
                </div>
              </div>
            </DetailSection>
          </div>

          {/* DESFECHO E RESPONSÁVEIS */}
          <div className="bg-white rounded-[35px] border border-slate-200 p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Stethoscope size={12}/> Profissional</p>
                <p className="text-xs font-black text-slate-900 uppercase italic">{atendimento.profissionalNome || 'Não Identificado'}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-0.5">Coren: {atendimento.profissionalCoren || '---'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Building2 size={12}/> Unidade</p>
                <p className="text-xs font-black text-slate-900 uppercase italic">{atendimento.escola}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><User size={12}/> Responsável Avisado?</p>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${atendimento.avisadoResponsavel === 'sim' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {atendimento.avisadoResponsavel === 'sim' ? 'SIM, CIENTE' : 'NÃO INFORMADO'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-componentes internos para o modal
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