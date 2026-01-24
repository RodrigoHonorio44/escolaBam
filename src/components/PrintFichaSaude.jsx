import React from 'react';
import { Printer, ArrowLeft, CheckSquare, Square } from 'lucide-react';

const PrintFichaSaude = ({ data, onVoltar }) => {
  const handlePrint = () => {
    window.print();
  };

  // Formata nomes para exibição visual (Capitalize)
  const formatarDisplay = (texto) => {
    if (!texto) return "";
    return texto.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  };

  const CheckBox = ({ label, value }) => (
    <div className="flex items-center gap-2 mb-1">
      {value ? <CheckSquare size={14} /> : <Square size={14} />}
      <span className={value ? "font-bold" : "text-slate-500"}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 print:bg-white print:p-0">
      
      {/* BARRA DE FERRAMENTAS */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button 
          onClick={onVoltar}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black uppercase text-xs transition-all"
        >
          <ArrowLeft size={18} /> Voltar ao Histórico
        </button>
        <button 
          onClick={handlePrint}
          className="bg-slate-900 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-sm flex items-center gap-3 shadow-xl"
        >
          <Printer size={20} /> Imprimir Prontuário
        </button>
      </div>

      {/* FOLHA A4 */}
      <div className="max-w-[210mm] mx-auto bg-white p-[15mm] shadow-2xl print:shadow-none print:p-0 border border-slate-200 print:border-none">
        
        {/* CABEÇALHO OFICIAL */}
        <div className="flex flex-col items-center text-center border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between w-full items-center mb-2">
            <img src="/brasao_marica.png" alt="Prefeitura de Maricá" className="h-20 w-auto object-contain" />
            
            <div className="flex-1 px-4">
              <h1 className="text-[16px] font-bold text-slate-900 leading-tight">PREFEITURA MUNICIPAL DE MARICÁ</h1>
              <h2 className="text-[14px] font-bold text-slate-900 leading-tight">SECRETARIA MUNICIPAL DE EDUCAÇÃO</h2>
              <h3 className="text-[15px] font-black text-slate-900 leading-tight uppercase italic tracking-tighter">
                {data.escola?.toUpperCase() || 'E.M. ANÍSIO SPÍNOLA TEIXEIRA'}
              </h3>
            </div>

            <img src="/logo_cept.png" alt="Logo CEPT" className="h-20 w-auto object-contain" />
          </div>
          <p className="text-[8px] uppercase font-bold text-slate-500">Documento Interno de Acompanhamento em Enfermagem Escolar</p>
        </div>

        {/* TÍTULO */}
        <div className="text-center mb-6">
          <h2 className="text-[18px] font-black uppercase underline decoration-2 underline-offset-8">
            Boletim de Atendimento Móvel (BAM) - 2026
          </h2>
        </div>

        {/* IDENTIFICAÇÃO DO PACIENTE */}
        <div className="space-y-6 text-[12px]">
          <section className="grid grid-cols-3 gap-4 border-b-2 border-slate-100 pb-4">
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Paciente</p>
              <p className="text-sm font-black uppercase border-b border-slate-200 pb-1">
                {formatarDisplay(data.nomePaciente || data.nomeAluno)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Perfil</p>
              <p className="text-sm font-black uppercase">{data.perfilPaciente || 'aluno'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Data/Hora Entrada</p>
              <p className="font-bold tabular-nums">{data.data} às {data.horario}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Turma/Setor</p>
              <p className="font-bold uppercase">{data.turma || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Tipo Registro</p>
              <p className="font-bold uppercase text-blue-600">{data.tipoRegistro || 'local'}</p>
            </div>
          </section>

          {/* RELATO DA OCORRÊNCIA */}
          <section>
            <h4 className="font-black bg-slate-900 text-white px-3 py-1 mb-3 uppercase italic text-[11px] skew-x-[-10deg] inline-block">
              Relato da Ocorrência / Queixa Principal
            </h4>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 italic min-h-[60px]">
              {data.relatoOcorrencia || data.motivoAtendimento || 'Não informado.'}
            </div>
          </section>

          {/* SINAIS VITAIS E AVALIAÇÃO */}
          <section className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold border-b border-black mb-2 uppercase text-[11px]">Sinais Vitais</h4>
              <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                <p><strong>PA:</strong> {data.pa || '___ x ___'} mmHg</p>
                <p><strong>SPO2:</strong> {data.spo2 || '___'} %</p>
                <p><strong>TEMP:</strong> {data.temperatura || '___'} °C</p>
                <p><strong>FREQ. CARD:</strong> {data.fc || '___'} bpm</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold border-b border-black mb-2 uppercase text-[11px]">Alergias Detectadas</h4>
              <div className="p-2 border border-rose-100 bg-rose-50/30 rounded text-rose-700 font-bold uppercase text-[10px]">
                {data.qualAlergia || data.alergias || 'Nenhuma informada'}
              </div>
            </div>
          </section>

          {/* CONDUTA E EVOLUÇÃO (ALTA) */}
          <section className="mt-4">
            <h4 className="font-black bg-blue-600 text-white px-3 py-1 mb-3 uppercase italic text-[11px] skew-x-[-10deg] inline-block">
              Evolução Clínica e Alta
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border-2 border-slate-100 rounded-xl">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Procedimentos Realizados</p>
                  <p className="text-[11px] uppercase">{data.condutaHospitalar || 'Em aberto'}</p>
                </div>
                <div className="p-3 border-2 border-slate-100 rounded-xl">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Observações de Repouso</p>
                  <p className="text-[11px] uppercase">{data.observacoesFinais || 'Nenhuma'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ASSINATURAS */}
          <section className="mt-16 flex justify-between items-start gap-10">
            <div className="text-center flex-1">
              <div className="border-t border-black pt-2">
                <p className="text-[10px] font-black uppercase">{formatarDisplay(data.responsavel || 'Responsável')}</p>
                <p className="text-[8px] text-slate-500 uppercase">Ciente da Ocorrência</p>
              </div>
            </div>

            <div className="text-center flex-1">
              <div className="border-t-2 border-blue-600 pt-2">
                <p className="text-[11px] font-black uppercase text-blue-900">
                  {formatarDisplay(data.finalizadoPor || data.profissionalNome)}
                </p>
                <p className="text-[9px] font-bold text-blue-600 uppercase">
                  Enfermeiro(a) • Registro: {data.registroFinalizador || data.profissionalRegistro}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* RODAPÉ */}
        <footer className="mt-12 pt-4 border-t border-slate-200 text-[8px] flex justify-between text-slate-400 font-bold uppercase tracking-widest">
          <span>RODHON INTELLIGENCE — SISTEMA DE GESTÃO CLÍNICA</span>
          <span>AUTENTICAÇÃO: {data.id?.toUpperCase()}</span>
          <span>DATA IMPRESSÃO: {new Date().toLocaleDateString()}</span>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 10mm; size: portrait; }
          body { background: white !important; margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .shadow-2xl { shadow: none !important; }
        }
      `}} />
    </div>
  );
};

export default PrintFichaSaude;