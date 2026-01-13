import React from 'react';
import { 
  Printer, FileText, User, Clock, Stethoscope, 
  MapPin, AlertCircle, ChevronLeft 
} from 'lucide-react';

const RelatorioAtendimento = ({ atendimento, onVoltar }) => {
  // Função para imprimir a página
  const handlePrint = () => {
    window.print();
  };

  if (!atendimento) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:p-0">
      {/* BARRA DE AÇÕES - ESCONDE NA IMPRESSÃO */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 print:hidden">
        <button 
          onClick={onVoltar}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors font-bold text-xs uppercase"
        >
          <ChevronLeft size={16} /> Voltar
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Printer size={16} /> Imprimir BAM
        </button>
      </div>

      {/* FICHA DO RELATÓRIO */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
        
        {/* CABEÇALHO DO RELATÓRIO */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl">
              <Stethoscope size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter">
                Boletim de Atendimento <span className="text-blue-500">Medsys</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Registro Oficial de Enfermagem</p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-black text-blue-400 uppercase">Nº Protocolo</span>
            <span className="text-lg font-mono font-bold">{atendimento.id?.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>

        <div className="p-10 space-y-10">
          
          {/* SEÇÃO 1: IDENTIFICAÇÃO */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
              <User size={18} className="text-blue-600" />
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Identificação do Paciente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase">Nome Completo</label>
                <p className="font-bold text-slate-700 uppercase italic">{atendimento.pacienteNome}</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase">Unidade Escolar</label>
                <p className="font-bold text-slate-700 uppercase">{atendimento.escolaId}</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase">Data e Hora</label>
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Clock size={14} className="text-slate-300" />
                  {atendimento.dataHora}
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: AVALIAÇÃO CLÍNICA */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
              <AlertCircle size={18} className="text-blue-600" />
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Avaliação e Sintomas</h3>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
              "{atendimento.queixaPrincipal || "Nenhuma queixa registada."}"
            </div>
          </section>

          {/* SEÇÃO 3: CONDUTA E ENCAMINHAMENTO */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Procedimentos</h3>
              </div>
              <p className="text-sm text-slate-600 font-medium">{atendimento.procedimentos || "Cuidados básicos de enfermagem."}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                <MapPin size={18} className="text-blue-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Encaminhamento</h3>
              </div>
              <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-black text-[10px] uppercase">
                {atendimento.destino || "Alta na Unidade"}
              </div>
            </div>
          </section>

          {/* SEÇÃO 4: ASSINATURA */}
          <section className="pt-10 mt-10 border-t border-slate-100">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-64 border-b border-slate-300 h-10"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {atendimento.enfermeiroNome}
              </p>
              <p className="text-[9px] text-blue-500 font-bold italic uppercase">Enfermeiro(a) Responsável</p>
            </div>
          </section>
        </div>

        {/* FOOTER DO RELATÓRIO */}
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            Documento gerado eletronicamente pelo Rodhon MedSys em {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RelatorioAtendimento;