import React, { useMemo, useState } from 'react';
import { Mail, Send, Scale, AlertCircle, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

const AbaNutricional = ({ pastas = [], darkMode }) => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 6;

  const formatarRS = (str) => {
    if (!str) return "não informado";
    return str.toString().toLowerCase().split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const relatorioSaude = useMemo(() => {
    const sobrepeso = [];
    const obesidade = [];
    const baixoPeso = [];
    const listaAlunos = Array.isArray(pastas) ? pastas : Object.values(pastas || {});

    listaAlunos.forEach(aluno => {
      const nomeOriginal = aluno?.nome || aluno?.nomeBusca;
      if (nomeOriginal && nomeOriginal !== "aluno sem nome") {
        const peso = parseFloat(aluno?.peso?.toString().replace(',', '.') || 0);
        const alturaRaw = parseFloat(aluno?.altura?.toString().replace(',', '.') || 0);

        if (peso > 0 && alturaRaw > 0) {
          const altura = alturaRaw > 3 ? alturaRaw / 100 : alturaRaw;
          const imc = peso / (altura * altura);
          
          let statusFinal = 'normal';
          if (imc < 18.5) statusFinal = 'baixo peso';
          else if (imc >= 25 && imc < 30) statusFinal = 'sobrepeso';
          else if (imc >= 30) statusFinal = 'obesidade';

          if (statusFinal !== 'normal') {
            const dadosProcessados = {
              ...aluno,
              nomeFormatado: formatarRS(nomeOriginal),
              imcFormatado: imc.toFixed(1),
              status: statusFinal,
              turma: aluno.turma?.toLowerCase() || 'n/i',
              peso,
              altura: altura.toFixed(2)
            };

            if (statusFinal === 'sobrepeso') sobrepeso.push(dadosProcessados);
            else if (statusFinal === 'obesidade') obesidade.push(dadosProcessados);
            else if (statusFinal === 'baixo peso') baixoPeso.push(dadosProcessados);
          }
        }
      }
    });

    return {
      sobrepeso,
      obesidade,
      baixoPeso,
      todos: [...obesidade, ...sobrepeso, ...baixoPeso].sort((a, b) => b.imcFormatado - a.imcFormatado)
    };
  }, [pastas]);

  const totalPaginas = Math.ceil(relatorioSaude.todos.length / itensPorPagina);
  const alunosExibidos = relatorioSaude.todos.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const imprimirRelatorio = () => {
    const janela = window.open('', '', 'width=900,height=700');
    const data = new Date().toLocaleDateString('pt-BR');
    
    let html = `
      <html>
        <head>
          <title>Relatório Nutricional</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; text-transform: lowercase; }
            h1 { text-transform: uppercase; border-bottom: 4px solid #2563eb; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; }
            .status { font-weight: bold; text-transform: uppercase; font-size: 10px; }
          </style>
        </head>
        <body>
          <h1>Triagem Nutricional Global</h1>
          <p>Data: ${data} | Alunos em Alerta: ${relatorioSaude.todos.length}</p>
          <table>
            <thead>
              <tr>
                <th>Aluno</th><th>Turma</th><th>Peso</th><th>Altura</th><th>IMC</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${relatorioSaude.todos.map(a => `
                <tr>
                  <td><b>${a.nomeFormatado}</b></td>
                  <td>${a.turma}</td>
                  <td>${a.peso}kg</td>
                  <td>${a.altura}m</td>
                  <td>${a.imcFormatado}</td>
                  <td class="status">${a.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    janela.document.write(html);
    janela.document.close();
    janela.print();
  };

  const enviarEmail = (aluno = null) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const assunto = `[Auditoria] Alerta Nutricional - ${dataAtual}`;
    let corpo = `Relatório de Triagem Nutricional\n\n`;
    if(aluno) corpo += `Aluno: ${aluno.nomeFormatado}\nStatus: ${aluno.status}\nIMC: ${aluno.imcFormatado}`;
    else relatorioSaude.todos.forEach(a => { corpo += `• ${a.nomeFormatado} (${a.turma}) - IMC: ${a.imcFormatado} [${a.status}]\n`; });
    window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  };

  const estilos = {
    card: darkMode ? 'bg-[#0A1629] border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xl',
    item: darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white shadow-sm'
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`p-8 rounded-[40px] border flex flex-col justify-between ${estilos.card}`}>
          <div className="text-center">
            <div className="bg-blue-600/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6"><Scale className="text-blue-600" size={30} /></div>
            <div className="grid grid-cols-3 gap-2 mb-8">
              <div className="text-center"><span className="text-xl font-black text-rose-500 block">{relatorioSaude.obesidade.length}</span><span className="text-[7px] font-bold uppercase opacity-50">obesidade</span></div>
              <div className="text-center"><span className="text-xl font-black text-orange-500 block">{relatorioSaude.sobrepeso.length}</span><span className="text-[7px] font-bold uppercase opacity-50">sobrepeso</span></div>
              <div className="text-center"><span className="text-xl font-black text-blue-500 block">{relatorioSaude.baixoPeso.length}</span><span className="text-[7px] font-bold uppercase opacity-50">baixo peso</span></div>
            </div>
            <div className="space-y-3">
              <button onClick={() => enviarEmail()} disabled={relatorioSaude.todos.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all disabled:opacity-20"><Mail size={16} className="inline mr-2" /> Email</button>
              <button onClick={imprimirRelatorio} disabled={relatorioSaude.todos.length === 0} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}><Printer size={16} className="inline mr-2" /> Imprimir</button>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-3 p-10 rounded-[45px] border ${estilos.card}`}>
          <div className="flex justify-between items-center mb-10">
            <div><h3 className="font-black uppercase italic text-sm flex items-center gap-3"><AlertCircle size={20} className="text-orange-500" /> Monitoramento Biométrico</h3></div>
            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPaginaAtual(p => p - 1)} disabled={paginaAtual === 1} className="p-2 disabled:opacity-10"><ChevronLeft size={18}/></button>
                <span className="text-[10px] font-black">{paginaAtual}/{totalPaginas}</span>
                <button onClick={() => setPaginaAtual(p => p + 1)} disabled={paginaAtual === totalPaginas} className="p-2 disabled:opacity-10"><ChevronRight size={18}/></button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alunosExibidos.map((a, i) => (
              <div key={i} className={`group flex justify-between items-center p-6 rounded-[30px] border transition-all ${estilos.item}`}>
                <div className="flex gap-4 items-center">
                  <div className={`w-1.5 h-10 rounded-full ${a.status === 'obesidade' ? 'bg-rose-600' : a.status === 'sobrepeso' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                  <div>
                    <p className="text-[13px] font-black italic leading-none mb-1.5">{a.nomeFormatado}</p>
                    <p className="text-[9px] font-bold opacity-50 uppercase tracking-tighter">IMC {a.imcFormatado} • {a.status} • {a.turma}</p>
                  </div>
                </div>
                <button onClick={() => enviarEmail(a)} className="p-2.5 bg-blue-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Send size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaNutricional;