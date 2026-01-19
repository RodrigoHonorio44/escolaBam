import React from 'react';
import { Printer, ArrowLeft, ShieldAlert } from 'lucide-react';

const FichaImpressao = ({ dados, onVoltar }) => {
  const imprimir = () => {
    window.print();
  };

  if (!dados) return null;

  // Garantia de preenchimento dos campos que estavam sumindo
  const temperaturaExibida = dados.temperatura || dados.temp || (dados.triagem && dados.triagem.temperatura);
  const turmaExibida = dados.turma || dados.turmaPaciente || dados.serie;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      
      {/* 🚀 CSS DE IMPRESSÃO REFORMULADO */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Esconde absolutamente tudo no corpo da página */
          body * {
            visibility: hidden;
          }
          /* Mostra apenas a área da ficha e seus filhos */
          .print-area, .print-area * {
            visibility: visible;
          }
          /* Posiciona a ficha no topo esquerdo absoluto */
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important; /* Margem interna do papel */
            border: none !important;
            box-shadow: none !important;
            background-color: white !important;
          }
          /* Remove margens extras do navegador (cabeçalho/rodapé do Windows) */
          @page {
            margin: 0;
            size: auto;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}} />

      {/* Botões de Ação (Somente tela) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print-hidden">
        <button onClick={onVoltar} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} /> VOLTAR AO HISTÓRICO
        </button>
        <button onClick={imprimir} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all">
          <Printer size={20} /> IMPRIMIR AGORA
        </button>
      </div>

      {/* ÁREA DO DOCUMENTO (O que sai no papel) */}
      <div className="print-area max-w-4xl mx-auto bg-white shadow-2xl p-10 md:p-16 border border-slate-200 rounded-sm">
        
        {/* ALERTA DE ALERGIA */}
        {(dados.qualAlergia || dados.alunoPossuiAlergia === 'Sim') && (
          <div className="mb-6 bg-red-600 text-white p-4 rounded-lg flex items-center gap-3" style={{ WebkitPrintColorAdjust: 'exact' }}>
            <ShieldAlert size={24} />
            <div>
              <p className="text-[10px] font-black uppercase leading-none">Atenção: Alergia Identificada</p>
              <p className="text-sm font-bold uppercase">{dados.qualAlergia || "Sim"}</p>
            </div>
          </div>
        )}

        {/* CABEÇALHO */}
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-tight">Ficha de Atendimento<br/>Enfermagem (BAENF)</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">{dados.escola || "E.M. ANÍSIO SPÍNOLA TEIXEIRA"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Documento ID</p>
            <p className="text-lg font-black text-blue-600 uppercase italic">{dados.baenf || 'S/N'}</p>
          </div>
        </div>

        {/* 1. IDENTIFICAÇÃO */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="col-span-2 border-b border-slate-100 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Paciente</label>
            <p className="font-bold text-slate-800 uppercase">{dados.nomePaciente || dados.pacienteNome}</p>
          </div>
          <div className="border-b border-slate-100 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Idade</label>
            <p className="font-bold text-slate-800">{dados.idade ? `${dados.idade} anos` : '---'}</p>
          </div>
          <div className="border-b border-slate-100 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Turma</label>
            <p className="font-bold text-slate-800 uppercase">{turmaExibida || '---'}</p>
          </div>
          
          <div className="border-b border-slate-100 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Data</label>
            <p className="font-bold text-slate-800">{dados.dataAtendimento || dados.data}</p>
          </div>
          <div className="border-b border-slate-100 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Horário</label>
            <p className="font-bold text-slate-800">{dados.horario || dados.hora}</p>
          </div>
          <div className="border-b border-slate-100 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">Sexo</label>
            <p className="font-bold text-slate-800 uppercase">{dados.sexo || '---'}</p>
          </div>
          <div className="border-b border-slate-100 pb-2">
            <label className="text-[9px] font-black text-red-400 uppercase block">Temperatura</label>
            <p className="font-bold text-red-600">{temperaturaExibida ? `${temperaturaExibida}°C` : '---'}</p>
          </div>
        </div>

        {/* 2. DADOS CLÍNICOS */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded border-l-4 border-slate-900" style={{ WebkitPrintColorAdjust: 'exact' }}>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Motivo do Atendimento</label>
            <p className="text-sm text-slate-800 font-semibold">{dados.motivoAtendimento || "Não informado."}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 p-4 rounded">
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Procedimentos Realizados</label>
              <p className="text-sm text-slate-700 leading-relaxed italic">{dados.procedimentos || "Observação e orientação clínica."}</p>
            </div>
            <div className="border border-slate-200 p-4 rounded">
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Medicação Administrada</label>
              <p className="text-sm text-slate-700 leading-relaxed font-bold uppercase">{dados.medicacao || "Nenhuma medicação administrada."}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded border-l-4 border-blue-600" style={{ WebkitPrintColorAdjust: 'exact' }}>
            <label className="text-[10px] font-black text-blue-600 uppercase block mb-1">Desfecho e Encaminhamento</label>
            <p className="text-sm text-slate-800 font-bold uppercase">{dados.destinoHospital || "Retornou para as atividades"}</p>
            {dados.observacoes && (
              <p className="text-[12px] text-slate-600 mt-2 border-t border-slate-200 pt-2">{dados.observacoes}</p>
            )}
          </div>
        </div>

        {/* 3. ASSINATURAS */}
        <div className="mt-20 grid grid-cols-2 gap-16">
          <div className="text-center border-t border-slate-300 pt-4">
            <p className="text-[11px] font-black uppercase text-slate-900">
              {dados.profissionalNome || "PROFISSIONAL RESPONSÁVEL"}
            </p>
            <p className="text-[10px] font-bold text-blue-600 uppercase">
              COREN: {dados.profissionalRegistro || "S/N"}
            </p>
          </div>
          
          <div className="text-center border-t border-slate-300 pt-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase italic">Responsável / Ciente</p>
            <p className="text-[10px] font-black uppercase text-slate-800 mt-4">________________________________</p>
          </div>
        </div>

        <div className="mt-12 text-center text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em]">
          Gerado eletronicamente via Sistema MedSys • {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  );
};

export default FichaImpressao;