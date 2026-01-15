export const gerarHTMLImpressao = (atend) => {
  return `
    <html>
      <head>
        <title>BAENF - ${atend.nomePaciente}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 0; margin: 0; color: #0f172a; background-color: #fff;
            -webkit-print-color-adjust: exact;
          }
          .page { padding: 40px; max-width: 800px; margin: auto; }
          .header { 
            display: flex; justify-content: space-between; align-items: center; 
            border-bottom: 3px solid #020617; padding-bottom: 15px; margin-bottom: 25px;
          }
          .brand h1 { margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; font-style: italic; }
          .brand h1 span { color: #2563eb; }
          .brand p { margin: 0; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
          .doc-type { text-align: right; }
          .doc-type div { font-size: 9px; font-weight: 900; color: #2563eb; text-transform: uppercase; }
          .doc-type h2 { margin: 0; font-size: 16px; font-weight: 900; }

          .alerta-alergia {
            background: #fef2f2; border: 1px solid #ef4444; padding: 10px 15px;
            border-radius: 8px; margin-bottom: 20px; color: #b91c1c;
            font-size: 12px; font-weight: 700; text-transform: uppercase;
          }

          .section-label { 
            font-size: 9px; font-weight: 900; text-transform: uppercase; 
            color: #64748b; margin-bottom: 6px; border-left: 3px solid #2563eb; padding-left: 8px;
          }

          .info-grid { 
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; 
          }
          .info-item { background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
          .info-item .label { font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
          .info-item .value { font-size: 11px; font-weight: 700; }

          .content-area { 
            padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; 
            font-size: 12px; line-height: 1.6; color: #334155; min-height: 50px;
          }
          .highlight { background: #f1f5f9; font-weight: 700; }

          .footer { 
            margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end;
            border-top: 1px solid #f1f5f9; padding-top: 20px;
          }
          .meta-info { font-size: 8px; color: #94a3b8; }
          .signature-box { text-align: center; width: 250px; }
          .sig-line { border-top: 1px solid #020617; margin-bottom: 5px; }
          .sig-name { font-size: 11px; font-weight: 900; text-transform: uppercase; }

          @media print {
            @page { margin: 10mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <header class="header">
            <div class="brand">
              <h1>SISTEMA <span>SAÚDE</span></h1>
              <p>${atend.escola || 'Unidade de Saúde Escolar'}</p>
            </div>
            <div class="doc-type">
              <div>Documento de Enfermagem</div>
              <h2>BAENF #${atend.baenf || 'S/N'}</h2>
            </div>
          </header>

          ${atend.qualAlergia || atend.alunoPossuiAlergia === 'Sim' ? `
            <div class="alerta-alergia">
              ⚠️ ALERGIA IDENTIFICADA: ${atend.qualAlergia || 'Não especificada'}
            </div>
          ` : ''}

          <div class="section-label">Dados do Paciente</div>
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Paciente</div>
              <div class="value">${atend.nomePaciente}</div>
            </div>
            <div class="info-item">
              <div class="label">Data / Hora</div>
              <div class="value">${atend.dataAtendimento} às ${atend.horario}</div>
            </div>
            <div class="info-item">
              <div class="label">Turma/Setor</div>
              <div class="value">${atend.turma || '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">Temperatura</div>
              <div class="value">${atend.temperatura ? atend.temperatura + '°C' : 'Não aferida'}</div>
            </div>
            <div class="info-item">
              <div class="label">Cartão SUS</div>
              <div class="value">${atend.cartaoSus || '---'}</div>
            </div>
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Status</div>
              <div class="value">${atend.statusAtendimento || 'Finalizado'}</div>
            </div>
          </div>

          <div class="section-label">Motivo da Queixa</div>
          <div class="content-area highlight">${atend.motivoAtendimento}</div>
          <br>
          <div class="section-label">Conduta Técnica</div>
          <div class="content-area">${atend.observacoes || 'Sem observações adicionais.'}</div>

          <footer class="footer">
            <div class="meta-info">
              Emitido em: ${new Date().toLocaleString('pt-BR')}<br>
              ID: ${atend.id}
            </div>
            <div class="signature-box">
              <div class="sig-line"></div>
              <div class="sig-name">${atend.profissionalNome}</div>
              <div class="sig-role">${atend.profissionalRegistro || 'Enfermeiro(a)'}</div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  `;
};