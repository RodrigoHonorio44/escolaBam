import React, { useEffect } from 'react';

/**
 * Componente de Impressão para Pasta Digital
 * Gera um documento BAENF completo com todos os campos do atendimento
 */

const gerarHTMLImpressao = (atend) => {
  const dataEmissao = new Date().toLocaleString('pt-BR');

  return `
    <html>
      <head>
        <title>BAENF - ${atend.nomePaciente}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 0; margin: 0; color: #000; background-color: #fff;
            -webkit-print-color-adjust: exact;
          }
          
          .page { padding: 40px; max-width: 800px; margin: auto; }
          
          .header { 
            display: flex; justify-content: space-between; align-items: center; 
            border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;
          }
          
          .brand h1 { margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; font-style: italic; }
          .brand p { margin: 0; font-size: 10px; color: #444; font-weight: 700; text-transform: uppercase; }
          
          .doc-type { text-align: right; }
          .doc-type div { font-size: 9px; font-weight: 900; text-transform: uppercase; }
          .doc-type h2 { margin: 0; font-size: 15px; font-weight: 900; color: #2563eb; }

          .alerta-alergia {
            border: 2px solid #000; padding: 10px 15px;
            border-radius: 4px; margin-bottom: 20px;
            font-size: 12px; font-weight: 900; text-transform: uppercase;
            text-align: center; background-color: #fff1f2; color: #be123c;
          }

          .section-label { 
            font-size: 10px; font-weight: 900; text-transform: uppercase; 
            color: #fff; background: #000; padding: 4px 8px;
            margin-top: 20px; margin-bottom: 10px;
          }

          .info-grid { 
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 15px; 
          }
          .info-item { border: 1px solid #eee; padding: 6px; border-radius: 4px; background: #fcfcfc; }
          .info-item .label { font-size: 7px; font-weight: 800; color: #777; text-transform: uppercase; margin-bottom: 2px; }
          .info-item .value { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #000; }

          .content-block {
            margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 4px;
          }
          .content-title { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #444; margin-bottom: 5px; border-bottom: 1px solid #f0f0f0; }
          .content-text { font-size: 11px; line-height: 1.5; color: #111; white-space: pre-wrap; }

          .footer { 
            margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end;
            border-top: 1px solid #eee; padding-top: 20px;
          }
          .meta-info { font-size: 8px; color: #999; line-height: 1.4; }
          .signature-box { text-align: center; width: 280px; }
          .sig-line { border-top: 1.5px solid #000; margin-bottom: 5px; }
          .sig-name { font-size: 11px; font-weight: 900; text-transform: uppercase; }
          .sig-role { font-size: 9px; color: #666; font-weight: 700; text-transform: uppercase; }
          .sig-coren { font-size: 10px; color: #2563eb; font-weight: 900; margin-top: 2px; }

          @media print {
            @page { margin: 12mm; }
            body { background: white; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <header class="header">
            <div class="brand">
              <h1>SISTEMA MEDSYS</h1>
              <p>${atend.escola || 'Unidade de Saúde Escolar'}</p>
            </div>
            <div class="doc-type">
              <div>Prontuário de Atendimento</div>
              <h2>${atend.baenf || 'BAENF-PROVISORIO'}</h2>
            </div>
          </header>

          ${atend.alunoPossuiAlergia === 'Sim' || atend.qualAlergia ? `
            <div class="alerta-alergia">
              ⚠️ ATENÇÃO - PACIENTE ALÉRGICO: ${atend.qualAlergia || 'SIM (NÃO ESPECIFICADA)'}
            </div>
          ` : ''}

          <div class="section-label">1. Identificação</div>
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Nome do Paciente</div>
              <div class="value">${atend.nomePaciente}</div>
            </div>
            <div class="info-item">
              <div class="label">Idade</div>
              <div class="value">${atend.idade} Anos</div>
            </div>
            <div class="info-item">
              <div class="label">Sexo</div>
              <div class="value">${atend.sexo || '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">Data do Atendimento</div>
              <div class="value">${atend.dataAtendimento}</div>
            </div>
            <div class="info-item">
              <div class="label">Horário</div>
              <div class="value">${atend.horario}</div>
            </div>
            <div class="info-item">
              <div class="label">Turma / Setor</div>
              <div class="value">${atend.turma || '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">Temperatura</div>
              <div class="value" style="color: ${parseFloat(atend.temperatura) >= 37.5 ? '#dc2626' : '#000'}">
                ${atend.temperatura ? atend.temperatura + '°C' : 'N/A'}
              </div>
            </div>
          </div>

          <div class="section-label">2. Detalhes da Ocorrência</div>
          
          <div class="content-block">
            <div class="content-title">Motivo da Queixa</div>
            <div class="content-text">${atend.motivoAtendimento || 'Não informado'}</div>
          </div>

          ${atend.detalheQueixa ? `
          <div class="content-block">
            <div class="content-title">Detalhamento</div>
            <div class="content-text">${atend.detalheQueixa}</div>
          </div>
          ` : ''}

          <div class="section-label">3. Conduta Técnica e Evolução</div>
          
          <div class="content-block">
            <div class="content-title">Procedimentos Realizados</div>
            <div class="content-text">${atend.procedimentos || 'Observação clínica e orientação.'}</div>
          </div>

          ${atend.medicacao ? `
          <div class="content-block">
            <div class="content-title">Medicação Administrada</div>
            <div class="content-text">${atend.medicacao}</div>
          </div>
          ` : ''}

          <div class="section-label">4. Desfecho e Encaminhamento</div>
          
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Encaminhado para Hospital?</div>
              <div class="value">${atend.encaminhadoHospital || 'Não'}</div>
            </div>
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Destino Final</div>
              <div class="value">${atend.destinoHospital || 'Retornou para sala/casa'}</div>
            </div>
          </div>

          ${atend.observacoes ? `
          <div class="content-block">
            <div class="content-title">Observações Finais</div>
            <div class="content-text">${atend.observacoes}</div>
          </div>
          ` : ''}

          <footer class="footer">
            <div class="meta-info">
              Documento assinado digitalmente.<br>
              Emitido em: ${dataEmissao}<br>
              ID: ${atend.id || '---'}
            </div>
            <div class="signature-box">
              <div class="sig-line"></div>
              <div class="sig-name">${atend.profissionalNome || 'Profissional não identificado'}</div>
              <div class="sig-role">Enfermeiro(a) Responsável</div>
              <div class="sig-coren">COREN: ${atend.profissionalRegistro || 'S/N'}</div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  `;
};

const ImpressaoPastaDigital = ({ atendimento, onFinished }) => {
  useEffect(() => {
    if (atendimento) {
      const html = gerarHTMLImpressao(atendimento);
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      iframe.contentWindow.focus();
      
      setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
        onFinished();
      }, 500);
    }
  }, [atendimento, onFinished]);

  return null;
};

export default ImpressaoPastaDigital;