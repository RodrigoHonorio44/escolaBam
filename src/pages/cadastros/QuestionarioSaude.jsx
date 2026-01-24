import React from 'react';
import { 
  ClipboardCheck, HeartPulse, ShieldCheck, AlertTriangle, 
  Save, Loader2, Search, CheckCircle2, Activity, Printer 
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
    const nome = formData.alunoNome.trim();
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
    win.document.write(`
      <html>
        <head>
          <title>ficha médica - ${formData.alunoNome}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; border: 1px solid #eee; padding: 15px; border-radius: 10px; }
            .section-title { font-weight: bold; font-size: 12px; color: #2563eb; margin-bottom: 10px; border-bottom: 1px solid #eee; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .label { font-weight: bold; font-size: 11px; color: #666; }
            .value { font-size: 12px; margin-bottom: 5px; text-transform: capitalize; }
            .alerta { color: red; font-weight: bold; }
            .assinatura { margin-top: 50px; display: flex; justify-content: space-between; }
            .campo-assinatura { border-top: 1px solid #000; width: 45%; text-align: center; padding-top: 5px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header"><h2>FICHA MÉDICA ESCOLAR</h2></div>
          <div class="section">
            <div class="section-title">identificação</div>
            <div class="grid">
              <div><span class="label">nome:</span> <div class="value">${formData.alunoNome}</div></div>
              <div><span class="label">turma:</span> <div class="value">${formData.turma || '---'}</div></div>
            </div>
          </div>
          <div class="assinatura">
            <div class="campo-assinatura">assinatura do responsável</div>
            <div class="campo-assinatura">coordenação escolar</div>
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
        {/* HEADER */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 text-white p-5 rounded-3xl shadow-lg shadow-blue-100">
              <ClipboardCheck size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Ficha Médica <span className="text-blue-600">Escolar</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronização com Prontuário de Enfermagem</p>
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
            <SectionCard icon={<Search size={18}/>} title="Identificação e Social">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={campoBuscaRef}>
                  <InputBlock label="Nome do Aluno (Busca)">
                    <input 
                      className="input-premium" 
                      style={{ textTransform: 'capitalize' }}
                      value={formData.alunoNome} 
                      onChange={(e) => { 
                        handleChange('alunoNome', e.target.value); 
                        buscarSugestoes(e.target.value); 
                      }} 
                      placeholder="ex: caio giromba..." 
                    />
                  </InputBlock>
                  {mostrarSugestoes && sugestoes.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                      {sugestoes.map((p) => (
                        <div key={p.id} onClick={() => selecionarPaciente(p)} className="p-4 hover:bg-blue-50 cursor-pointer text-[10px] font-black uppercase border-b border-slate-50 flex justify-between items-center">
                          {/* Exibe formatado com Iniciais Maiúsculas */}
                          <span style={{ textTransform: 'capitalize' }}>{p.nomeBusca || p.nome}</span>
                          <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded-md text-[8px]">{p.turma}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <InputBlock label="O Aluno vive com:">
                  <select className="input-premium" value={formData.viverCom} onChange={(e) => handleChange('viverCom', e.target.value)}>
                    <option value="">selecione...</option>
                    <option value="pais">pais</option>
                    <option value="mãe">só mãe</option>
                    <option value="pai">só pai</option>
                    <option value="avós">avós</option>
                    <option value="outros">outros</option>
                  </select>
                </InputBlock>
              </div>
            </SectionCard>

            <SectionCard icon={<HeartPulse size={18}/>} title="Histórico Clínico">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-600 uppercase">Diabetes?</span>
                    <div className="flex gap-2">
                      {['sim', 'não'].map(opt => (
                        <button key={opt} type="button" onClick={() => handleChange('diabetes.possui', opt)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${formData.diabetes.possui === opt ? 'bg-blue-600 text-white' : 'bg-white text-slate-300'}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  {formData.diabetes.possui === 'sim' && (
                    <div className="flex gap-2 mt-3 animate-in slide-in-from-top-1">
                      {['tipo 1', 'tipo 2'].map(tipo => (
                        <button key={tipo} type="button" onClick={() => handleChange('diabetes.tipo', tipo)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${formData.diabetes.tipo === tipo ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-400'}`}>{tipo}</button>
                      ))}
                    </div>
                  )}
                </div>

                <RadioGroup label="Desmaio ou Convulsão?" value={formData.desmaioConvulsao} onChange={(v) => handleChange('desmaioConvulsao', v)} />
                <ToggleInput label="Alergias" value={formData.alergias} onChange={(v) => handleChange('alergias', v)} />
                <ToggleInput label="Medicação Contínua" value={formData.medicacaoContinua} onChange={(v) => handleChange('medicacaoContinua', v)} />
                <ToggleInput label="Epilepsia" value={formData.epilepsia} onChange={(v) => handleChange('epilepsia', v)} />
                <ToggleInput label="Problemas Respiratórios" value={formData.asma} onChange={(v) => handleChange('asma', v)} />
                <ToggleInput label="TEA/TDAH/Neuro" value={formData.diagnosticoNeuro} onChange={(v) => handleChange('diagnosticoNeuro', v)} />
              </div>
            </SectionCard>

            <SectionCard icon={<Activity size={18}/>} title="Dificuldades e Mobilidade">
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries({ enxergar: 'Enxergar', falar: 'Falar', ouvir: 'Ouvir', andar: 'Andar', movimentarMembros: 'Membros' }).map(([key, label]) => (
                    <button key={key} type="button" onClick={() => handleDificuldadeToggle(key)} 
                      className={`p-3 rounded-2xl border-2 text-[9px] font-black uppercase flex flex-col items-center gap-2 transition-all ${formData.dificuldades[key] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                      <CheckCircle2 size={16} className={formData.dificuldades[key] ? 'text-blue-500' : 'text-slate-200'} />
                      {label}
                    </button>
                  ))}
                </div>
                <RadioGroup label="Dificuldade para Caminhar?" value={formData.caminharDificuldade} onChange={(v) => handleChange('caminharDificuldade', v)} />
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <SectionCard icon={<ShieldCheck size={18}/>} title="Prevenção e Vacina">
              <InputBlock label="Status Vacinal">
                <select className="input-premium" value={formData.vacinaStatus} onChange={(e) => handleChange('vacinaStatus', e.target.value)}>
                  <option value="">selecione...</option>
                  <option value="atualizado">atualizado</option>
                  <option value="atrasado">atrasado</option>
                </select>
              </InputBlock>
            </SectionCard>

            <SectionCard icon={<AlertTriangle size={18}/>} title="Contatos de Emergência">
              <div className="space-y-4">
                {formData.contatos.map((contato, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <input 
                      placeholder="nome do contato" 
                      className="input-premium !py-2" 
                      style={{ textTransform: 'capitalize' }}
                      value={contato.nome} 
                      onChange={(e) => handleContactChange(idx, 'nome', e.target.value)} 
                    />
                    <input 
                      placeholder="telefone" 
                      className="input-premium !py-2" 
                      value={contato.telefone} 
                      onChange={(e) => handleContactChange(idx, 'telefone', e.target.value)} 
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </form>

      <style>{`
        .input-premium { 
          width: 100%; 
          padding: 0.9rem 1.2rem; 
          background-color: #fff; 
          border-radius: 16px; 
          font-weight: 700; 
          font-size: 0.75rem; 
          border: 2px solid #f1f5f9; 
          outline: none; 
          transition: all 0.3s; 
        }
        .input-premium:focus { 
          border-color: #3b82f6; 
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); 
        }
        /* Força o visual das iniciais maiúsculas mas o valor real segue lowercase */
        .input-premium::placeholder { text-transform: none; }
      `}</style>
    </div>
  );
};

/* Sub-componentes internos */
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
          <button key={opt} type="button" onClick={() => onChange({ ...value, possui: opt })} className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${value.possui === opt ? 'bg-blue-600 text-white' : 'bg-white text-slate-300'}`}>{opt}</button>
        ))}
      </div>
    </div>
    {value.possui === 'sim' && (
      <input 
        className="input-premium mt-3 !py-2 !text-[10px]" 
        placeholder="especifique detalhes..." 
        value={value.detalhes} 
        onChange={(e) => onChange({ ...value, detalhes: e.target.value })} 
      />
    )}
  </div>
);

export default QuestionarioSaude;