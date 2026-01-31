import React from 'react';
import { Search, Loader2 } from 'lucide-react';

const FiltroPeriodo = ({ periodo, setPeriodo, loading, onSearch, darkMode }) => (
  <div className="flex gap-3">
    <input 
      type="date" 
      value={periodo.inicio} 
      onChange={e => setPeriodo({...periodo, inicio: e.target.value})} 
      className={`p-3 rounded-xl text-[10px] font-black border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`} 
    />
    <input 
      type="date" 
      value={periodo.fim} 
      onChange={e => setPeriodo({...periodo, fim: e.target.value})} 
      className={`p-3 rounded-xl text-[10px] font-black border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`} 
    />
    <button onClick={onSearch} className="p-4 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-105 transition-all">
      {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
    </button>
  </div>
);

export default FiltroPeriodo;