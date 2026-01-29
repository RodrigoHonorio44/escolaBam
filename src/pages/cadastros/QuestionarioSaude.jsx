import React from 'react';
import { 
  ClipboardCheck, HeartPulse, ShieldCheck, AlertTriangle, 
  Save, Loader2, CheckCircle2, Activity, Printer,
  Baby, Stethoscope, Users, Accessibility, EyeOff, Dumbbell
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useQuestionarioSaude } from '../../hooks/useQuestionarioSaude';

const QuestionarioSaude = ({ onSucesso }) => {
  const {
    formData,
    loading,
    fetching,
    sugestoes,
    mostrarSugestoes,
    campoBuscaRef,
    handleChange,
    handleContactChange,
    handleDificuldadeToggle,
    buscarSugestoes,
    selecionarPaciente,
    handleSubmit
  } = useQuestionarioSaude(onSucesso);

  const validarESalvar = (e) => {
    e.preventDefault();
    const nome = formData.alunoNome?.trim() || "";
    const temSobrenome = nome.includes(" ") && nome.split(/\s+/).filter(part => part.length > 0).length >= 2;

    if (!temSobrenome) {
      alert("por favor, insira o nome completo do aluno (nome e sobrenome).");
      return;
    }
    handleSubmit(e);
  };

  const imprimirDocumento = () => {
    if (!formData.alunoNome) return;
    const win = window.open('', '_blank');
    
    const dificuldadesAtivas = Object.entries(formData.dificuldades || {})
      .filter(([_, value]) => value === true)
      .map(([key]) => key)
      .join(', ') || 'nenhuma informada';

    const auxilioLocomocao = Object.entries(formData.mobilidadeAuxilio || {})
      .filter(([_, value]) => value === true)
      .map(([key]) => {
        const labels = {
          cadeirante: 'Cadeira de Rodas',
          muletas: 'Muletas/Andador',
          ortese: 'Órteses/Próteses',
          limitada: 'Locomoção Limitada'
        };
        return labels[key] || key;
      })
      .join(', ') || 'não informado';

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
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; color: #1e293b; line-height: 1.4; font-size: 10px; background: #fff; }
            .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .header h2 { margin: 0; font-size: 16px; font-weight: 900; text-transform: uppercase; }
            .section { margin-bottom: 12px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; page-break-inside: avoid; }
            .section-title { font-weight: 900; font-size: 9px; color: #2563eb; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
            .label { font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 8px; display: block; }
            .value { font-size: 10px; font-weight: 600; margin-bottom: 4px; text-transform: capitalize; color: #0f172a; }
            .pcd-badge { background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 900; text-transform: uppercase; margin-left: 10px; }
            .assinatura-wrapper { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            .campo-assinatura { border-top: 1.5px solid #000; text-align: center; padding-top: 8px; }
            .assinatura-label { font-size: 9px; font-weight: 900; text-transform: uppercase; display: block; }
            .assinatura-sub { font-size: 8px; color: #64748b; font-weight: 700; text-transform: lowercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Ficha Médica Escolar e Prontuário</h2>
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; margin-top: 5px;">Departamento de Saúde e Bem-Estar | R S</div>
          </div>

          <div class="section">
            <div class="section-title">1. Identificação do Aluno ${formData.pcdStatus?.possui === 'sim' ? '<span class="pcd-badge">aluno pcd</span>' : ''}</div>
            <div class="grid">
              <div style="grid-column: span 2;"><span class="label">nome completo:</span> <div class="value">${formData.alunoNome}</div></div>
              <div><span class="label">turma:</span> <div class="value">${formData.turma || '---'}</div></div>
              <div><span class="label">etnia:</span> <div class="value">${formData.etnia || '---'}</div></div>
              <div><span class="label">biometria:</span> <div class="value">${formData.peso || '--'}kg / ${formData.altura || '--'}m</div></div>
              <div><span class="label">viver com:</span> <div class="value">${formData.viverCom || '---'}</div></div>
              <div><span class="label">parto:</span> <div class="value">${formData.tipoParto || '---'}</div></div>
              <div><span class="label">atestado físico:</span> <div class="value">${formData.atestadoAtividadeFisica || 'pendente'}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">2. Histórico Clínico e Diagnósticos</div>
            <div class="grid">
              <div><span class="label">pcd / esp.:</span> <div class="value">${formData.pcdStatus?.possui === 'sim' ? (formData.pcdStatus.detalhes || formData.pcdStatus.qual) : 'não'}</div></div>
              <div><span class="label">alergias:</span> <div class="value">${formData.alergias?.possui === 'sim' ? (formData.alergias.detalhes || formData.alergias.qual) : 'não'}</div></div>
              <div><span class="label">cardíaco:</span> <div class="value">${formData.doencasCardiacas?.possui === 'sim' ? (formData.doencasCardiacas.detalhes || formData.doencasCardiacas.qual) : 'não'}</div></div>
              <div><span class="label">cirurgias:</span> <div class="value">${formData.cirurgias?.possui === 'sim' ? (formData.cirurgias.detalhes || formData.cirurgias.qual) : 'não'}</div></div>
              <div><span class="label">diabetes:</span> <div class="value">${formData.diabetes?.possui === 'sim' ? formData.diabetes.tipo : 'não'}</div></div>
              <div><span class="label">medicação:</span> <div class="value">${formData.medicacaoContinua?.possui === 'sim' ? (formData.medicacaoContinua.detalhes || formData.medicacaoContinua.qual) : 'não'}</div></div>
              <div style="grid-column: span 2;"><span class="label">outras doenças:</span> <div class="value">${formData.historicoDoencas?.possui === 'sim' ? (formData.historicoDoencas.detalhes || formData.historicoDoencas.qual) : 'não'}</div></div>
              <div><span class="label">violência/abuso:</span> <div class="value">${formData.historicoViolencia?.possui === 'sim' ? formData.historicoViolencia.detalhes : 'não'}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">3. Desenvolvimento e Mobilidade</div>
            <div class="grid">
              <div style="grid-column: span 1;"><span class="label">dificuldades:</span> <div class="value">${dificuldadesAtivas}</div></div>
              <div style="grid-column: span 2;"><span class="label">auxílios de locomoção:</span> <div class="value">${auxilioLocomocao}</div></div>
              <div style="grid-column: span 3; margin-top: 5px;"><span class="label">tratamentos:</span> <div class="value">${tratamentos} ${formData.tratamentoEspecializado?.outro ? '| ' + formData.tratamentoEspecializado.outro : ''}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">4. Contatos de Emergência</div>
            <div class="grid">
              ${formData.contatos?.map(c => `
                <div>
                  <span class="label">contato:</span> <div class="value">${c.nome || '---'}</div>
                  <span class="label">fone:</span> <div class="value">${c.telefone || '---'}</div>
                </div>
              `).join('') || '<div class="value">nenhum registrado</div>'}
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

          <div style="margin-top: 30px; text-align: center; font-size: 7px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">
            Gerado em ${new Date().toLocaleDateString('pt-br')} às ${new Date().toLocaleTimeString('pt-br')} | SISTEMA R S
          </div>

          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 bg-[#FBFDFF] min-h-screen text-left">
      <Toaster position="top-right" />
      
      <form onSubmit={validarESalvar} className="space-y-8">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 text-white p-5 rounded-3xl shadow-lg shadow-blue-100">
              <ClipboardCheck size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Ficha Médica <span className="text-blue-600">Escolar</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronização R S - Prontuário de Enfermagem</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button type="button" onClick={imprimirDocumento} className="bg-white text-slate-700 border-2 border-slate-100 px-6 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all">
              <Printer size={18} /> Imprimir
            </button>
            <button type="submit" disabled={loading || fetching} className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl disabled:bg-slate-300">
              {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Salvar Prontuário
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <SectionCard icon={<Users size={18}/>} title="Identificação e Social">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative md:col-span-2" ref={campoBuscaRef}>
                  <InputBlock label="Nome do Aluno (Busca)">
                    <input 
                      className="input-premium" 
                      style={{ textTransform: 'capitalize' }}
                      value={formData.alunoNome} 
                      onChange={(e) => { 
                        handleChange('alunoNome', e.target.value.toLowerCase()); 
                        buscarSugestoes(e.target.value); 
                      }} 
                      placeholder="ex: maia sales andrade..." 
                    />
                  </InputBlock>
                  {mostrarSugestoes && sugestoes.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                      {sugestoes.map((p) => (
                        <div key={p.id} onClick={() => selecionarPaciente(p)} className="p-4 hover:bg-blue-50 cursor-pointer text-[10px] font-black uppercase border-b border-slate-50 flex justify-between items-center">
                          <span style={{ textTransform: 'capitalize' }}>{p.nomeBusca || p.nome}</span>
                          <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded-md text-[8px]">{p.turma}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <InputBlock label="Etnia / Cor">
                  <select className="input-premium" value={formData.etnia} onChange={(e) => handleChange('etnia', e.target.value.toLowerCase())}>
                    <option value="">selecione...</option>
                    {['branca', 'preta', 'parda', 'amarela', 'indígena'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </InputBlock>

                <InputBlock label="O Aluno vive com:">
                  <select className="input-premium" value={formData.viverCom} onChange={(e) => handleChange('viverCom', e.target.value.toLowerCase())}>
                    <option value="">selecione...</option>
                    <option value="pais">pais</option>
                    <option value="mãe">só mãe</option>
                    <option value="pai">só pai</option>
                    <option value="avós">avós</option>
                    <option value="outros">outros</option>
                  </select>
                </InputBlock>

                <InputBlock label="Peso (kg)">
                  <input className="input-premium" placeholder="ex: 45.5" value={formData.peso} onChange={(e) => handleChange('peso', e.target.value)} />
                </InputBlock>

                <InputBlock label="Altura (m)">
                  <input className="input-premium" placeholder="ex: 1.60" value={formData.altura} onChange={(e) => handleChange('altura', e.target.value)} />
                </InputBlock>
              </div>
            </SectionCard>

            <SectionCard icon={<Baby size={18}/>} title="Nascimento e Desenvolvimento">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputBlock label="Tipo de Parto">
                  <select className="input-premium" value={formData.tipoParto} onChange={(e) => handleChange('tipoParto', e.target.value.toLowerCase())}>
                    <option value="">selecione...</option>
                    <option value="normal">normal</option>
                    <option value="cesária">cesária</option>
                    <option value="fórceps">fórceps</option>
                    <option value="prematuro">prematuro</option>
                  </select>
                </InputBlock>
                <ToggleInput label="Atraso Desenvolvimento?" value={formData.atrasoDesenvolvimento} onChange={(v) => handleChange('atrasoDesenvolvimento', v)} />
                <ToggleInput label="Atraso Crescimento?" value={formData.atrasoCrescimento} onChange={(v) => handleChange('atrasoCrescimento', v)} />
              </div>
            </SectionCard>

            <SectionCard icon={<HeartPulse size={18}/>} title="Histórico Clínico">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-600 uppercase">Diabetes?</span>
                    <div className="flex gap-2">
                      {['sim', 'não'].map(opt => (
                        <button key={opt} type="button" onClick={() => handleChange('diabetes.possui', opt)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${formData.diabetes?.possui === opt ? 'bg-blue-600 text-white' : 'bg-white text-slate-300'}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  {formData.diabetes?.possui === 'sim' && (
                    <div className="flex gap-2 mt-3 animate-in slide-in-from-top-1">
                      {['tipo 1', 'tipo 2'].map(tipo => (
                        <button key={tipo} type="button" onClick={() => handleChange('diabetes.tipo', tipo)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${formData.diabetes.tipo === tipo ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-400'}`}>{tipo}</button>
                      ))}
                    </div>
                  )}
                </div>
                <RadioGroup label="Desmaio ou Convulsão?" value={formData.desmaioConvulsao} onChange={(v) => handleChange('desmaioConvulsao', v)} />
                
                {/* CAMPOS ADICIONADOS PARA SINCRONIZAR COM FIREBASE */}
                <ToggleInput label="Doenças Cardíacas?" value={formData.doencasCardiacas} onChange={(v) => handleChange('doencasCardiacas', v)} />
                <ToggleInput label="Cirurgias?" value={formData.cirurgias} onChange={(v) => handleChange('cirurgias', v)} />
                <ToggleInput label="Histórico Doenças?" value={formData.historicoDoencas} onChange={(v) => handleChange('historicoDoencas', v)} />
                
                <ToggleInput label="Alergias" value={formData.alergias} onChange={(v) => handleChange('alergias', v)} />
                <ToggleInput label="Restrição Alimentar?" value={formData.restricaoAlimentar} onChange={(v) => handleChange('restricaoAlimentar', v)} />
                <ToggleInput label="Medicação Contínua" value={formData.medicacaoContinua} onChange={(v) => handleChange('medicacaoContinua', v)} />
                <ToggleInput label="Asma / Respiratório" value={formData.asma} onChange={(v) => handleChange('asma', v)} />
                <ToggleInput label="TEA/TDAH/Neuro" value={formData.diagnosticoNeuro} onChange={(v) => handleChange('diagnosticoNeuro', v)} />
                <ToggleInput label="Problema na Coluna?" value={formData.problemaColuna} onChange={(v) => handleChange('problemaColuna', v)} />
              </div>
            </SectionCard>

            <SectionCard icon={<EyeOff size={18}/>} title="Observações Psicossociais">
                <ToggleInput label="Possui histórico de violência ou abuso?" value={formData.historicoViolencia || { possui: 'não', detalhes: '' }} onChange={(v) => handleChange('historicoViolencia', v)} />
            </SectionCard>

            <SectionCard icon={<Accessibility size={18}/>} title="PCD e Acessibilidade">
                <ToggleInput label="Aluno PCD / Necessidades Especiais?" value={formData.pcdStatus || { possui: 'não', detalhes: '' }} onChange={(v) => handleChange('pcdStatus', v)} />
            </SectionCard>

            <SectionCard icon={<Stethoscope size={18}/>} title="Tratamentos Especializados">
              <div className="space-y-4">
                 <div className="flex flex-wrap gap-3">
                    {Object.entries({ psicologo: 'Psicólogo', fonoaudiologo: 'Fonoaudiólogo', terapiaOcupacional: 'T.O' }).map(([key, label]) => (
                      <button key={key} type="button" onClick={() => handleChange(`tratamentoEspecializado.${key}`, !formData.tratamentoEspecializado?.[key])}
                        className={`px-4 py-2 rounded-xl border-2 text-[9px] font-black uppercase flex items-center gap-2 transition-all ${formData.tratamentoEspecializado?.[key] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                        {label}
                      </button>
                    ))}
                 </div>
                 <InputBlock label="Outro Tratamento ou Local de Acompanhamento">
                    <input className="input-premium !py-2" style={{ textTransform: 'capitalize' }} placeholder="onde e por que realiza acompanhamento?" value={formData.tratamentoEspecializado?.outro || ""} onChange={(e) => handleChange('tratamentoEspecializado.outro', e.target.value.toLowerCase())} />
                 </InputBlock>
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <SectionCard icon={<Activity size={18}/>} title="Mobilidade e Sentidos">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries({ enxergar: 'Enxergar', falar: 'Falar', ouvir: 'Ouvir', andar: 'Andar', movimentarMembros: 'Membros' }).map(([key, label]) => (
                    <button key={key} type="button" onClick={() => handleDificuldadeToggle(key)} 
                      className={`p-3 rounded-2xl border-2 text-[9px] font-black uppercase flex flex-col items-center gap-2 transition-all ${formData.dificuldades?.[key] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                      <CheckCircle2 size={16} className={formData.dificuldades?.[key] ? 'text-blue-500' : 'text-slate-200'} />
                      {label}
                    </button>
                  ))}
                </div>

                {formData.dificuldades?.andar && (
                  <div className="p-4 bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-100 animate-in zoom-in-95">
                    <span className="text-[9px] font-black text-blue-600 uppercase mb-3 block italic">Auxílio de Locomoção:</span>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'cadeirante', label: 'Cadeirante (Cadeira de Rodas)' },
                        { id: 'muletas', label: 'Uso de Muletas/Andador' },
                        { id: 'ortese', label: 'Uso de Órteses/Próteses' },
                        { id: 'limitada', label: 'Locomoção Limitada' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleChange(`mobilidadeAuxilio.${item.id}`, !formData.mobilidadeAuxilio?.[item.id])}
                          className={`px-4 py-2 rounded-xl text-[9px] font-bold text-left transition-all flex justify-between items-center ${formData.mobilidadeAuxilio?.[item.id] ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                        >
                          {item.label}
                          {formData.mobilidadeAuxilio?.[item.id] && <CheckCircle2 size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <RadioGroup label="Caminhar Dificuldade?" value={formData.caminharDificuldade} onChange={(v) => handleChange('caminharDificuldade', v)} />
              </div>
            </SectionCard>

            <SectionCard icon={<ShieldCheck size={18}/>} title="Prevenção e Esporte">
              <div className="space-y-4">
                <InputBlock label="Status Vacinal">
                  <select className="input-premium" value={formData.vacinaStatus} onChange={(e) => handleChange('vacinaStatus', e.target.value.toLowerCase())}>
                    <option value="">selecione...</option>
                    <option value="atualizado">atualizado</option>
                    <option value="atrasado">atrasado</option>
                    <option value="sem informação">sem informação</option>
                  </select>
                </InputBlock>

                <InputBlock label="Atestado Atividades Físicas">
                  <select className="input-premium" value={formData.atestadoAtividadeFisica} onChange={(e) => handleChange('atestadoAtividadeFisica', e.target.value.toLowerCase())}>
                    <option value="">selecione...</option>
                    <option value="apto">apto (possui atestado)</option>
                    <option value="inapto">inapto (restrição médica)</option>
                    <option value="pendente">pendente / sem atestado</option>
                  </select>
                </InputBlock>
                
                <InputBlock label="Última Consulta Dentista">
                  <div className="grid grid-cols-2 gap-2">
                    {['1 mês', '3 meses', '6 meses', '1 ano'].map(periodo => (
                      <button key={periodo} type="button" onClick={() => handleChange('dentistaUltimaConsulta', periodo.toLowerCase())}
                        className={`py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${formData.dentistaUltimaConsulta === periodo.toLowerCase() ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-400'}`}>
                        {periodo}
                      </button>
                    ))}
                  </div>
                </InputBlock>
              </div>
            </SectionCard>

            <SectionCard icon={<AlertTriangle size={18}/>} title="Contatos de Emergência">
              <div className="space-y-4">
                {formData.contatos?.map((contato, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <input placeholder="nome do contato" className="input-premium !py-2" style={{ textTransform: 'capitalize' }} value={contato.nome} onChange={(e) => handleContactChange(idx, 'nome', e.target.value.toLowerCase())} />
                    <input placeholder="telefone" className="input-premium !py-2" value={contato.telefone} onChange={(e) => handleContactChange(idx, 'telefone', e.target.value)} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </form>

      <style>{`
        .input-premium { width: 100%; padding: 0.9rem 1.2rem; background-color: #fff; border-radius: 16px; font-weight: 700; font-size: 0.75rem; border: 2px solid #f1f5f9; outline: none; transition: all 0.3s; }
        .input-premium:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
      `}</style>
    </div>
  );
};

const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm relative">
    <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
      <div className="text-blue-600 bg-blue-50 p-2 rounded-xl">{icon}</div>
      <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">{title}</h2>
    </div>
    {children}
  </div>
);

const InputBlock = ({ label, children }) => (
  <div className="space-y-2 text-left">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const RadioGroup = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
    <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
    <div className="flex gap-2">
      {['sim', 'não'].map(opt => (
        <button key={opt} type="button" onClick={() => onChange(opt)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${value === opt ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-300'}`}>{opt}</button>
      ))}
    </div>
  </div>
);

const ToggleInput = ({ label, value, onChange }) => (
  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-tighter">{label}</span>
      <div className="flex gap-1">
        {['sim', 'não'].map((opt) => (
          <button key={opt} type="button" onClick={() => onChange({ ...value, possui: opt })} className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${value?.possui === opt ? 'bg-blue-600 text-white' : 'bg-white text-slate-300'}`}>{opt}</button>
        ))}
      </div>
    </div>
    {value?.possui === 'sim' && (
      <input className="input-premium mt-3 !py-2 !text-[10px]" style={{ textTransform: 'capitalize' }} placeholder="especifique detalhes..." value={value.detalhes || value.motivo || value.qual || ""} 
        onChange={(e) => { const val = e.target.value.toLowerCase(); onChange({ ...value, detalhes: val, motivo: val, qual: val }); }} />
    )}
  </div>
);

export default QuestionarioSaude;