import React, { useState } from 'react';
import { 
  Save, ArrowLeft, ClipboardPlus, Loader2, Hospital, Home, 
  Clock, Hash, UserCheck, Search, Activity, AlertTriangle,
  Briefcase, GraduationCap, Baby 
} from 'lucide-react';
import { useAtendimentoLogica } from '../../hooks/useAtendimentoLogica';
import { Toaster, toast } from 'react-hot-toast';
import AlertaHistoricoPCD from '../../components/AlertaHistoricoPCD';

const AtendimentoEnfermagem = ({ user, onVoltar, onVerHistorico, onAbrirPastaDigital }) => {
  const { 
    formData, updateField, loading, 
    configUI, setConfigUI, 
    sugestoes, mostrarSugestoes, setMostrarSugestoes,
    selecionarPaciente, salvarAtendimento, temCadastro 
  } = useAtendimentoLogica(user);

  const [erroNome, setErroNome] = useState(false);
  const [isGestante, setIsGestante] = useState(false); // Inicia como falso (aluno/homem)

  // --- MAPEAMENTO DE SURTOS ---
  const GRUPOS_RISCO = {
    "gastrointestinal": ["dor abdominal", "náusea/vômito", "diarreia", "enjoo"],
    "respiratório": ["febre", "sintomas gripais", "dor de garganta", "tosse"],
    "infestação": ["coceira intensa", "pediculose", "lesões de pele"],
    "ansiedade": ["crise de ansiedade", "falta de ar"]
  };

  const identificarGrupoRisco = (queixa) => {
    if (!queixa) return null;
    const queixaLower = queixa.toLowerCase();
    return Object.keys(GRUPOS_RISCO).find(grupo => 
      GRUPOS_RISCO[grupo].includes(queixaLower)
    );
  };

  const grupoDetectado = identificarGrupoRisco(formData.motivoAtendimento);

  // --- FUNÇÕES DE FORMATAÇÃO E NORMALIZAÇÃO ---
  
  const formatarCapitalize = (texto) => {
    if (!texto) return "";
    return texto.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const formatarNomeExibicao = (nome) => {
    if (!nome) return "";
    let nomeFormatado = formatarCapitalize(nome);
    return nomeFormatado
      .replace(/\bR\s+S\b/gi, "R S")
      .replace(/\bRs\b/gi, "R S");
  };

  const validarNomeCompleto = (valor) => {
    const nomeLimpo = valor.trim();
    const partes = nomeLimpo.split(/\s+/).filter(p => p.length > 0);
    const valido = partes.length >= 2;
    setErroNome(!valido && nomeLimpo.length > 0);
    return valido;
  };

  const lidarSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const nomeNormalizado = formData.nomePaciente.toLowerCase().trim();

    if (!validarNomeCompleto(nomeNormalizado)) {
      setErroNome(true);
      toast.error("nome e sobrenome obrigatórios!", { id: 'trava-nome' });
      return;
    }

    try {
      const sucesso = await salvarAtendimento(e);
      if (sucesso) {
        if (configUI.perfilPaciente === 'funcionario' && typeof onAbrirPastaDigital === 'function') {
          onAbrirPastaDigital({
            ...formData,
            nomePaciente: nomeNormalizado,
            pacienteId: formData.pacienteId || nomeNormalizado.replace(/\s+/g, '-')
          });
        } else {
          onVoltar();
        }
      }
    } catch (error) {
      console.error("erro ao processar submissão:", error);
    }
  };

  const queixasComuns = [
    "febre", "sintomas gripais", "dor de garganta", "tosse",
    "dor abdominal", "náusea/vômito", "diarreia", "enjoo",
    "coceira intensa", "pediculose", "lesões de pele",
    "crise de ansiedade", "falta de ar", "dor de cabeça", 
    "pequeno curativo", "trauma/queda", "hipertensão", 
    "hipoglicemia", "cólica menstrual", "enxaqueca","dor muscular","hiperglicemia","outros"
  ];

  const opcoesEncaminhamentoAluno = [
    "volta para sala de aula", "encaminhado para casa", "orientação educacional",
    "hospital conde modesto", "hospital che guevara", "upa santa rita", "upa inoã"
  ];

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden font-sans antialiased text-left">
      <Toaster position="top-right" />
      
      <div className="bg-[#0A1629] p-8 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg"><ClipboardPlus size={24} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">ficha de <span className="text-blue-500">atendimento</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">sistema de enfermagem escolar</p>
          </div>
        </div>
        <div className="flex gap-3">
          <AlertaHistoricoPCD 
            formData={formData} 
            temCadastro={temCadastro} 
            onVerHistorico={onVerHistorico} 
          />
          <button onClick={onVoltar} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black transition-all border border-white/10 flex items-center gap-2 tracking-widest text-white">
            <ArrowLeft size={14} /> voltar
          </button>
        </div>
      </div>

      <form onSubmit={lidarSubmit} className="p-8 md:p-12 space-y-10">
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 font-sans">
          <div className="bg-slate-900 px-6 py-3 rounded-2xl border-2 border-blue-500/30 flex items-center gap-3">
            <Hash size={18} className="text-blue-400" />
            <span className="text-blue-400 font-black tracking-widest text-base lowercase italic tabular-nums">{formData.baenf}</span>
          </div>
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Clock size={18} className="text-slate-600" />
            <span className="text-slate-700 font-bold text-sm lowercase italic tabular-nums">início: {formData.horario}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto font-sans">
          <div className="bg-slate-100 p-2 rounded-[25px] flex shadow-inner">
            <button type="button" onClick={() => setConfigUI({...configUI, perfilPaciente: 'aluno'})} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${configUI.perfilPaciente === 'aluno' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>
              <GraduationCap size={18} /> aluno
            </button>
            <button type="button" onClick={() => setConfigUI({...configUI, perfilPaciente: 'funcionario'})} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${configUI.perfilPaciente === 'funcionario' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>
              <Briefcase size={18} /> funcionário
            </button>
          </div>
          <div className="bg-slate-100 p-2 rounded-[25px] flex shadow-inner">
            <button type="button" onClick={() => setConfigUI({...configUI, tipoAtendimento: 'local'})} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${configUI.tipoAtendimento === 'local' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>
              <Home size={18} /> local
            </button>
            <button type="button" onClick={() => setConfigUI({...configUI, tipoAtendimento: 'remocao'})} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-xs transition-all tracking-widest ${configUI.tipoAtendimento === 'remocao' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>
              <Hospital size={18} /> remoção
            </button>
          </div>
        </div>

        <div className="space-y-6 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-2 space-y-2 relative">
              <label className={`text-[10px] font-black uppercase ml-2 tracking-widest flex items-center gap-2 ${erroNome ? 'text-red-500' : 'text-slate-500'}`}>
                <Search size={12} className={erroNome ? 'text-red-500' : 'text-blue-500'}/> 
                nome completo * {erroNome && <span className="lowercase italic font-bold">(insira o sobrenome)</span>}
              </label>
              <input 
                type="text" 
                required 
                placeholder="ex: rodrigo honorio silva" 
                className={`w-full border-2 rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all
                  ${erroNome ? 'bg-red-50 border-red-500 focus:ring-red-200' : 'bg-slate-50 border-transparent focus:ring-blue-500'}`} 
                value={formatarNomeExibicao(formData.nomePaciente)} 
                onChange={(e) => {
                  const val = e.target.value.toLowerCase();
                  updateField('nomePaciente', val);
                  validarNomeCompleto(val);
                  setMostrarSugestoes(true);
                }} 
              />
              {mostrarSugestoes && sugestoes.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {sugestoes.map((p) => (
                    <div key={p.id} onClick={() => { 
                      selecionarPaciente(p); 
                      setErroNome(false); 
                      setMostrarSugestoes(false); 
                    }} className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-1 text-left">
                      <p className="text-xs font-black text-slate-800 italic">{formatarNomeExibicao(p.nomePaciente || p.nome || p.nomeBusca)}</p>
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 lowercase italic">
                        <span>{p.turma || p.cargo}</span> <span className="bg-slate-100 px-2 py-0.5 rounded text-blue-600">{p.dataNascimento}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">nascimento</label>
                <button type="button" onClick={() => setConfigUI({...configUI, naoSabeDataNasc: !configUI.naoSabeDataNasc})} className={`text-[9px] font-black px-2 py-1 rounded-lg transition-all ${configUI.naoSabeDataNasc ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {configUI.naoSabeDataNasc ? 'soube a data' : 'não sei'}
                </button>
              </div>
              <input type="date" disabled={configUI.naoSabeDataNasc} className={`w-full rounded-2xl px-5 py-4 text-sm font-bold outline-none border-none tabular-nums ${configUI.naoSabeDataNasc ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-900'}`} value={formData.dataNascimento} onChange={(e) => updateField('dataNascimento', e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest block">idade *</label>
              <input type="number" required readOnly={!configUI.naoSabeDataNasc} placeholder={configUI.naoSabeDataNasc ? "manual" : "auto"} className={`w-full border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums ${!configUI.naoSabeDataNasc ? 'bg-slate-100 text-blue-600' : 'bg-orange-50 text-orange-700 ring-2 ring-orange-200'}`} value={formData.idade} onChange={(e) => updateField('idade', e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest block">sexo</label>
              <select required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none lowercase" value={formData.sexo} onChange={(e) => updateField('sexo', e.target.value)}>
                <option value="">...</option>
                <option value="masculino">masculino</option>
                <option value="feminino">feminino</option>
              </select>
            </div>
          </div>

          {/* BLOCO INTELIGENTE DE GESTAÇÃO - ATIVADO MANUALMENTE */}
          <div className="md:col-span-6 space-y-4">
            <button
              type="button"
              onClick={() => {
                const novoEstado = !isGestante;
                setIsGestante(novoEstado);
                updateField('gestante', novoEstado ? 'sim' : 'nao');
              }}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 
                ${isGestante 
                  ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-md' 
                  : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
            >
              <Baby size={18} />
              {isGestante ? 'paciente gestante' : 'clique se for gestante'}
            </button>

            {isGestante && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-pink-50/50 rounded-[30px] border-2 border-pink-100 animate-in zoom-in-95 duration-200">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-pink-600 uppercase ml-2 tracking-widest block">dum (última menstruação)</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border-none rounded-xl px-5 py-3 text-sm font-bold text-pink-900 outline-none focus:ring-2 focus:ring-pink-300" 
                    value={formData.dum || ''} 
                    onChange={(e) => updateField('dum', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-pink-600 uppercase ml-2 tracking-widest block">semanas de gestação</label>
                  <input 
                    type="number" 
                    placeholder="00"
                    className="w-full bg-white border-none rounded-xl px-5 py-3 text-sm font-bold text-pink-900 outline-none focus:ring-2 focus:ring-pink-300" 
                    value={formData.semanasGestacao || ''} 
                    onChange={(e) => updateField('semanasGestacao', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-pink-600 uppercase ml-2 tracking-widest block">fez pré-natal?</label>
                  <select 
                    className="w-full bg-white border-none rounded-xl px-5 py-3 text-sm font-bold text-pink-900 outline-none focus:ring-2 focus:ring-pink-300 lowercase"
                    value={formData.preNatal || 'nao'} 
                    onChange={(e) => updateField('preNatal', e.target.value.toLowerCase())}
                  >
                    <option value="nao">não</option>
                    <option value="sim">sim</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest block">etnia *</label>
              <select required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none lowercase" value={formData.etnia} onChange={(e) => updateField('etnia', e.target.value)}>
                <option value="">...</option>
                <option value="branca">branca</option>
                <option value="preta">preta</option>
                <option value="parda">parda</option>
                <option value="amarela">amarela</option>
                <option value="indígena">indígena</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">peso (kg)</label>
                <button type="button" onClick={() => setConfigUI({...configUI, naoSabePeso: !configUI.naoSabePeso})} className={`text-[8px] font-black px-1.5 py-0.5 rounded-md transition-all ${configUI.naoSabePeso ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {configUI.naoSabePeso ? 'soube' : 'não sei'}
                </button>
              </div>
              <input 
                type="number" 
                step="0.1"
                disabled={configUI.naoSabePeso} 
                placeholder={configUI.naoSabePeso ? "n/i" : "00.0"} 
                className={`w-full border-none rounded-2xl px-5 py-4 text-sm font-bold ${configUI.naoSabePeso ? 'bg-slate-200 text-slate-400' : 'bg-slate-50 text-slate-800'}`} 
                value={formData.peso} 
                onChange={(e) => updateField('peso', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">altura (m)</label>
                <button type="button" onClick={() => setConfigUI({...configUI, naoSabeAltura: !configUI.naoSabeAltura})} className={`text-[8px] font-black px-1.5 py-0.5 rounded-md transition-all ${configUI.naoSabeAltura ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {configUI.naoSabeAltura ? 'soube' : 'não sei'}
                </button>
              </div>
              <input 
                type="number" 
                step="0.01"
                disabled={configUI.naoSabeAltura} 
                placeholder={configUI.naoSabeAltura ? "n/i" : "0.00"} 
                className={`w-full border-none rounded-2xl px-5 py-4 text-sm font-bold ${configUI.naoSabeAltura ? 'bg-slate-200 text-slate-400' : 'bg-slate-50 text-slate-800'}`} 
                value={formData.altura} 
                onChange={(e) => updateField('altura', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest block">data atend.</label>
              <input type="date" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums" value={formData.data} onChange={(e) => updateField('data', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest block">horário</label>
              <input type="time" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums" value={formData.horario} onChange={(e) => updateField('horario', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase ml-2 italic tracking-widest block">{configUI.perfilPaciente === 'aluno' ? 'turma *' : 'cargo *'}</label>
              <input 
                type="text" 
                required 
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold italic" 
                value={formatarCapitalize(configUI.perfilPaciente === 'aluno' ? formData.turma : formData.cargo)} 
                onChange={(e) => updateField(configUI.perfilPaciente === 'aluno' ? 'turma' : 'cargo', e.target.value.toLowerCase())} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-500 uppercase ml-2 italic tracking-widest block">temperatura *</label>
              <input type="number" step="0.1" required placeholder="00.0" className="w-full bg-red-50 border-none rounded-2xl px-5 py-4 text-sm font-bold tabular-nums" value={formData.temperatura} onChange={(e) => updateField('temperatura', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-orange-500 uppercase ml-2 tracking-widest block">alergia?</label>
              <select className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold lowercase" value={formData.alunoPossuiAlergia} onChange={(e) => updateField('alunoPossuiAlergia', e.target.value.toLowerCase())}>
                <option value="não">não</option>
                <option value="sim">sim</option>
              </select>
            </div>
          </div>
          {formData.alunoPossuiAlergia === 'sim' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
              <label className="text-[10px] font-black text-red-600 uppercase ml-2 italic tracking-widest block">qual alergia? *</label>
              <input 
                type="text" 
                required 
                className="w-full bg-red-50 border-2 border-red-200 rounded-2xl px-5 py-4 text-sm font-bold italic" 
                value={formatarCapitalize(formData.qualAlergia)} 
                onChange={(e) => updateField('qualAlergia', e.target.value.toLowerCase())} 
              />
            </div>
          )}
        </div>

        <div className="pt-10 border-t border-slate-100">
          {configUI.tipoAtendimento === 'local' ? (
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-slate-800">
                <Activity size={18} className="text-emerald-500" />
                <span className="font-black uppercase italic tracking-tighter text-lg">atendimento na unidade</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest block">motivo principal *</label>
                  <select 
                    required 
                    className={`w-full border-none rounded-2xl px-5 py-4 text-sm font-bold lowercase transition-all ${grupoDetectado ? 'bg-amber-50 ring-2 ring-amber-500/20' : 'bg-blue-50'}`} 
                    value={formData.motivoAtendimento} 
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase();
                      updateField('motivoAtendimento', val);
                      updateField('grupoRisco', identificarGrupoRisco(val) || 'nenhum');
                    }}
                  >
                    <option value="">selecione...</option>
                    {queixasComuns.map(q => <option key={q} value={q.toLowerCase()}>{q.toLowerCase()}</option>)}
                  </select>

                  {formData.motivoAtendimento === 'hipertensão' && (
                    <div className="mt-4 p-4 bg-red-50 rounded-2xl border-2 border-red-100 animate-in zoom-in-95 duration-200">
                      <label className="text-[10px] font-black text-red-600 uppercase ml-1 tracking-widest block mb-2 italic">pressão arterial (pa) *</label>
                      <input 
                        type="text"
                        required
                        placeholder="ex: 120x80"
                        className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold tabular-nums shadow-sm outline-none focus:ring-2 focus:ring-red-400"
                        value={formData.pa}
                        onChange={(e) => updateField('pa', e.target.value.toLowerCase())}
                      />
                    </div>
                  )}

                  {formData.motivoAtendimento === 'hipoglicemia' && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-2xl border-2 border-orange-100 animate-in zoom-in-95 duration-200">
                      <label className="text-[10px] font-black text-orange-600 uppercase ml-1 tracking-widest block mb-2 italic">glicemia (hgt) *</label>
                      <div className="relative">
                        <input 
                          type="number"
                          required
                          placeholder="000"
                          className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold tabular-nums shadow-sm outline-none focus:ring-2 focus:ring-orange-400"
                          value={formData.hgt}
                          onChange={(e) => updateField('hgt', e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-300 uppercase">mg/dl</span>
                      </div>
                    </div>
                  )}

                  {grupoDetectado && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500 rounded-xl mt-2 animate-pulse shadow-md">
                      <AlertTriangle size={14} className="text-white" />
                      <span className="text-[9px] font-black text-white uppercase italic tracking-tighter">
                        atenção: risco de surto {grupoDetectado}!
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest block">procedimentos *</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-blue-50/50 border-none rounded-2xl px-5 py-4 text-sm font-bold italic" 
                    value={formatarCapitalize(formData.procedimentos)} 
                    onChange={(e) => updateField('procedimentos', e.target.value.toLowerCase())} 
                  />
                </div>
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-600 uppercase ml-2 tracking-widest block">medicação administrada</label>
                    <input 
                      type="text" 
                      placeholder="ex: paracetamol 500mg..." 
                      className="w-full bg-emerald-50 border-none rounded-2xl px-5 py-4 text-sm font-bold italic" 
                      value={formatarCapitalize(formData.medicacao)} 
                      onChange={(e) => updateField('medicacao', e.target.value.toLowerCase())} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-600 uppercase ml-2 italic tracking-widest block">encaminhamento/destino</label>
                    <select className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold lowercase" value={formData.destinoHospital} onChange={(e) => updateField('destinoHospital', e.target.value.toLowerCase())}>
                      <option value="">não houve</option>
                      {opcoesEncaminhamentoAluno.map(opt => <option key={opt} value={opt.toLowerCase()}>{opt.toLowerCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest block">detalhamento da queixa / observações</label>
                  <textarea rows="3" className="w-full bg-blue-50/50 border-none rounded-2xl px-5 py-4 text-sm font-bold italic resize-none outline-none" placeholder="descreva o quadro clínico aqui..." value={formData.observacoes} onChange={(e) => updateField('observacoes', e.target.value.toLowerCase())} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle size={18} />
                <span className="font-black uppercase italic tracking-tighter text-lg">remoção / encaminhamento externo</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-orange-600 uppercase ml-2 tracking-widest block">unidade de destino</label>
                  <select required className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold lowercase" value={formData.destinoHospital} onChange={(e) => updateField('destinoHospital', e.target.value.toLowerCase())}>
                    <option value="">selecione...</option>
                    <option value="hospital conde modesto leal">hospital conde modesto leal</option>
                    <option value="upa inoã">upa inoã</option>
                    <option value="upa santa rita">upa santa rita</option>
                    <option value="samu / resgate">samu / resgate</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-orange-600 uppercase ml-2 tracking-widest block">motivo da remoção</label>
                  <input type="text" required placeholder="ex: suspeita de fratura..." className="w-full bg-orange-50 border-none rounded-2xl px-5 py-4 text-sm font-bold italic" value={formatarCapitalize(formData.motivoEncaminhamento)} onChange={(e) => updateField('motivoEncaminhamento', e.target.value.toLowerCase())} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-orange-600 uppercase ml-2 tracking-widest block">observações da remoção</label>
                  <textarea rows="2" className="w-full bg-orange-50/50 border-none rounded-2xl px-5 py-4 text-sm font-bold italic resize-none outline-none" value={formData.obsEncaminhamento} onChange={(e) => updateField('obsEncaminhamento', e.target.value.toLowerCase())} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 bg-slate-900 px-8 py-5 rounded-[25px] border-2 border-blue-500/20 w-full md:w-auto shadow-xl">
            <div className="bg-blue-600 p-2.5 rounded-xl"><UserCheck size={22} className="text-white" /></div>
            <div className="flex flex-col">
              <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mb-0.5">assinatura digital baenf</span>
              <p className="text-white font-black text-lg italic leading-none tracking-tight">{formatarNomeExibicao(user?.nome) || 'profissional'}</p>
              <span className="text-emerald-400 text-[10px] font-bold lowercase tracking-[0.1em] mt-1 italic">
                {user?.cargo?.toLowerCase() || 'enfermagem'} — reg: {user?.registroProfissional}
              </span>
            </div>
          </div>
          <button type="submit" disabled={loading} className={`w-full md:w-auto px-16 py-7 rounded-[35px] font-black uppercase italic tracking-[0.15em] text-xs transition-all shadow-2xl flex items-center justify-center gap-4 ${configUI.tipoAtendimento === 'local' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'} text-white disabled:opacity-50`}>
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? 'salvando...' : 'finalizar atendimento'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AtendimentoEnfermagem;