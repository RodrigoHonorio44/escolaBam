import React, { useMemo, useState } from 'react';
import { Mail, Send, Scale, AlertCircle, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

const AbaNutricional = ({ pastas = [], darkMode }) => {
  // --- ESTADO DE PAGINAÇÃO ---
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 6;

  // --- FUNÇÃO DE NORMALIZAÇÃO PADRÃO "caio giromba" ---
  const normalizar = (str) => str?.toString().toLowerCase().trim() || "";

  const relatorioSaude = useMemo(() => {
    const sobrepeso = [];
    const obesidade = [];
    const baixoPeso = [];

    pastas.forEach(aluno => {
      const peso = parseFloat(aluno?.peso?.toString().replace(',', '.'));
      const alturaRaw = parseFloat(aluno?.altura?.toString().replace(',', '.'));

      if (!isNaN(peso) && !isNaN(alturaRaw) && peso > 0 && alturaRaw > 0) {
        const altura = alturaRaw > 3 ? alturaRaw / 100 : alturaRaw;
        const imcCalculado = peso / (altura * altura);
        const imcFormatado = imcCalculado.toFixed(1);

        let statusFinal = 'normal';
        if (imcCalculado < 18.5) statusFinal = 'baixo peso';
        else if (imcCalculado >= 25 && imcCalculado < 30) statusFinal = 'sobrepeso';
        else if (imcCalculado >= 30) statusFinal = 'obesidade';

        const dadosCompletos = { 
          ...aluno, 
          nome: normalizar(aluno.nome || "aluno sem nome"),
          imcCalculado: imcFormatado,
          turma: normalizar(aluno.turma || "n/i"),
          status: statusFinal
        };

        if (statusFinal === 'sobrepeso') sobrepeso.push(dadosCompletos);
        else if (statusFinal === 'obesidade') obesidade.push(dadosCompletos);
        else if (statusFinal === 'baixo peso') baixoPeso.push(dadosCompletos);
      }
    });

    return { 
      sobrepeso: sobrepeso.sort((a, b) => b.imcCalculado - a.imcCalculado), 
      obesidade: obesidade.sort((a, b) => b.imcCalculado - a.imcCalculado),
      baixoPeso: baixoPeso.sort((a, b) => a.imcCalculado - b.imcCalculado),
      todos: [...obesidade, ...sobrepeso, ...baixoPeso] 
    };
  }, [pastas]);

  // --- LÓGICA DE PAGINAÇÃO ---
  const totalPaginas = Math.ceil(relatorioSaude.todos.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const alunosExibidos = relatorioSaude.todos.slice(inicio, fim);

  // --- LÓGICA DE IMPRESSÃO ---
  const imprimirRelatorio = () => {
    const janelaImpressao = window.open('', '', 'width=900,height=700');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    let html = `
      <html>
        <head>
          <title>relatório nutricional - auditoria intelligence</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; text-transform: lowercase; line-height: 1.5; }
            h1 { text-transform: uppercase; font-size: 24px; font-weight: 900; font-style: italic; border-bottom: 4px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
            .info { margin-bottom: 30px; font-weight: bold; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; text-align: left; padding: 15px; font-size: 10px; text-transform: uppercase; border: 1px solid #e2e8f0; font-weight: 900; }
            td { padding: 15px; font-size: 13px; border: 1px solid #e2e8f0; font-weight: 500; }
            .status-sobrepeso { color: #ea580c; font-weight: 900; font-style: italic; }
            .status-obesidade { color: #e11d48; font-weight: 900; font-style: italic; }
            .status-baixo { color: #2563eb; font-weight: 900; font-style: italic; }
            .footer { margin-top: 50px; font-size: 9px; color: #94a3b8; font-weight: 900; border-top: 1px solid #e2e8f0; padding-top: 20px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>triagem nutricional global</h1>
          <div class="info">data: ${dataAtual} | total de alertas: ${relatorioSaude.todos.length}</div>
          <table>
            <thead>
              <tr>
                <th>identificação do aluno</th>
                <th>turma</th>
                <th>biometria (kg/m)</th>
                <th>imc</th>
                <th>diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              ${relatorioSaude.todos.map(a => `
                <tr>
                  <td><b>${a.nome}</b></td>
                  <td>${a.turma}</td>
                  <td>${a.peso}kg / ${a.altura}m</td>
                  <td>${a.imcCalculado}</td>
                  <td class="status-${a.status.replace(' ', '-')}">${a.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">auditoria intelligence - sistema de gestão de enfermagem.</div>
        </body>
      </html>
    `;

    janelaImpressao.document.write(html);
    janelaImpressao.document.close();
    janelaImpressao.print();
  };

  // --- DISPARO DE E-MAIL ---
  const enviarEmail = (aluno = null) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const prefixo = aluno ? `alerta: ${aluno.nome}` : 'relatório de triagem geral';
    const assunto = normalizar(`[auditoria] alerta nutricional - ${prefixo} - ${dataAtual}`);
    
    let corpo = `auditoria intelligence\nrelatório gerado em: ${dataAtual}\n\n`;
    
    if(aluno) {
      corpo += `aluno: ${aluno.nome}\nturma: ${aluno.turma}\nimc: ${aluno.imcCalculado}\nstatus: ${aluno.status}\n\nsolicitamos agendamento de consulta nutricional para acompanhamento.`;
    } else {
      corpo += `resumo de alunos em zona de risco:\n\n`;
      relatorioSaude.todos.forEach(a => {
        corpo += `• ${a.nome} [turma: ${a.turma}] - imc: ${a.imcCalculado} (${a.status})\n`;
      });
    }

    window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  };

  const estilos = {
    card: darkMode ? 'bg-[#0A1629] border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900',
    item: darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white',
    textoSecundario: darkMode ? 'text-slate-400' : 'text-slate-500',
    btnPaginacao: `p-2.5 rounded-xl border transition-all active:scale-90 disabled:opacity-20 ${
      darkMode ? 'border-white/10 hover:bg-white/10' : 'border-slate-200 hover:bg-slate-50'
    }`
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Card Lateral de Controle */}
        <div className={`p-8 rounded-[40px] border shadow-2xl shadow-black/5 flex flex-col justify-center text-center ${estilos.card}`}>
          <div className="bg-orange-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Scale className="text-orange-500" size={32} />
          </div>
          
          <div className="flex justify-center gap-4 mb-2">
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-rose-600 italic leading-none">{relatorioSaude.obesidade.length}</h2>
              <p className="text-[7px] font-black uppercase opacity-40">obesidade</p>
            </div>
            <div className="w-px bg-slate-500/20 h-8 self-center" />
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-orange-500 italic leading-none">{relatorioSaude.sobrepeso.length}</h2>
              <p className="text-[7px] font-black uppercase opacity-40">sobrepeso</p>
            </div>
            <div className="w-px bg-slate-500/20 h-8 self-center" />
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-blue-500 italic leading-none">{relatorioSaude.baixoPeso.length}</h2>
              <p className="text-[7px] font-black uppercase opacity-40">baixo peso</p>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <button 
                onClick={() => enviarEmail()} 
                disabled={relatorioSaude.todos.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-[11px] font-black text-white uppercase tracking-[2px] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-30 flex items-center justify-center gap-3 active:scale-95"
            >
                <Mail size={16} /> encaminhar lista
            </button>
            
            <button 
                onClick={imprimirRelatorio}
                disabled={relatorioSaude.todos.length === 0}
                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 border active:scale-95 ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
            >
                <Printer size={16} /> imprimir tabela
            </button>
          </div>
        </div>
        
        {/* Feed de Alunos com Paginação */}
        <div className={`lg:col-span-3 p-10 rounded-[45px] border shadow-2xl shadow-black/5 ${estilos.card} flex flex-col`}>
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="font-black uppercase italic text-sm tracking-tighter flex items-center gap-3">
                <AlertCircle size={20} className="text-blue-500" /> triagem nutricional ativa
              </h3>
              <p className={`text-[10px] font-bold ${estilos.textoSecundario} uppercase mt-2 tracking-widest`}>
                registros: {relatorioSaude.todos.length} alertas detectados
              </p>
            </div>

            {/* Navegação de Topo */}
            {totalPaginas > 1 && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className={estilos.btnPaginacao}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[11px] font-black italic opacity-40 w-12 text-center">
                  {paginaAtual} / {totalPaginas}
                </span>
                <button 
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className={estilos.btnPaginacao}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
            {alunosExibidos.length > 0 ? (
              alunosExibidos.map((a, i) => (
                <div key={i} className={`group flex justify-between items-center p-6 rounded-[30px] border transition-all hover:border-blue-500/30 ${estilos.item}`}>
                  <div className="flex gap-5 items-center">
                    <div className={`w-1.5 h-12 rounded-full ${
                      a.status === 'obesidade' ? 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.4)]' : 
                      a.status === 'sobrepeso' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 
                      'bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                    }`} />
                    <div>
                      <p className="text-[13px] font-black lowercase italic leading-none mb-2">{a.nome}</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          a.status === 'obesidade' ? 'bg-rose-600/10 text-rose-600' :
                          a.status === 'sobrepeso' ? 'bg-orange-500/10 text-orange-600' : 
                          'bg-blue-500/10 text-blue-600'
                        }`}>
                          {a.status} ({a.imcCalculado})
                        </span>
                        <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">turma: {a.turma}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => enviarEmail(a)} 
                    className="p-3.5 bg-blue-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-blue-500/40 hover:scale-110 active:scale-90"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center">
                <Scale className="mx-auto text-slate-500/10 mb-4" size={60} />
                <p className="text-[10px] font-black lowercase opacity-20 tracking-[6px] italic">
                  nenhuma anomalia detectada
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaNutricional;