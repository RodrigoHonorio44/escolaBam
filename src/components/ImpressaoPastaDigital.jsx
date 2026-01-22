import React, { useEffect } from 'react';

/**
 * Componente de Impressão para Pasta Digital
 * Gera um documento BAENF completo com Sinais Vitais e Contra-Referência Hospitalar
 */

const gerarHTMLImpressao = (atend) => {
  const dataEmissao = new Date().toLocaleString('pt-BR');
  
  // Normalização de dados para evitar "undefined"
  const nomePaciente = atend.nomePaciente || "Não identificado";
  const dataAtend = atend.dataAtendimento || atend.data || "---";
  const status = atend.statusAtendimento || "Aberto";
  const foiHospital = atend.encaminhadoHospital?.toString().toLowerCase().trim() === 'sim' || status.includes("Remoção");

  return `
    <html>
      <head>
        <title>BAENF - ${nomePaciente}</title>
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
            border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px;
          }
          
          .brand h1 { margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: -1px; }
          .brand p { margin: 0; font-size: 11px; color: #444; font-weight: 700; text-transform: uppercase; }
          
          .doc-type { text-align: right; }
          .doc-type div { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #666; }
          .doc-type h2 { margin: 0; font-size: 18px; font-weight: 900; color: #2563eb; }

          .alerta-alergia {
            border: 2px solid #be123c; padding: 12px;
            border-radius: 8px; margin-bottom: 20px;
            font-size: 13px; font-weight: 900; text-transform: uppercase;
            text-align: center; background-color: #fff1f2; color: #be123c;
          }

          .section-label { 
            font-size: 11px; font-weight: 900; text-transform: uppercase; 
            color: #fff; background: #000; padding: 6px 10px;
            margin-top: 25px; margin-bottom: 12px; border-radius: 4px;
            display: inline-block;
          }

          .info-grid { 
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; 
          }
          .info-item { border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; background: #f8fafc; }
          .info-item .label { font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 3px; }
          .info-item .value { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e293b; }

          .vitals-grid {
            display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
            background: #fff; padding: 5px 0;
          }

          .content-block {
            margin-bottom: 15px; padding: 12px; border: 1px solid #f1f5f9; border-radius: 8px; background: #fff;
          }
          .content-title { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #334155; margin-bottom: 6px; border-bottom: 2px solid #f1f5f9; padding-bottom: 4px; }
          .content-text { font-size: 12px; line-height: 1.6; color: #0f172a; white-space: pre-wrap; font-weight: 500; }

          .hospital-box {
            border: 2px solid #2563eb; background: #f0f7ff; padding: 20px; border-radius: 15px; margin-top: 15px;
          }

          .footer { 
            margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;
            border-top: 2px solid #f1f5f9; padding-top: 25px;
          }
          .meta-info { font-size: 9px; color: #94a3b8; line-height: 1.5; font-weight: 600; }
          .signature-box { text-align: center; width: 300px; }
          .sig-line { border-top: 2px solid #0f172a; margin-bottom: 8px; }
          .sig-name { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
          .sig-role { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
          .sig-coren { font-size: 11px; color: #2563eb; font-weight: 900; margin-top: 4px; }

          @media print {
            @page { margin: 15mm; }
            body { background: white; }
            .hospital-box { border-color: #000; background: #fff; }
            .section-label { -webkit-print-color-adjust: exact; background-color: #000 !important; color: #fff !important; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <header class="header">
            <div class="brand">
              <h1>RODHON <span style="color:#2563eb">CLINIC</span></h1>
              <p>${atend.escola || 'Unidade de Atendimento Escolar'}</p>
            </div>
            <div class="doc-type">
              <div>Boletim de Atendimento de Enfermagem</div>
              <h2>${atend.id.substring(0, 8).toUpperCase()}</h2>
            </div>
          </header>

          ${atend.alunoPossuiAlergia === 'Sim' || atend.qualAlergia ? `
            <div class="alerta-alergia">
              ⚠️ ATENÇÃO: PACIENTE POSSUI ALERGIAS: ${atend.qualAlergia || 'NÃO ESPECIFICADA'}
            </div>
          ` : ''}

          <div class="section-label">1. Identificação do Paciente</div>
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Paciente</div>
              <div class="value">${nomePaciente}</div>
            </div>
            <div class="info-item">
              <div class="label">Público</div>
              <div class="value">${atend.perfilPaciente || 'Estudante'}</div>
            </div>
            <div class="info-item">
              <div class="label">Turma/Vínculo</div>
              <div class="value">${atend.turma || atend.cargo || '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">Data do Atendimento</div>
              <div class="value">${dataAtend}</div>
            </div>
            <div class="info-item">
              <div class="label">Hora Entrada</div>
              <div class="value">${atend.horario || '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">Idade</div>
              <div class="value">${atend.idade ? atend.idade + ' anos' : '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">Sexo</div>
              <div class="value">${atend.sexo || '---'}</div>
            </div>
          </div>

          <div class="section-label">2. Triagem e Sinais Vitais</div>
          <div class="vitals-grid">
            <div class="info-item">
              <div class="label">Temperatura</div>
              <div class="value">${atend.temperatura ? atend.temperatura + ' °C' : '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">P. Arterial</div>
              <div class="value">${atend.pressaoArterial || '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">F. Cardíaca</div>
              <div class="value">${atend.frequenciaCardiaca ? atend.frequenciaCardiaca + ' BPM' : '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">Sat. O2</div>
              <div class="value">${atend.saturacao ? atend.saturacao + ' %' : '---'}</div>
            </div>
            <div class="info-item">
              <div class="label">Glicemia (HGT)</div>
              <div class="value">${atend.hgt ? atend.hgt + ' mg/dL' : '---'}</div>
            </div>
          </div>

          <div class="section-label">3. Histórico e Conduta de Enfermagem</div>
          
          <div class="content-block">
            <div class="content-title">Relato da Queixa / Motivo do Atendimento</div>
            <div class="content-text">${atend.motivoAtendimento || atend.motivoEncaminhamento || atend.relatoCurto || 'Não informado'}</div>
          </div>

          <div class="content-block">
            <div class="content-title">Exame Físico e Procedimentos Realizados</div>
            <div class="content-text">${atend.procedimentos || atend.detalheQueixa || 'Paciente avaliado pela equipe de enfermagem escolar.'}</div>
          </div>

          ${atend.medicacao ? `
          <div class="content-block">
            <div class="content-title">Medicações Administradas</div>
            <div class="content-text">${atend.medicacao}</div>
          </div>
          ` : ''}

          <div class="section-label">4. Desfecho da Unidade</div>
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Conduta Final</div>
              <div class="value" style="color:${foiHospital ? '#e11d48' : '#16a34a'}">
                ${foiHospital ? '⚠️ ENCAMINHAMENTO / REMOÇÃO HOSPITALAR' : '✅ ALTA DA ENFERMARIA'}
              </div>
            </div>
            <div class="info-item" style="grid-column: span 2;">
              <div class="label">Responsável / Destino</div>
              <div class="value">${atend.destinoHospital || atend.responsavelCiente || 'Retornou à atividade'}</div>
            </div>
          </div>

          ${status === 'Finalizado' ? `
            <div class="section-label" style="background: #2563eb">5. Contra-Referência (Retorno do Hospital)</div>
            <div class="hospital-box">
              <div class="content-block" style="border:none; background:transparent; padding:0; margin-bottom:15px;">
                <div class="content-title" style="color: #2563eb; border-color: #cbd5e1;">Diagnóstico e Conduta Médica Hospitalar</div>
                <div class="content-text" style="font-size: 13px; font-weight: 700;">${atend.condutaHospitalar || 'Não registrado'}</div>
              </div>
              <div class="info-grid" style="margin-bottom:0">
                <div class="info-item">
                  <div class="label">Data da Alta</div>
                  <div class="value">${atend.dataAlta || '---'}</div>
                </div>
                <div class="info-item" style="grid-column: span 3;">
                  <div class="label">Observações de Repouso / Orientações</div>
                  <div class="value">${atend.observacoesFinais || 'Nenhuma'}</div>
                </div>
              </div>
            </div>
          ` : ''}

          <footer class="footer">
            <div class="meta-info">
              Documento assinado digitalmente.<br>
              Data de Emissão: ${dataEmissao}<br>
              Código de Autenticidade: ${atend.id}
            </div>
            <div class="signature-box">
              <div class="sig-line"></div>
              <div class="sig-name">${atend.finalizadoPor || atend.profissionalNome || 'Profissional de Enfermagem'}</div>
              <div class="sig-role">Enfermagem Escolar</div>
              <div class="sig-coren">${atend.registroFinalizador || atend.profissionalRegistro || 'COREN ATIVO'}</div>
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
      
      // Pequeno delay para carregar CSS antes de abrir o print do sistema
      setTimeout(() => {
        iframe.contentWindow.print();
        // Remove o iframe após a janela de impressão fechar
        setTimeout(() => {
          document.body.removeChild(iframe);
          onFinished();
        }, 100);
      }, 500);
    }
  }, [atendimento, onFinished]);

  return null;
};

export default ImpressaoPastaDigital;