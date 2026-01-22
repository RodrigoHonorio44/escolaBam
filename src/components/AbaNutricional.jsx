import React from 'react';
import { Mail, Send, Scale } from 'lucide-react';
import toast from 'react-hot-toast';

const AbaNutricional = ({ alunos, darkMode }) => {
  const enviarEmail = (aluno = null) => {
    const assunto = "Encaminhamento Nutricional";
    let corpo = "Relatório de Alerta IMC:\n\n";
    
    if(aluno) {
      corpo += `Aluno: ${aluno.nome}\nTurma: ${aluno.turma}\nIMC: ${aluno.imcCalculado}`;
    } else {
      alunos.forEach(a => corpo += `- ${a.nome} (IMC: ${a.imcCalculado})\n`);
    }
    
    window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    toast.success("E-mail preparado!");
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`p-8 rounded-[40px] border text-center ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white'}`}>
          <Scale className="mx-auto text-orange-500 mb-4" size={32} />
          <h2 className="text-5xl font-black mb-2">{alunos.length}</h2>
          <p className="text-[9px] font-black uppercase opacity-50">Casos de Sobrepeso</p>
          <button onClick={() => enviarEmail()} className="mt-6 w-full bg-blue-600 py-3 rounded-xl text-[9px] font-black text-white uppercase">Lista Completa</button>
        </div>
        
        <div className={`lg:col-span-3 p-8 rounded-[40px] border ${darkMode ? 'bg-[#0A1629] border-white/5' : 'bg-white'}`}>
          <h3 className="font-black uppercase italic mb-6">Lista de Alunos para Nutricionista</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alunos.map((a, i) => (
              <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-slate-500/5">
                <div>
                  <p className="text-[11px] font-black uppercase">{a.nome}</p>
                  <p className="text-[9px] opacity-40">Turma {a.turma} • IMC: {a.imcCalculado}</p>
                </div>
                <button onClick={() => enviarEmail(a)} className="p-2 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all">
                  <Send size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaNutricional;