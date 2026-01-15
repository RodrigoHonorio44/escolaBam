import React from 'react';
import { Printer, ArrowLeft } from 'lucide-react';

const FichaImpressao = ({ dados, onVoltar }) => {
  const imprimir = () => {
    window.print();
  };

  if (!dados) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Botões de Ação (Escondidos na Impressão) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={onVoltar} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} /> VOLTAR AO HISTÓRICO
        </button>
        <button onClick={imprimir} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all">
          <Printer size={20} /> IMPRIMIR PRONTUÁRIO
        </button>
      </div>

      {/* ÁREA DO DOCUMENTO (O que sai no papel) */}
      <div className="max-w-4xl mx-auto bg-white shadow-2xl p-10 md:p-16 border border-slate-200 rounded-sm print:shadow-none print:border-none print:p-0">
        
        {/* CABEÇALHO OFICIAL */}
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Ficha de Atendimento (BAENF)</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{dados.escola}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Registro No.</p>
            <p className="text-lg font-black text-blue-600">{dados.baenf || dados.bam}</p>
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
            <label className="text-[9px] font-black text-slate-400 uppercase block">Sexo</label>
            <p className="font-bold text-slate-800">{dados.sexo}</p>
          </div>
          <div className="border-b border-slate-200 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase block">
              {dados.perfilPaciente === 'aluno' ? 'Turma' : 'Cargo'}
            </label>
            <p className="font-bold text-slate-800 uppercase">{dados.turma || dados.cargo || 'N/A'}</p>
          </div>
        </div>

        {/* DADOS DO ATENDIMENTO */}
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-[9px] font-black text-slate-400 uppercase block">Data</label>
              <p className="font-bold text-slate-800">{dados.data}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-[9px] font-black text-slate-400 uppercase block">Horário Entrada</label>
              <p className="font-bold text-slate-800">{dados.horario}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-[9px] font-black text-red-400 uppercase block">Temperatura</label>
              <p className="font-bold text-red-600">{dados.temperatura}°C</p>
            </div>
          </div>

          <div className="border-l-4 border-slate-200 pl-6 space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">Motivo da Queixa / Ocorrência</label>
              <p className="text-sm text-slate-700 leading-relaxed">{dados.motivoAtendimento || "Não informado."}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">Conduta / Procedimentos Realizados</label>
              <p className="text-sm text-slate-700 leading-relaxed">{dados.procedimentos || "Nenhum procedimento registrado."}</p>
            </div>
            {dados.medicacao && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Medicação Administrada</label>
                <p className="text-sm text-slate-700">{dados.medicacao}</p>
              </div>
            )}
          </div>

          {/* INFORMAÇÕES DE REMOÇÃO (Se houver) */}
          {dados.encaminhadoHospital === 'sim' && (
            <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl space-y-4">
              <h3 className="text-orange-700 font-black uppercase text-xs tracking-widest">Informações de Remoção</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-orange-400 uppercase">Destino</label>
                  <p className="font-bold text-orange-800 text-sm">{dados.destinoHospital}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-orange-400 uppercase">Responsável Transporte</label>
                  <p className="font-bold text-orange-800 text-sm">{dados.responsavelTransporte}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ASSINATURAS — NOME E REGISTRO NA MESMA LINHA */}
        <div className="mt-20 grid grid-cols-2 gap-20">
          <div className="text-center border-t border-slate-300 pt-4">
            <p className="text-[10px] font-black uppercase text-slate-800">
              {dados.profissionalNome} — COREN: {dados.profissionalRegistro || 'NÃO INFORMADO'}
            </p>
            <p className="text-[9px] font-bold text-slate-500 uppercase">{dados.profissionalCargo || 'Enfermagem'}</p>
          </div>
          <div className="text-center border-t border-slate-300 pt-4">
            <p className="text-[10px] font-black uppercase text-slate-400">Responsável / Ciente</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase italic">Assinatura do Responsável</p>
          </div>
        </div>

        {/* RODAPÉ DO PAPEL */}
        <div className="mt-16 text-center text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          Documento Gerado Eletronicamente via Sistema de Enfermagem Escolar — {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default FichaImpressao;