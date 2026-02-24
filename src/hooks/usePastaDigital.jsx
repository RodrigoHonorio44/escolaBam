import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, getDocs, limit, where, orderBy } from 'firebase/firestore';
import { usePacienteSinc } from './usePacienteSinc'; 
import toast from 'react-hot-toast';

export const usePastaDigital = (user) => {
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [cacheNomes, setCacheNomes] = useState([]);
  const { puxarDadosCompletos, buscando: loading } = usePacienteSinc();

  // Mapeamento Centralizado de Unidades (Normalizado)
  const NOMES_UNIDADES = {
    'cepe': 'C.E.P.E.M. Professora Joana Benedicta Rangel',
    'anisio': 'E.M. Anísio Spínola Teixeira',
    'cept-anisio-teixeira': 'CEPT Anísio Teixeira',
    'cept': 'CEPT Professora Zilca Lopes da Fontoura',
    'marica': 'Secretaria Municipal de Educação de Maricá'
  };

  // --- HELPERS DE PADRONIZAÇÃO (R S) ---
  const paraBanco = (str) => str ? String(str).toLowerCase().trim() : '';

  const paraID = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const formatarNomeRS = (str) => {
    if (!str || str === '---') return '---';
    const excessoes = ['de', 'do', 'da', 'dos', 'das', 'e'];
    return str.toLowerCase().split(' ').map(p => {
      if (p.length <= 2 && excessoes.includes(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  };

  // 🛡️ TRAVA DE UNIDADE DINÂMICA (LocalStorage manda para evitar cache de outras escolas)
  const escolaUsuarioId = (localStorage.getItem("escolaIdLogada") || user?.escolaId)?.toLowerCase().trim();
  const unidadeNome = NOMES_UNIDADES[escolaUsuarioId] || user?.escolaId || 'UNIDADE';
  const isRoot = user?.role?.toLowerCase() === 'root' || user?.email === "rodrigohono21@gmail.com";

  // --- 1. SINCRONIZAÇÃO DE CACHE (Autocomplete Seguro por Unidade) ---
  useEffect(() => {
    const carregarCache = async () => {
      if (!escolaUsuarioId && !isRoot) return;

      try {
        // 🛡️ O cache só baixa o que pertence à unidade ativa
        const q = isRoot 
          ? query(collection(db, "pastas_digitais"), orderBy("nomeBusca"), limit(1000))
          : query(
              collection(db, "pastas_digitais"), 
              where("escolaId", "==", escolaUsuarioId),
              orderBy("nomeBusca"),
              limit(1000) 
            );

        const snap = await getDocs(q);
        const nomes = snap.docs.map(d => {
          const data = d.data();
          const nomeFinal = paraBanco(data.nome || data.nomeBusca || '');
          return {
            id: d.id,
            nomeOriginal: nomeFinal,
            nomeExibicao: formatarNomeRS(nomeFinal),
            dataNascimento: data.dataNascimento || '',
            turma: data.turma || '---',
            tipo: data.tipoPerfil || 'aluno',
            escolaId: data.escolaId
          };
        });

        setCacheNomes(nomes);
      } catch (e) { 
        console.error("❌ Erro no Cache:", e);
      }
    };

    carregarCache();
    // 🔄 Recarrega o cache se a escola mudar no LocalStorage
  }, [escolaUsuarioId, isRoot]);

  // --- 2. PESQUISA PRINCIPAL COM CROSS-CHECK ---
  const pesquisarPaciente = async (pacienteSelecionado = null) => {
    const nome = pacienteSelecionado?.nomeOriginal || paraBanco(busca);
    const dataNasc = pacienteSelecionado?.dataNascimento || "";

    if (!nome) return;

    setSugestoes([]);
    try {
      // O puxarDadosCompletos já tem a trava interna de escolaId
      const data = await puxarDadosCompletos(nome, dataNasc);
      
      if (data && data.existe) {
        setResultado(data);
        toast.success(`Prontuário carregado.`);
      } else {
        toast.error("Este prontuário não pertence a esta unidade ou não existe.");
        setResultado(null);
      }
    } catch (e) { 
      console.error(e);
      toast.error("Erro ao acessar prontuário."); 
    }
  };

  // --- 3. MAPEAMENTO DE SAÚDE (Cards de Alerta Dinâmicos) ---
  const infoSaude = (() => {
    if (!resultado) return { alertas: [], listaAlergias: [], listaMedicacao: [] };
    
    const r = resultado;
    const alertas = [];
    const listaAlergias = [];
    const listaMedicacao = [];
    const neg = ["não", "nao", "n", "nenhuma", "negativo", "", "---"];

    // Cruzamento de Flags de Saúde (Padrão R S)
    const condicoes = [
      { id: 'diabetes', label: 'Diabetes' },
      { id: 'asma', label: 'Asma' },
      { id: 'epilepsia', label: 'Epilepsia' },
      { id: 'cardiaco', label: 'Cardíaco' },
      { id: 'isPCD', label: 'PCD' }
    ];

    condicoes.forEach(c => {
      // Verifica no objeto principal ou dentro de statusClinico vindo do usePacienteSinc
      const valor = r[c.id] || r.statusClinico?.[c.id];
      if (paraBanco(valor) === "sim") {
        alertas.push(c.label);
      }
    });

    // Tratamento de Alergias (Pega da Ficha ou da Pasta Digital)
    const alTxt = r.qualAlergia || r.alunoPossuiAlergia;
    if (alTxt && !neg.includes(paraBanco(alTxt)) && paraBanco(alTxt) !== "sim") {
      alTxt.split(/[,/]+/).forEach(a => {
        if(a.trim()) listaAlergias.push(a.trim().toLowerCase());
      });
    }
    
    // Tratamento de Medicação
    const medTxt = r.detalhesMedicao || r.medicacaoContinua;
    if (medTxt && !neg.includes(paraBanco(medTxt)) && paraBanco(medTxt) !== "sim") {
      listaMedicacao.push(medTxt.toLowerCase());
    }

    return { alertas, listaAlergias, listaMedicacao };
  })();

  return {
    busca, setBusca,
    resultado, setResultado,
    sugestoes, setSugestoes,
    cacheNomes,
    loading,
    unidadeNome,
    infoSaude,
    pesquisarPaciente,
    paraBanco,
    formatarNomeRS
  };
};