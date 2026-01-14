import React from 'react';
import { Printer, ArrowLeft, CheckSquare, Square } from 'lucide-react';

const PrintFichaSaude = ({ data, onVoltar }) => {
  const handlePrint = () => {
    window.print();
  };

  // Função auxiliar para marcar sim/não no papel
  const CheckBox = ({ label, value }) => (
    <div className="flex items-center gap-2 mb-1">
      {value ? <CheckSquare size={14} /> : <Square size={14} />}
      <span className={value ? "font-bold" : "text-slate-500"}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 print:bg-white print:p-0">
      
      {/* BARRA DE FERRAMENTAS - DESAPARECE NA IMPRESSÃO */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button 
          onClick={onVoltar}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black uppercase text-xs transition-all"
        >
          <ArrowLeft size={18} /> Voltar ao Formulário
        </button>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-sm flex items-center gap-3 shadow-xl shadow-blue-200"
        >
          <Printer size={20} /> Imprimir Agora
        </button>
      </div>

      {/* FOLHA A4 (LAYOUT OFICIAL) */}
      <div className="max-w-[210mm] mx-auto bg-white p-[15mm] shadow-2xl print:shadow-none print:p-0 border border-slate-200 print:border-none">
        
        {/* CABEÇALHO CONFORME A IMAGEM QUE VOCÊ ENVIOU */}
        <div className="flex flex-col items-center text-center border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between w-full items-center mb-2">
            {/* Logo Maricá */}
            <img src="/brasao_marica.png" alt="Prefeitura de Maricá" className="h-24 w-auto object-contain" />
            
            <div className="flex-1 px-4">
              <h1 className="text-[17px] font-bold text-black leading-tight">PREFEITURA MUNICIPAL DE MARICÁ</h1>
              <h2 className="text-[15px] font-bold text-black leading-tight">SECRETARIA MUNICIPAL DE EDUCAÇÃO</h2>
              <h3 className="text-[16px] font-black text-black leading-tight uppercase italic tracking-tighter">E.M. ANÍSIO SPÍNOLA TEIXEIRA</h3>
            </div>

            {/* Logo CEPT */}
            <img src="/logo_cept.png" alt="Logo CEPT" className="h-24 w-auto object-contain" />
          </div>

          {/* Dados da Unidade */}
          <div className="text-[9px] text-black font-medium leading-none space-y-1 mt-1">
            <p>E.mail: emanisioteixeira.r2@gmail.com | Código do INEP: 33183996</p>
            <p>Avenida Jardel Filho s/nº - Jardim Atlântico Central – Itaipuaçu – Maricá – RJ CEP: 24934-180</p>
            <p className="font-bold">Ato de Criação Decreto PMM nº02 de 02/01/2019 Decreto nº 298 de 14/03/2019 – JOM 939 de 18/03/2019</p>
          </div>
        </div>

        {/* TÍTULO DO DOCUMENTO */}
        <div className="text-center mb-6">
          <h2 className="text-[18px] font-black uppercase underline decoration-2 underline-offset-8">Questionário de Saúde Escolar - 2026</h2>
        </div>

        {/* CORPO DO DOCUMENTO */}
        <div className="space-y-6 text-[12px]">
          
          {/* IDENTIFICAÇÃO */}
          <section className="grid grid-cols-2 gap-4 border-b pb-4">
            <div className="col-span-2">
              <p><strong>NOME COMPLETO:</strong> <span className="uppercase border-b border-dotted border-black block mt-1">{data.nomeAluno || '_____________________________________________________________________'}</span></p>
            </div>
            <div>
              <p><strong>DATA DE NASCIMENTO:</strong> {data.dataNascimento || '____/____/________'}</p>
            </div>
            <div>
              <p><strong>TURMA:</strong> {data.turma || '____________________'}</p>
            </div>
            <div>
              <p><strong>NOME DO RESPONSÁVEL:</strong> {data.responsavel || '____________________________________'}</p>
            </div>
            <div>
              <p><strong>TELEFONE DE EMERGÊNCIA:</strong> {data.telefone || '(21) 9 ____-____'}</p>
            </div>
          </section>

          {/* CHECKLIST DE SAÚDE */}
          <section>
            <h4 className="font-bold bg-black text-white px-2 py-1 mb-3 uppercase italic">Condições de Saúde</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <CheckBox label="Possui alguma alergia?" value={data.temAlergia} />
                <p className="pl-6 text-[10px] italic">Qual? {data.alergias || '____________________'}</p>
                
                <CheckBox label="Toma medicação contínua?" value={data.temMedicacao} />
                <p className="pl-6 text-[10px] italic">Qual? {data.medicamentos || '____________________'}</p>
              </div>

              <div className="space-y-2">
                <CheckBox label="Possui restrição física?" value={data.temRestricao} />
                <CheckBox label="Possui problemas cardíacos?" value={data.temCardiaco} />
                <CheckBox label="Já desmaiou em atividade física?" value={data.temDesmaio} />
                <p className="mt-2"><strong>Tipo Sanguíneo:</strong> {data.tipoSanguineo || '________'}</p>
              </div>
            </div>
          </section>

          {/* OBSERVAÇÕES */}
          <section>
            <h4 className="font-bold border-b border-black mb-1 uppercase">Observações Adicionais do Enfermeiro:</h4>
            <div className="min-h-[80px] border border-slate-200 p-2 italic text-slate-600">
              {data.observacoes || 'Nenhuma observação registrada.'}
            </div>
          </section>

          {/* TERMO DE RESPONSABILIDADE */}
          <section className="mt-10 p-4 border border-black rounded-sm">
            <p className="text-[10px] leading-relaxed text-justify">
              Declaro que as informações acima são verdadeiras e que estou ciente da importância de comunicar qualquer alteração no quadro de saúde do aluno à secretaria da E.M. Anísio Spínola Teixeira. Em caso de emergência, autorizo o encaminhamento para a unidade de saúde mais próxima.
            </p>

            <div className="flex justify-between items-end mt-12">
              <div className="text-center w-[250px]">
                <div className="border-t border-black w-full mb-1"></div>
                <p className="text-[10px] font-bold uppercase">Assinatura do Responsável</p>
              </div>
              
              <div className="text-right">
                <p className="text-[12px] font-bold">Maricá, ____ de ________________ de 2026.</p>
              </div>
            </div>
          </section>
        </div>

        {/* RODAPÉ TÉCNICO */}
        <footer className="mt-8 pt-2 border-t border-slate-100 text-[8px] flex justify-between text-slate-400 font-bold uppercase tracking-tighter">
          <span>MedSys • Gestão Inteligente de Saúde Escolar</span>
          <span>ID do Documento: {data.id?.substring(0,8) || 'DRAFT'}</span>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 10mm; size: auto; }
          body { background: white !important; margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
};

export default PrintFichaSaude;