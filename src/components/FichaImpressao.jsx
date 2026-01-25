import React from 'react';
import { Printer, ArrowLeft, ShieldAlert, Hospital, Activity } from 'lucide-react';

const FichaImpressao = ({ dados, user, onVoltar }) => {
  const imprimir = () => {
    window.print();
  };

  if (!dados) return null;

  // --- LÓGICA DE NORMALIZAÇÃO (R S em Maiúsculo) ---
  const formatarParaTela = (texto) => {
    if (!texto) return "";
    const palavras = texto.toString().toLowerCase().split(' ');
    return palavras.map(p => {
      if (p === 'r' || p === 's' || p.length === 1) return p.toUpperCase();
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  };

  // 1. MAPEAMENTO DE CAMPOS (Garantia de preenchimento caso os nomes variem no Firebase)
  const temperaturaExibida = dados.temperatura || dados.temp || (dados.triagem && dados.triagem.temperatura);
  const paExibida = dados.pressaoArterial || dados.pa || (dados.triagem && dados.triagem.pa);
  const fcExibida = dados.frequenciaCardiaca || dados.fc || (dados.triagem && dados.triagem.fc);
  const satExibida = dados.saturacao || dados.sato2 || (dados.triagem && dados.triagem.saturacao);
  const hgtExibido = dados.hgt || (dados.triagem && dados.triagem.hgt);
  
  const turmaExibida = dados.turma || dados.turmaPaciente || dados.serie || dados.cargo;
  const statusAtual = dados.statusAtendimento || 'Aberto';
  const foiHospital = dados.encaminhadoHospital?.toString().toLowerCase().trim() === 'sim' || statusAtual.includes("Remoção");

  // --- LÓGICA DE CAPTURA DE ALERGIA ---
  const detalheAlergia = dados.qualAlergia || dados.alergias || "";
  const temAlergia = (dados.alunoPossuiAlergia === 'sim' || dados.alunoPossuiAlergia === 'Sim' || detalheAlergia.length > 2) && 
                      !["não", "nao", "nenhuma"].includes(detalheAlergia.toLowerCase().trim());

  // --- CAPTURA DE NOME E COREN (MAPEADO PARA SEU FIREBASE) ---
  // Adicionado suporte para profissionalResponsavel e registroProfissional conforme seu log
  const nomeProfissional = user?.nome || dados.profissionalResponsavel || dados.finalizadoPor || dados.profissionalNome || "Profissional Responsável";
  const registroProfissional = user?.registroProfissional || dados.registroProfissional || user?.coren || dados.registroFinalizador || "COREN ATIVO";

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      
      {/* 🚀 CSS DE IMPRESSÃO REFORMULADO */}
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
            padding: 15mm !important;
            border: none !important;
            box-shadow: none !important;
            background-color: white !important;
          }
          @page { margin: 0; size: auto; }
          .print-hidden { display: none !important; }
          .alerta-alergia-print { 
            background-color: #be123c !important; 
            color: white !important;
            -webkit-print-color-adjust: exact; 
          }
        }
      `}} />

      {/* Botões de Ação (Somente tela) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print-hidden">
        <button onClick={onVoltar} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} /> VOLTAR AO FLUXO
        </button>
        <button onClick={imprimir} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black shadow-lg hover:bg-blue-600 transition-all">
          <Printer size={20} /> IMPRIMIR BAENF
        </button>
      </div>

      {/* ÁREA DO DOCUMENTO */}
      <div className="print-area max-w-4xl mx-auto bg-white shadow-2xl p-10 md:p-16 border border-slate-200 rounded-sm min-h-[297mm]">
        
        {/* ALERTA DE ALERGIA ATUALIZADO */}
        {temAlergia && (
          <div className="mb-6 alerta-alergia-print bg-rose-700 text-white p-4 rounded-lg flex items-center gap-4 border-2 border-rose-900">
            <ShieldAlert size={32} className="shrink-0" />
            <div>
              <p className="text-[11px] font-black uppercase leading-none tracking-[0.1em] mb-1">Alerta Clínico: Restrição Alérgica</p>
              <p className="text-lg font-black uppercase leading-tight">
                {detalheAlergia || "PACIENTE POSSUI ALERGIAS REGISTRADAS"}
              </p>
            </div>
          </div>
        )}

        {/* CABEÇALHO */}
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-tight">Boletim de Atendimento<br/>Enfermagem Escolar</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">{dados.escola || user?.escola || "UNIDADE DE SAÚDE ESCOLAR"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Documento ID</p>
            <p className="text-lg font-black text-blue-600 uppercase italic">#{dados.baenf?.toUpperCase() || dados.id?.substring(0,8).toUpperCase()}</p>
          </div>
        </div>

        {/* 1. IDENTIFICAÇÃO */}
        <div className="section-label mb-4 text-[11px] font-black uppercase bg-slate-900 text-white px-3 py-1 inline-block">1. Identificação do Paciente</div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="col-span-2 border-b border-slate-100 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Nome do Paciente</label>
            <p className="font-bold text-slate-800 uppercase text-base">{formatarParaTela(dados.nomePaciente || dados.pacienteNome)}</p>
          </div>
          <div className="border-b border-slate-100 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Turma/Cargo</label>
            <p className="font-bold text-slate-800 uppercase">{turmaExibida || '---'}</p>
          </div>
          <div className="border-b border-slate-100 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Data/Hora</label>
            <p className="font-bold text-slate-800 tabular-nums">{dados.dataAtendimento || dados.data} • {dados.horario || dados.hora || dados.horarioReferencia}</p>
          </div>
        </div>

        {/* 2. SINAIS VITAIS */}
        <div className="section-label mb-4 text-[11px] font-black uppercase bg-slate-900 text-white px-3 py-1 inline-block">2. Triagem Clínica</div>
        <div className="grid grid-cols-5 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100" style={{ WebkitPrintColorAdjust: 'exact' }}>
          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase block">Temperatura</label>
            <p className="font-bold text-slate-900">{temperaturaExibida ? `${temperaturaExibida}°C` : '---'}</p>
          </div>
          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase block">P.A.</label>
            <p className="font-bold text-slate-900">{paExibida || '---'}</p>
          </div>
          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase block">F.C.</label>
            <p className="font-bold text-slate-900">{fcExibida ? `${fcExibida} BPM` : '---'}</p>
          </div>
          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase block">SatO2</label>
            <p className="font-bold text-slate-900">{satExibida ? `${satExibida}%` : '---'}</p>
          </div>
          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase block">HGT</label>
            <p className="font-bold text-slate-900">{hgtExibido ? `${hgtExibido} mg/dL` : '---'}</p>
          </div>
        </div>

        {/* 3. EVOLUÇÃO E CONDUTA */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="text-[10px] font-black text-slate-900 uppercase block border-b border-slate-200 mb-2">Histórico / Queixa Principal</label>
            <p className="text-sm text-slate-700 leading-relaxed italic uppercase">
              {dados.motivoAtendimento || dados.motivoEncaminhamento || dados.relatoCurto || dados.relatoOcorrencia || "Paciente admitido para avaliação."}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-900 uppercase block border-b border-slate-200 mb-2">Procedimentos e Evolução</label>
            <p className="text-sm text-slate-700 leading-relaxed uppercase">
              {dados.procedimentos || dados.detalheQueixa || "Realizado monitoramento de sinais vitais e orientações de repouso."}
            </p>
          </div>

          {(dados.medicacao || dados.medicamento) && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Medicação Administrada</label>
              <p className="text-sm font-black text-slate-800 uppercase">{dados.medicacao || dados.medicamento}</p>
            </div>
          )}
        </div>

        {/* 4. DESFECHO HOSPITALAR (CONTRA-REFERÊNCIA) */}
        <div className="section-label mb-4 text-[11px] font-black uppercase bg-blue-600 text-white px-3 py-1 inline-block" style={{ WebkitPrintColorAdjust: 'exact' }}>3. Desfecho e Encaminhamento</div>
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="border-l-4 border-blue-600 pl-4">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Status de Saída</label>
            <p className="font-black text-slate-800 uppercase text-sm">
              {foiHospital ? "Encaminhamento Hospitalar / Remoção" : "Alta da Enfermaria Escolar"}
            </p>
            <p className="text-xs text-slate-500 mt-1 italic">{dados.destinoHospital || "Retornou às atividades normais."}</p>
          </div>

          {statusAtual === 'Finalizado' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100" style={{ WebkitPrintColorAdjust: 'exact' }}>
              <div className="flex items-center gap-2 mb-2">
                <Hospital size={16} className="text-blue-600" />
                <label className="text-[10px] font-black text-blue-600 uppercase">Retorno do Hospital (Contra-Referência)</label>
              </div>
              <p className="text-[12px] font-bold text-slate-800 leading-snug uppercase">{dados.condutaHospitalar || "Sem diagnóstico registrado."}</p>
              {dados.observacoesFinais && (
                <p className="text-[10px] text-blue-600 font-bold mt-2 uppercase italic">Observações: {dados.observacoesFinais}</p>
              )}
            </div>
          )}
        </div>

        {/* 5. ASSINATURAS (Nome do Eduardo + Registro) */}
        <div className="mt-20 grid grid-cols-2 gap-16">
          <div className="text-center border-t border-slate-900 pt-4">
            <p className="text-[11px] font-black uppercase text-slate-900 leading-none">
              {formatarParaTela(nomeProfissional)}
            </p>
            <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">
              Registro: {registroProfissional.toUpperCase()}
            </p>
          </div>
          
          <div className="text-center border-t border-slate-300 pt-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase italic leading-none">Assinatura do Responsável / Ciente</p>
            <p className="text-[10px] font-black text-slate-100 mt-6">DOCUMENTO ASSINADO DIGITALMENTE</p>
          </div>
        </div>

        <div className="mt-auto pt-10 text-center text-[8px] text-slate-300 font-bold uppercase tracking-[0.5em]">
          Rodhon Intelligence — Monitoramento Clínico 2026
        </div>
      </div>
    </div>
  );
};

export default FichaImpressao;