import React, { useEffect } from 'react';

/**
 * Componente de Impressão para Pasta Digital
 * Gera um documento BAENF completo com Sinais Vitais e Retorno Hospitalar
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
            border: 2px solid #be123c; padding: 10px 15px;
            border-radius: 8px; margin-bottom: 20px;
            font-size: 12px; font-weight: 900; text-transform: uppercase;
            text-align: center; background-color: #fff1f2; color: #be123c;
          }

          .section-label { 
            font-size: 10px; font-weight: 900; text-transform: uppercase; 
            color: #fff; background: #000; padding: 4px 8px;
            margin-top: 20px; margin-bottom: 10px; border-radius: 2px;
          }

          .info-grid { 
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 15px; 
          }
          .info-item { border: 1px solid #eee; padding: 6px; border-radius: 4px; background: #fcfcfc; }
          .info-item .label { font-size: 7px; font-weight: 800; color: #777; text-transform: uppercase; margin-bottom: 2px; }
          .info-item .value { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #000; }

          .vitals-grid {
            display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;
            background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;
          }

          .content-block {
            margin-bottom: 10px; padding: 10px; border: 1px solid #eee; border-radius: 4px;
          }
          .content-title { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #444; margin-bottom: 5px; border-bottom: 1px solid #f0f0f0; }
          .content-text { font-size: 11px; line-height: 1.5; color: #111; white-space: pre-wrap; }

          .hospital-box {
            border: 2px solid #2563eb; background: #eff6ff; padding: 15px; border-radius: 12px; margin-top: 10px;
          }

          .footer { 
            margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;
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
            .hospital-box { border-color: #000; background: #fff; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <header class="header">
            <div class="brand">
              <h1>SISTEMA RODHON</h1>
              <p>${atend.escola || 'Unidade de Saúde Escolar'}</p>
            </div>
            <div class="doc-type">
              <div>Boletim de Atendimento de Enfermagem</div>
              <h2>${atend.baenf || 'BAM-' + new Date().getFullYear()}</h2>
            </div>
          </header>

          ${atend.alunoPossuiAlergia === 'Sim' || atend.qualAlergia ? `
            <div class="alerta-alergia">
              ⚠️ ATENÇÃO - PACIENTE ALÉRGICO: ${atend.qualAlergia || 'SIM (NÃO ESPECIFICADA)'}
            </div>
          ` : ''}

          <div class="section-label">1. Identificação do Paciente</div>
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Nome Completo</div>
              <div class="value">${atend.nomePaciente}</div>
            </div>
            <div class="info-item">
              <div class="label">Público</div>
              <div class="value">${atend.perfilPaciente || '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">Turma/Setor</div>
              <div class="value">${atend.turma || atend.cargo || '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">Data</div>
              <div class="value">${atend.dataAtendimento || atend.data}</div>
            </div>
            <div class="info-item">
              <div class="label">Horário Entrada</div>
              <div class="value">${atend.horario}</div>
            </div>
            <div class="info-item">
              <div class="label">Idade</div>
              <div class="value">${atend.idade} Anos</div>
            </div>
            <div class="info-item">
              <div class="label">Sexo</div>
              <div class="value">${atend.sexo || '---'}</div>
            </div>
          </div>

          <div class="section-label">2. Sinais Vitais na Admissão</div>
          <div class="vitals-grid">
            <div class="info-item">
              <div class="label">Temp.</div>
              <div class="value">${atend.temperatura ? atend.temperatura + '°C' : '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">P.A.</div>
              <div class="value">${atend.pressaoArterial || '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">F.C.</div>
              <div class="value">${atend.frequenciaCardiaca ? atend.frequenciaCardiaca + ' BPM' : '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">SatO2</div>
              <div class="value">${atend.saturacao ? atend.saturacao + '%' : '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">HGT</div>
              <div class="value">${atend.hgt ? atend.hgt + ' mg/dL' : '---'}</div>
            </div>
          </div>

          <div class="section-label">3. Avaliação Clínica e Conduta</div>
          
          <div class="content-block">
            <div class="content-title">Motivo da Queixa / Histórico</div>
            <div class="content-text">${atend.motivoAtendimento || atend.motivoEncaminhamento || 'Não informado'}</div>
          </div>

          <div class="content-block">
            <div class="content-title">Procedimentos e Evolução de Enfermagem</div>
            <div class="content-text">${atend.procedimentos || atend.detalheQueixa || 'Observação clínica realizada.'}</div>
          </div>

          ${atend.medicacao ? `
          <div class="content-block">
            <div class="content-title">Medicações Administradas</div>
            <div class="content-text">${atend.medicacao}</div>
          </div>
          ` : ''}

          <div class="section-label">4. Desfecho Escolar</div>
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Conduta de Saída</div>
              <div class="value">${atend.encaminhadoHospital === 'sim' ? 'ENCAMINHAMENTO HOSPITALAR' : 'ALTA DA ENFERMARIA'}</div>
            </div>
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Destino / Responsável</div>
              <div class="value">${atend.destinoHospital || 'Retornou às atividades'}</div>
            </div>
          </div>

          ${atend.statusAtendimento === 'Finalizado' ? `
            <div class="section-label" style="background: #2563eb">5. Contra-Referência (Retorno Hospitalar)</div>
            <div class="hospital-box">
              <div class="content-block" style="border:none; background:transparent;">
                <div class="content-title" style="color: #2563eb">Diagnóstico / Conduta Médica</div>
                <div class="content-text" style="font-weight: 700;">${atend.condutaHospitalar || 'Não registrado'}</div>
              </div>
              <div class="info-grid" style="margin-bottom:0">
                <div class="info-item">
                  <div class="label">Data da Alta</div>
                  <div class="value">${atend.dataAlta || '---'}</div>
                </div>
                <div class="info-item" style="grid-column: span 3;">
                  <div class="label">Observações de Repouso/Retorno</div>
                  <div class="value">${atend.observacoesFinais || 'Nenhuma'}</div>
                </div>
              </div>
            </div>
          ` : ''}

          <footer class="footer">
            <div class="meta-info">
              Documento extraído do Prontuário Digital.<br>
              Emitido em: ${dataEmissao}<br>
              ID Atendimento: ${atend.id}
            </div>
            <div class="signature-box">
              <div class="sig-line"></div>
              <div class="sig-name">${atend.profissionalNome || atend.finalizadoPor || 'Profissional Responsável'}</div>
              <div class="sig-role">Enfermagem - Registro Profissional</div>
              <div class="sig-coren">${atend.profissionalRegistro || 'Insc. Ativa'}</div>
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