import React, { useMemo, useState } from 'react';
import { Mail, Send, Scale, AlertCircle, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

const AbaNutricional = ({ pastas = [], darkMode }) => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 6;

  // Normalização padrão "caio giromba"
  const normalizar = (str) => str?.toString().toLowerCase().trim() || "";

  const relatorioSaude = useMemo(() => {
    const sobrepeso = [];
    const obesidade = [];
    const baixoPeso = [];

    pastas.forEach(aluno => {
      const peso = parseFloat(aluno?.peso?.toString().replace(',', '.'));
      const alturaRaw = parseFloat(aluno?.altura?.toString().replace(',', '.'));

      if (!isNaN(peso) && !isNaN(alturaRaw) && peso > 0 && alturaRaw > 0) {
        // Ajuste automático: se altura > 3, assume-se que está em centímetros
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
          status: statusFinal,
          alturaFormatada: altura.toFixed(2)
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

  const totalPaginas = Math.ceil(relatorioSaude.todos.length / itensPorPagina);
  const alunosExibidos = relatorioSaude.todos.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const imprimirRelatorio = () => {
    const janelaImpressao = window.open('', '', 'width=900,height=700');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    let html = `
      <html>
        <head>
          <title>relatório nutricional - auditoria intelligence</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; text-transform: lowercase; }
            h1 { text-transform: uppercase; font-size: 22px; font-weight: 900; font-style: italic; border-bottom: 5px solid #2563eb; display: inline-block; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 10px; text-transform: uppercase; font-weight: 900; border: 1px solid #e2e8f0; }
            td { padding: 12px; font-size: 12px; border: 1px solid #e2e8f0; }
            .status-sobrepeso { color: #f97316; font-weight: 900; }
            .status-obesidade { color: #e11d48; font-weight: 900; }
            .status-baixo-peso { color: #2563eb; font-weight: 900; }
          </style>
        </head>
        <body>
          <h1>triagem nutricional global</h1>
          <p><b>emissão:</b> ${dataAtual} | <b>alertas detectados:</b> ${relatorioSaude.todos.length}</p>
          <table>
            <thead>
              <tr>
                <th>aluno</th><th>turma</th><th>biometria</th><th>imc</th><th>diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              ${relatorioSaude.todos.map(a => `
                <tr>
                  <td><b>${a.nome}</b></td>
                  <td>${a.turma}</td>
                  <td>${a.peso}kg / ${a.alturaFormatada}m</td>
                  <td>${a.imcCalculado}</td>
                  <td class="status-${a.status.replace(' ', '-')}">${a.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    janelaImpressao.document.write(html);
    janelaImpressao.document.close();
    janelaImpressao.print();
  };

  const enviarEmail = (aluno = null) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const assunto = normalizar(`[auditoria] alerta nutricional - ${aluno ? aluno.nome : 'geral'} - ${dataAtual}`);
    let corpo = `auditoria intelligence\nrelatório de triagem: ${dataAtual}\n\n`;
    
    if(aluno) {
      corpo += `aluno: ${aluno.nome}\nturma: ${aluno.turma}\nimc: ${aluno.imcCalculado}\nstatus: ${aluno.status}`;
    } else {
      relatorioSaude.todos.forEach(a => {
        corpo += `• ${a.nome} (${a.turma}) - imc: ${a.imcCalculado} [${a.status}]\n`;
      });
    }
    window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  };

  const estilos = {
    card: darkMode ? 'bg-[#0A1629] border-white/5 text-white shadow-2xl' : 'bg-white border-slate-100 text-slate-900 shadow-xl shadow-slate-200/50',
    item: darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white'
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-700 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* DASHBOARD LATERAL DE CONTROLE */}
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between ${estilos.card}`}>
          <div className="text-center">
            <div className="bg-blue-600/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Scale className="text-blue-600" size={30} />
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <span className="text-2xl font-black italic text-rose-500 block leading-none">{relatorioSaude.obesidade.length}</span>
                  <span className="text-[8px] font-black uppercase opacity-40 tracking-wider">obesidade</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <span className="text-2xl font-black italic text-orange-500 block leading-none">{relatorioSaude.sobrepeso.length}</span>
                  <span className="text-[8px] font-black uppercase opacity-40 tracking-wider">sobrepeso</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <span className="text-2xl font-black italic text-blue-500 block leading-none">{relatorioSaude.baixoPeso.length}</span>
                  <span className="text-[8px] font-black uppercase opacity-40 tracking-wider">baixo peso</span>
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <button onClick={() => enviarEmail()} disabled={relatorioSaude.todos.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 disabled:opacity-20 active:scale-95 shadow-lg shadow-blue-600/20">
                  <Mail size={16} /> exportar lista
                </button>
                <button onClick={imprimirRelatorio} disabled={relatorioSaude.todos.length === 0}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 border ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <Printer size={16} /> imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* FEED DE ALUNOS MONITORADOS */}
        <div className={`lg:col-span-3 p-10 rounded-[45px] border ${estilos.card} flex flex-col`}>
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-black uppercase italic text-sm tracking-tighter flex items-center gap-3">
                <AlertCircle size={20} className="text-orange-500" /> monitoramento biométrico
              </h3>
              <p className="text-[10px] font-bold opacity-40 uppercase mt-2 tracking-widest">
                {relatorioSaude.todos.length} pacientes fora da zona de normalidade
              </p>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1}
                  className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-10"><ChevronLeft size={16} /></button>
                <span className="text-[10px] font-black italic opacity-40 w-8 text-center">{paginaAtual}/{totalPaginas}</span>
                <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas}
                  className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-10"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alunosExibidos.length > 0 ? (
              alunosExibidos.map((a, i) => (
                <div key={i} className={`group flex justify-between items-center p-6 rounded-[30px] border transition-all hover:scale-[1.02] ${estilos.item}`}>
                  <div className="flex gap-5 items-center">
                    <div className={`w-1.5 h-10 rounded-full shadow-lg ${
                      a.status === 'obesidade' ? 'bg-rose-600 shadow-rose-600/20' : 
                      a.status === 'sobrepeso' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-[13px] font-black lowercase italic leading-none mb-2">{a.nome}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${
                          a.status === 'obesidade' ? 'bg-rose-500/10 text-rose-500' :
                          a.status === 'sobrepeso' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>{a.status} • imc {a.imcCalculado}</span>
                        <span className="text-[8px] font-black opacity-30 uppercase tracking-tighter">turma: {a.turma}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => enviarEmail(a)} 
                    className="p-3 bg-blue-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:rotate-12 shadow-lg shadow-blue-500/30">
                    <Send size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center opacity-20">
                <Scale className="mx-auto mb-4" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[5px]">índices estáveis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaNutricional;