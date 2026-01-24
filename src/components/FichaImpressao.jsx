import React from 'react';
import { Printer, ArrowLeft, ShieldAlert, Hospital } from 'lucide-react';

const FichaImpressao = ({ dados, onVoltar }) => {
  const imprimir = () => {
    window.print();
  };

  if (!dados) return null;

  // --- LÓGICA DE FORMATAÇÃO (CAPITALIZE PARA O PRINT) ---
  const formatarParaExibicao = (texto) => {
    if (!texto) return "---";
    // Ignora siglas pequenas como "PA", "FC", "HGT"
    if (texto.length <= 3) return texto.toUpperCase();
    return texto.toString().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  };

  // 1. MAPEAMENTO RESILIENTE DE CAMPOS
  const temperaturaExibida = dados.temperatura || dados.temp || (dados.triagem && dados.triagem.temperatura);
  const paExibida = dados.pressaoArterial || dados.pa || (dados.triagem && dados.triagem.pa);
  const fcExibida = dados.frequenciaCardiaca || dados.fc || (dados.triagem && dados.triagem.fc);
  const satExibida = dados.saturacao || dados.sato2 || (dados.triagem && dados.triagem.saturacao);
  const hgtExibido = dados.hgt || (dados.triagem && dados.triagem.hgt);
  
  const turmaExibida = dados.turma || dados.turmaPaciente || dados.serie || dados.cargo;
  const statusAtual = (dados.statusAtendimento || 'aberto').toLowerCase();
  const foiHospital = dados.encaminhadoHospital?.toString().toLowerCase().trim() === 'sim' || 
                     dados.tipoRegistro?.toLowerCase() === 'remoção' || 
                     statusAtual.includes("remoção");

  // --- LÓGICA DE ALERGIA ---
  const detalheAlergia = dados.qualAlergia || dados.alergias || "";
  const temAlergia = (dados.alunoPossuiAlergia === 'Sim' || detalheAlergia.length > 2) && 
                     !["não", "nao", "nenhuma", "n", "ñ"].includes(detalheAlergia.toLowerCase().trim());

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
            border: none !important;
            box-shadow: none !important;
            background-color: white !important;
          }
          @page { margin: 0; size: auto; }
          .print-hidden { display: none !important; }
        }
      `}} />

      {/* BARRA DE FERRAMENTAS */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print-hidden">
        <button onClick={onVoltar} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors uppercase text-xs">
          <ArrowLeft size={18} /> Voltar ao Prontuário
        </button>
        <button onClick={imprimir} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all uppercase text-sm italic">
          <Printer size={18} /> Imprimir Documento
        </button>
      </div>

      {/* FOLHA DO DOCUMENTO */}
      <div className="print-area max-w-4xl mx-auto bg-white shadow-2xl p-10 md:p-16 border border-slate-200 rounded-sm min-h-[297mm] flex flex-col">
        
        {/* ALERTA CRÍTICO */}
        {temAlergia && (
          <div className="mb-6 bg-rose-700 text-white p-4 rounded-lg flex items-center gap-4 border-2 border-rose-900" style={{ WebkitPrintColorAdjust: 'exact' }}>
            <ShieldAlert size={30} className="shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Restrição Alérgica Detectada</p>
              <p className="text-lg font-black uppercase leading-tight">
                {detalheAlergia.toUpperCase()}
              </p>
            </div>
          </div>
        )}

        {/* CABEÇALHO */}
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-tight">Boletim de Atendimento<br/>Enfermagem Escolar</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">{dados.escola?.toUpperCase() || "E.M. ANÍSIO SPÍNOLA TEIXEIRA"}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase">Autenticação do Sistema</p>
            <p className="text-lg font-black text-blue-600 italic">#{dados.id?.substring(0,8).toUpperCase() || 'DRAFT'}</p>
          </div>
        </div>

        {/* 1. IDENTIFICAÇÃO */}
        <div className="mb-4 text-[10px] font-black uppercase bg-slate-900 text-white px-3 py-1 inline-block">1. Identificação do Paciente</div>
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="col-span-2 border-b border-slate-100 pb-1">
            <label className="text-[8px] font-black text-slate-400 uppercase block">Nome Completo</label>
            <p className="font-bold text-slate-900 uppercase text-base">{formatarParaExibicao(dados.nomePaciente || dados.pacienteNome)}</p>
          </div>
          <div className="border-b border-slate-100 pb-1">
            <label className="text-[8px] font-black text-slate-400 uppercase block">Turma/Vínculo</label>
            <p className="font-bold text-slate-900 uppercase">{turmaExibida?.toUpperCase() || '---'}</p>
          </div>
          <div className="border-b border-slate-100 pb-1">
            <label className="text-[8px] font-black text-slate-400 uppercase block">Data/Hora</label>
            <p className="font-bold text-slate-900 tabular-nums">{dados.data} • {dados.horario}</p>
          </div>
        </div>

        {/* 2. SINAIS VITAIS */}
        <div className="mb-4 text-[10px] font-black uppercase bg-slate-900 text-white px-3 py-1 inline-block">2. Triagem de Sinais Vitais</div>
        <div className="grid grid-cols-5 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100" style={{ WebkitPrintColorAdjust: 'exact' }}>
          {[{l: 'Temp', v: temperaturaExibida, u: '°C'}, {l: 'P.A.', v: paExibida}, {l: 'F.C.', v: fcExibida, u: 'bpm'}, {l: 'SatO2', v: satExibida, u: '%'}, {l: 'HGT', v: hgtExibido, u: 'mg/dL'}].map((item, i) => (
            <div key={i}>
              <label className="text-[8px] font-black text-slate-500 uppercase block">{item.l}</label>
              <p className="font-black text-slate-900 text-sm">{item.v ? `${item.v}${item.u || ''}` : '---'}</p>
            </div>
          ))}
        </div>

        {/* 3. EVOLUÇÃO */}
        <div className="space-y-6 mb-8 flex-1">
          <div>
            <label className="text-[9px] font-black text-slate-900 uppercase block border-b-2 border-slate-100 mb-2">Relato da Ocorrência / Queixa</label>
            <p className="text-sm text-slate-700 leading-relaxed italic uppercase">
              {dados.relatoOcorrencia || dados.motivoAtendimento || "Não informado."}
            </p>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-900 uppercase block border-b-2 border-slate-100 mb-2">Conduta de Enfermagem</label>
            <p className="text-sm text-slate-700 leading-relaxed uppercase">
              {dados.procedimentos || "Avaliação clínica e monitoramento de parâmetros vitais."}
            </p>
          </div>

          {(dados.medicacao) && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Medicação Administrada</label>
              <p className="text-sm font-black text-blue-800 uppercase italic">{dados.medicacao}</p>
            </div>
          )}
        </div>

        {/* 4. DESFECHO */}
        <div className="mb-4 text-[10px] font-black uppercase bg-blue-600 text-white px-3 py-1 inline-block" style={{ WebkitPrintColorAdjust: 'exact' }}>3. Desfecho e Contra-Referência</div>
        <div className="grid grid-cols-1 gap-4 mb-10">
          <div className="border-l-4 border-blue-600 pl-4 bg-blue-50/30 p-2">
            <label className="text-[8px] font-black text-slate-400 uppercase block">Status de Saída</label>
            <p className="font-black text-slate-800 uppercase text-xs">
              {foiHospital ? "⚠️ Encaminhamento Hospitalar / Remoção" : "✅ Alta da Enfermaria Escolar"}
            </p>
          </div>

          {statusAtual === 'finalizado' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100" style={{ WebkitPrintColorAdjust: 'exact' }}>
              <div className="flex items-center gap-2 mb-2">
                <Hospital size={14} className="text-blue-600" />
                <label className="text-[9px] font-black text-blue-600 uppercase">Retorno Hospitalar / Diagnóstico</label>
              </div>
              <p className="text-[11px] font-bold text-slate-800 leading-snug uppercase">{dados.condutaHospitalar || "Sem registro de diagnóstico externo."}</p>
              {dados.observacoesFinais && (
                <p className="text-[9px] text-blue-700 font-bold mt-2 uppercase italic">Orientações: {dados.observacoesFinais}</p>
              )}
            </div>
          )}
        </div>

        {/* 5. ASSINATURAS */}
        <div className="mt-auto grid grid-cols-2 gap-20">
          <div className="text-center border-t-2 border-slate-900 pt-3">
            <p className="text-[11px] font-black uppercase text-slate-900 leading-none">
              {formatarParaExibicao(dados.finalizadoPor || dados.profissionalNome)}
            </p>
            <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">
              Enfermeiro(a) • Registro: {dados.registroFinalizador || dados.profissionalRegistro || "COREN ATIVO"}
            </p>
          </div>
          
          <div className="text-center border-t border-slate-300 pt-3">
            <p className="text-[8px] font-black text-slate-400 uppercase italic leading-none">Assinatura do Responsável / Ciente</p>
            <p className="text-[10px] font-black text-slate-200 mt-6">DOCUMENTO ASSINADO DIGITALMENTE</p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[7px] text-slate-300 font-bold uppercase tracking-[0.5em]">
          Rodhon Intelligence — Gestão de Saúde Escolar Maricá 2026
        </div>
      </div>
    </div>
  );
};

export default FichaImpressao;