import React from 'react';
import { Printer, ArrowLeft, ShieldAlert } from 'lucide-react';

const FichaImpressao = ({ dados, onVoltar }) => {
  const imprimir = () => {
    window.print();
  };

  if (!dados) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      
      {/* 🚀 BLOCO DE CORREÇÃO DE IMPRESSÃO */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Esconde absolutamente TUDO do site (menus, dashboard, etc) */
          body * {
            visibility: hidden !important;
          }
          /* Torna visível APENAS a área da ficha e o que está dentro dela */
          .print-area, .print-area * {
            visibility: visible !important;
          }
          /* Posiciona a ficha no topo da folha */
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Garante que cores de fundo saiam na impressora */
          .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
          .bg-blue-600 { background-color: #2563eb !important; -webkit-print-color-adjust: exact; }
          .text-red-600 { color: #dc2626 !important; }
        }
      `}} />

      {/* Botões de Ação (Escondidos na Impressão) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={onVoltar} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} /> VOLTAR AO HISTÓRICO
        </button>
        <button onClick={imprimir} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all">
          <Printer size={20} /> IMPRIMIR PRONTUÁRIO
        </button>
      </div>

      {/* ÁREA DO DOCUMENTO (Adicionada a classe 'print-area') */}
      <div className="print-area max-w-4xl mx-auto bg-white shadow-2xl p-10 md:p-16 border border-slate-200 rounded-sm print:shadow-none print:border-none">
        
        {/* ALERTA DE ALERGIA — VISÍVEL NO TOPO SE HOUVER */}
        {(dados.qualAlergia || dados.alunoPossuiAlergia === 'Sim') && (
          <div className="mb-6 bg-red-600 text-white p-4 rounded-lg flex items-center gap-3 print:border-2 print:border-red-600">
            <ShieldAlert size={24} />
            <div>
              <p className="text-[10px] font-black uppercase leading-none">Atenção: Alergia Identificada</p>
              <p className="text-sm font-bold uppercase">{dados.qualAlergia || "Sim"}</p>
            </div>
          </div>
        )}

        {/* CABEÇALHO OFICIAL */}
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Ficha de Atendimento (BAENF)</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{dados.escola}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Registro No.</p>
            <p className="text-lg font-black text-blue-600">{dados.baenf || dados.bam || dados.id?.substring(0,8).toUpperCase()}</p>
          </div>
        </div>

        {/* IDENTIFICAÇÃO DO PACIENTE */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="col-span-2 border-b border-slate-200 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Nome Completo</label>
            <p className="font-bold text-slate-800 uppercase">{dados.nomePaciente}</p>
          </div>
          <div className="border-b border-slate-200 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Perfil</label>
            <p className="font-bold text-slate-800 uppercase">{dados.perfilPaciente}</p>
          </div>
          <div className="border-b border-slate-200 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Idade</label>
            <p className="font-bold text-slate-800">{dados.idade} anos</p>
          </div>
          <div className="border-b border-slate-200 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Turma / Setor</label>
            <p className="font-bold text-slate-800 uppercase">{dados.turma || 'Geral'}</p>
          </div>
          <div className="border-b border-slate-200 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Cartão SUS</label>
            <p className="font-bold text-slate-800 uppercase">{dados.cartaoSus || '---'}</p>
          </div>
        </div>

        {/* DADOS DO ATENDIMENTO */}
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-[9px] font-black text-slate-400 uppercase block">Data</label>
              <p className="font-bold text-slate-800">{dados.dataAtendimento || dados.data}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-[9px] font-black text-slate-400 uppercase block">Horário</label>
              <p className="font-bold text-slate-800">{dados.horario}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-[9px] font-black text-red-400 uppercase block">Temperatura</label>
              <p className="font-bold text-red-600">{dados.temperatura ? `${dados.temperatura}°C` : '---'}</p>
            </div>
          </div>

          <div className="border-l-4 border-slate-200 pl-6 space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">Motivo da Queixa / Ocorrência</label>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{dados.motivoAtendimento || "Não informado."}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">Conduta / Evolução de Enfermagem</label>
              <p className="text-sm text-slate-700 leading-relaxed">{dados.observacoes || dados.procedimentos || "Nenhum procedimento registrado."}</p>
            </div>
          </div>
        </div>

        {/* ASSINATURAS */}
        <div className="mt-24 grid grid-cols-2 gap-20">
          <div className="text-center border-t border-slate-300 pt-4">
            <p className="text-[10px] font-black uppercase text-slate-800">
              {dados.profissionalNome}
            </p>
            <p className="text-[9px] font-bold text-slate-500 uppercase italic">Profissional Responsável</p>
          </div>
          <div className="text-center border-t border-slate-300 pt-4">
            <p className="text-[10px] font-black uppercase text-slate-400">Ciente / Responsável</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase italic">Assinatura</p>
          </div>
        </div>

        {/* RODAPÉ DO PAPEL */}
        <div className="mt-16 text-center text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          Documento Gerado Eletronicamente via Sistema MedSys — {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
};

export default FichaImpressao;