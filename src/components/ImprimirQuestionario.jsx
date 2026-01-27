const ImprimirDocumento = () => {
  if (!formData.alunoNome) return;
  const win = window.open('', '_blank');
  
  // Tratamento de strings para evitar erros de renderização
  const dificuldadesAtivas = Object.entries(formData.dificuldades || {})
    .filter(([_, value]) => value === true)
    .map(([key]) => key)
    .join(', ') || 'nenhuma informada';

  const tratamentos = Object.entries(formData.tratamentoEspecializado || {})
    .filter(([key, value]) => value === true && key !== 'possui')
    .map(([key]) => key === 'terapiaOcupacional' ? 't.o' : key)
    .join(', ');

  win.document.write(`
    <html>
      <head>
        <title>prontuário médico - ${formData.alunoNome}</title>
        <style>
          @media print { .no-print { display: none; } }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            color: #1e293b; 
            line-height: 1.4; 
            font-size: 10px; 
            background: #fff;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 25px; 
          }
          .header h2 { margin: 0; font-size: 16px; font-weight: 900; text-transform: uppercase; }
          .header .subtitle { font-size: 9px; font-weight: 700; text-transform: uppercase; margin-top: 4px; color: #475569; }
          
          .section { 
            margin-bottom: 15px; 
            border: 1px solid #e2e8f0; 
            padding: 12px; 
            border-radius: 8px; 
            page-break-inside: avoid; 
          }
          .section-title { 
            font-weight: 900; 
            font-size: 9px; 
            color: #2563eb; 
            margin-bottom: 8px; 
            border-bottom: 1px solid #f1f5f9; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
          .label { font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 8px; display: block; }
          .value { font-size: 10px; font-weight: 600; margin-bottom: 4px; text-transform: lowercase; color: #0f172a; }
          
          .pcd-badge { 
            background: #2563eb; 
            color: white; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 8px; 
            font-weight: 900; 
            text-transform: uppercase; 
            margin-left: 10px; 
            vertical-align: middle;
          }
          
          .assinatura-wrapper { 
            margin-top: 60px; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 50px; 
          }
          .campo-assinatura { border-top: 1.5px solid #000; text-align: center; padding-top: 8px; }
          .assinatura-label { font-size: 9px; font-weight: 900; text-transform: uppercase; display: block; }
          .assinatura-sub { font-size: 8px; color: #64748b; font-weight: 700; text-transform: lowercase; }
          
          .footer-note { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 7px; 
            color: #94a3b8; 
            font-weight: 700; 
            text-transform: uppercase; 
            border-top: 1px dashed #e2e8f0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Ficha Médica Escolar e Prontuário</h2>
          <div class="subtitle">Unidade de Enfermagem - Departamento de Saúde e Bem-Estar</div>
        </div>

        <div class="section">
          <div class="section-title">
            1. Identificação do Aluno 
            ${formData.pcdStatus?.possui === 'sim' ? '<span class="pcd-badge">aluno pcd</span>' : ''}
          </div>
          <div class="grid">
            <div style="grid-column: span 2;"><span class="label">nome completo:</span> <div class="value">${formData.alunoNome}</div></div>
            <div><span class="label">turma:</span> <div class="value">${formData.turma || '---'}</div></div>
            <div><span class="label">viver com:</span> <div class="value">${formData.viverCom || '---'}</div></div>
            <div><span class="label">parto:</span> <div class="value">${formData.tipoParto || '---'}</div></div>
            <div><span class="label">vacinas:</span> <div class="value">${formData.vacinaStatus || '---'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Histórico Clínico e Diagnósticos</div>
          <div class="grid">
            <div><span class="label">pcd / esp.:</span> <div class="value">${formData.pcdStatus?.possui === 'sim' ? formData.pcdStatus.detalhes : 'não'}</div></div>
            <div><span class="label">alergias:</span> <div class="value">${formData.alergias?.possui === 'sim' ? formData.alergias.detalhes : 'não'}</div></div>
            <div><span class="label">diabetes:</span> <div class="value">${formData.diabetes?.possui === 'sim' ? formData.diabetes.tipo : 'não'}</div></div>
            <div><span class="label">medicação:</span> <div class="value">${formData.medicacaoContinua?.possui === 'sim' ? formData.medicacaoContinua.detalhes : 'não'}</div></div>
            <div><span class="label">asma/resp.:</span> <div class="value">${formData.asma?.possui || 'não'}</div></div>
            <div><span class="label">dentista:</span> <div class="value">${formData.dentistaUltimaConsulta || '---'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. Desenvolvimento e Mobilidade</div>
          <div class="grid">
            <div style="grid-column: span 2;"><span class="label">dificuldades mapeadas:</span> <div class="value">${dificuldadesAtivas}</div></div>
            <div><span class="label">neuro/tea/tdah:</span> <div class="value">${formData.diagnosticoNeuro?.possui || 'não'}</div></div>
            <div style="grid-column: span 3;"><span class="label">tratamentos:</span> <div class="value">${tratamentos} ${formData.tratamentoEspecializado?.outro ? '| ' + formData.tratamentoEspecializado.outro : ''}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">4. Contatos de Emergência</div>
          <div class="grid">
            ${formData.contatos?.length > 0 ? formData.contatos.map(c => `
              <div>
                <span class="label">nome:</span> <div class="value">${c.nome || '---'}</div>
                <span class="label">telefone:</span> <div class="value">${c.telefone || '---'}</div>
              </div>
            `).join('') : '<div><div class="value">nenhum contato registrado</div></div>'}
          </div>
        </div>

        <div class="assinatura-wrapper">
          <div class="campo-assinatura">
            <span class="assinatura-label">Responsável Legal</span>
            <span class="assinatura-sub">assinatura e documento</span>
          </div>
          <div class="campo-assinatura">
            <span class="assinatura-label">Enfermeiro(a) Responsável</span>
            <span class="assinatura-sub">carimbo e coren</span>
          </div>
        </div>

        <div class="footer-note">
          Este prontuário é um documento confidencial - Gerado em ${new Date().toLocaleDateString('pt-br')} às ${new Date().toLocaleTimeString('pt-br')}
        </div>

        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 700);
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
};