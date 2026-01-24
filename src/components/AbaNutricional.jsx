import React, { useMemo } from 'react';
import { Mail, Send, Scale, AlertCircle, Printer } from 'lucide-react';

const AbaNutricional = ({ pastas = [], darkMode }) => {
  // --- FUNÇÃO DE NORMALIZAÇÃO ---
  const normalizar = (str) => str?.toString().toLowerCase().trim() || "";

  const relatorioSaude = useMemo(() => {
    const sobrepeso = [];
    const baixoPeso = [];

    pastas.forEach(aluno => {
      const peso = parseFloat(aluno?.peso);
      const alturaRaw = parseFloat(aluno?.altura);

      if (!isNaN(peso) && !isNaN(alturaRaw) && peso > 0 && alturaRaw > 0) {
        // Ajuste automático de altura (cm para m se necessário)
        const altura = alturaRaw > 3 ? alturaRaw / 100 : alturaRaw;
        const imcCalculado = peso / (altura * altura);
        const imcFormatado = imcCalculado.toFixed(1);

        const dadosCompletos = { 
          ...aluno, 
          nome: normalizar(aluno.nome || "aluno sem nome"),
          imcCalculado: imcFormatado,
          turma: normalizar(aluno.turma || "n/i"),
          status: imcCalculado >= 25 ? 'sobrepeso' : 'baixo peso'
        };

        if (imcCalculado >= 25) sobrepeso.push(dadosCompletos);
        else if (imcCalculado < 18.5) baixoPeso.push(dadosCompletos);
      }
    });

    return { 
      sobrepeso: sobrepeso.sort((a, b) => b.imcCalculado - a.imcCalculado), 
      baixoPeso: baixoPeso.sort((a, b) => a.imcCalculado - b.imcCalculado),
      todos: [...sobrepeso, ...baixoPeso]
    };
  }, [pastas]);

  const imprimirRelatorio = () => {
    const janelaImpressao = window.open('', '', 'width=900,height=700');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    let html = `
      <html>
        <head>
          <title>relatório nutricional - auditoria intelligence</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; text-transform: lowercase; }
            h1 { text-transform: uppercase; font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 10px; font-style: italic; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f2f2f2; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; border: 1px solid #ddd; }
            td { padding: 12px; font-size: 12px; border: 1px solid #ddd; }
            .status-alerta { font-weight: bold; color: #d97706; }
            .status-critico { font-weight: bold; color: #2563eb; }
            .footer { margin-top: 30px; font-size: 10px; color: #777; font-style: italic; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>triagem nutricional - ${dataAtual}</h1>
          <p>total de alunos monitorados: ${relatorioSaude.todos.length}</p>
          <table>
            <thead>
              <tr>
                <th>aluno</th>
                <th>turma</th>
                <th>peso/alt</th>
                <th>imc</th>
                <th>status</th>
              </tr>
            </thead>
            <tbody>
              ${relatorioSaude.todos.map(a => `
                <tr>
                  <td><b>${a.nome}</b></td>
                  <td>${a.turma}</td>
                  <td>${a.peso}kg / ${a.altura}m</td>
                  <td>${a.imcCalculado}</td>
                  <td class="${a.status === 'sobrepeso' ? 'status-alerta' : 'status-critico'}">${a.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">gerado por auditoria intelligence - unidade de enfermagem.</div>
        </body>
      </html>
    `;

    janelaImpressao.document.write(html);
    janelaImpressao.document.close();
    janelaImpressao.print();
  };

  const enviarEmail = (aluno = null) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const assunto = `ALERTA NUTRICIONAL - ${aluno ? aluno.nome.toUpperCase() : 'GERAL'} [${dataAtual}]`;
    let corpo = `auditoria intelligence\ndata: ${dataAtual}\n\n`;
    
    if(aluno) {
      corpo += `aluno: ${aluno.nome}\nturma: ${aluno.turma}\nimc: ${aluno.imcCalculado}\nstatus: ${aluno.status}\n\nsolicitamos avaliação nutricional.`;
    } else {
      corpo += `resumo de triagem\n\n`;
      relatorioSaude.todos.forEach(a => {
        corpo += `- ${a.nome} | imc: ${a.imcCalculado} | ${a.status}\n`;
      });
    }
    window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  };

  const estilos = {
    card: darkMode ? 'bg-[#0A1629] border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900',
    item: darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100',
    textoSecundario: darkMode ? 'text-slate-400' : 'text-slate-500',
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Card de Resumo Estatístico */}
        <div className={`p-8 rounded-[40px] border shadow-2xl shadow-black/5 flex flex-col justify-center text-center ${estilos.card}`}>
          <div className="bg-orange-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Scale className="text-orange-500" size={32} />
          </div>
          
          <div className="flex justify-center gap-6 mb-2">
            <div>
              <h2 className="text-5xl font-black tracking-tighter">{relatorioSaude.sobrepeso.length}</h2>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40">sobrepeso</p>
            </div>
            <div className="w-px bg-slate-500/20 h-10 self-center" />
            <div>
              <h2 className="text-5xl font-black tracking-tighter text-blue-500">{relatorioSaude.baixoPeso.length}</h2>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40">baixo peso</p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button 
                onClick={() => enviarEmail()} 
                disabled={relatorioSaude.todos.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-[11px] font-black text-white uppercase tracking-[2px] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-30 flex items-center justify-center gap-3"
            >
                <Mail size={16} /> encaminhar lista
            </button>
            
            <button 
                onClick={imprimirRelatorio}
                disabled={relatorioSaude.todos.length === 0}
                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 border ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
            >
                <Printer size={16} /> imprimir tabela
            </button>
          </div>
        </div>
        
        {/* Listagem Detalhada */}
        <div className={`lg:col-span-3 p-8 rounded-[40px] border shadow-2xl shadow-black/5 ${estilos.card}`}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-black uppercase italic text-sm tracking-tighter flex items-center gap-2">
                <AlertCircle size={18} className="text-blue-500" /> triagem nutricional ativa
              </h3>
              <p className={`text-[10px] font-bold ${estilos.textoSecundario} uppercase mt-1`}>
                parâmetros: <span className="text-orange-500">sobrepeso ≥ 25</span> | <span className="text-blue-500">baixo peso {'<'} 18.5</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {relatorioSaude.todos.length > 0 ? (
              relatorioSaude.todos.map((a, i) => (
                <div key={i} className={`group flex justify-between items-center p-6 rounded-[28px] border transition-all hover:scale-[1.02] ${estilos.item}`}>
                  <div className="flex gap-4 items-center">
                    <div className={`w-2 h-10 rounded-full ${a.status === 'sobrepeso' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-[12px] font-black lowercase italic leading-none mb-1.5">{a.nome}</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${a.status === 'sobrepeso' ? 'bg-orange-500/10 text-orange-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          imc {a.imcCalculado}
                        </span>
                        <span className={`text-[9px] font-bold opacity-40 uppercase ${estilos.textoSecundario}`}>turma: {a.turma}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => enviarEmail(a)} 
                    className="p-3 bg-blue-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-blue-500/30"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center opacity-20 font-black uppercase italic tracking-widest">
                nenhuma anomalia nutricional detectada
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaNutricional;