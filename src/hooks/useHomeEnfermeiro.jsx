import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';

export const useHomeEnfermeiro = (user) => {
  const [metricas, setMetricas] = useState({
    atendidoshoje: 0,
    atendidosMes: 0,
    totalAlunos: 0,
    totalFuncionarios: 0,
    tempoMedio: 0,
    tempoMedioMes: 0,
    pendentes: 0
  });

  const [todosAtendimentosHoje, setTodosAtendimentosHoje] = useState([]);
  const [resultadoRelatorio, setResultadoRelatorio] = useState(null);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);

  // 🛡️ LÓGICA DE INSPEÇÃO (ROOT / ADMIN):
  // Se o Root estiver inspecionando uma escola específica, usamos o ID dela.
  // Caso contrário, usamos a escola do usuário logado.
  const inspecaoUnidadeId = localStorage.getItem('inspecao_unidade_id'); 
  const escolaAtivaId = (inspecaoUnidadeId || user?.escolaId || "").toLowerCase().trim();
  const isRoot = user?.role?.toLowerCase() === 'root' || user?.email === "rodrigohono21@gmail.com";

  useEffect(() => {
    if (!escolaAtivaId && !isRoot) return;

    const agora = new Date();
    // Padrão ISO para bater com as strings de data no banco (YYYY-MM-DD)
    const hojeLocal = agora.toLocaleDateString('en-CA'); 
    const mesAtualPrefix = hojeLocal.substring(0, 7);

    // 1. MONITORAR ATENDIMENTOS (Tempo Real)
    const qAtendimentos = collection(db, "atendimentos_enfermagem");
    
    const unsubAtendimentos = onSnapshot(qAtendimentos, (snapshot) => {
      let totalMinHoje = 0, countHoje = 0, totalMinMes = 0, countMes = 0;
      let pendentesCount = 0, totalMes = 0;

      const todosOsDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtro de Segurança: Root vê tudo (ou a unidade inspecionada), Enfermeiro vê só a dele.
      // Priorizamos o filtro por escolaId (mais seguro que o nome)
      const daEscola = todosOsDocs.filter(atend => {
        const docEscolaId = (atend.escolaId || "").toLowerCase().trim();
        return isRoot ? (inspecaoUnidadeId ? docEscolaId === escolaAtivaId : true) : docEscolaId === escolaAtivaId;
      });

      const filtradosHoje = daEscola.filter(atend => (atend.data || "").trim() === hojeLocal);

      daEscola.forEach(atend => {
        const dataDoc = (atend.data || "").trim();
        const status = (atend.statusAtendimento || "").toLowerCase().trim();

        // Cálculo de Tempo Médio (Check-in vs Check-out)
        if (atend.horario && atend.horarioSaida && status === "finalizado") {
          const [h1, m1] = atend.horario.split(':').map(Number);
          const [h2, m2] = atend.horarioSaida.split(':').map(Number);
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          
          if (diff > 0) {
            if (dataDoc === hojeLocal) { totalMinHoje += diff; countHoje++; }
            if (dataDoc.startsWith(mesAtualPrefix)) { totalMinMes += diff; countMes++; }
          }
        }

        // Métricas de Volume
        if (dataDoc.startsWith(mesAtualPrefix)) totalMes++;
        
        // Pendentes: Atendimentos que ainda não foram finalizados hoje
        if (dataDoc === hojeLocal && (status === "pendente" || status === "aberto" || status === "")) {
          pendentesCount++;
        }
      });

      setMetricas(prev => ({
        ...prev,
        atendidoshoje: filtradosHoje.length,
        atendidosMes: totalMes,
        pendentes: pendentesCount,
        tempoMedio: countHoje > 0 ? Math.round(totalMinHoje / countHoje) : 0,
        tempoMedioMes: countMes > 0 ? Math.round(totalMinMes / countMes) : 0
      }));

      // Ordenação: Mais recentes no topo da lista
      setTodosAtendimentosHoje(
        filtradosHoje.sort((a, b) => (b.horario || "").localeCompare(a.horario || ""))
      );
    });

    // 2. MONITORAR CENSO (Alunos e Staff em Tempo Real)
    const unsubPastas = onSnapshot(collection(db, "pastas_digitais"), (snapshot) => {
      const docsEscola = snapshot.docs.map(doc => doc.data()).filter(p => {
        const docEscolaId = (p.escolaId || "").toLowerCase().trim();
        return isRoot ? (inspecaoUnidadeId ? docEscolaId === escolaAtivaId : true) : docEscolaId === escolaAtivaId;
      });

      setMetricas(prev => ({
        ...prev,
        totalAlunos: docsEscola.filter(p => (p.tipoPerfil || "").toLowerCase().trim() === "aluno").length,
        totalFuncionarios: docsEscola.filter(p => (p.tipoPerfil || "").toLowerCase().trim() === "funcionario").length
      }));
    });

    return () => { 
      unsubAtendimentos(); 
      unsubPastas(); 
    };
  }, [escolaAtivaId, isRoot, inspecaoUnidadeId]);

  // 3. GERAR RELATÓRIO SOB DEMANDA (Busca Histórica)
  const gerarRelatorioGeral = async (inicio, fim) => {
    if (!inicio || !fim) return;
    setCarregandoRelatorio(true);
    try {
      const ref = collection(db, "atendimentos_enfermagem");
      // Query otimizada por range de data
      const q = query(ref, where("data", ">=", inicio), where("data", "<=", fim));
      const snap = await getDocs(q);
      
      const docsFiltrados = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(atend => {
          const docEscolaId = (atend.escolaId || "").toLowerCase().trim();
          return isRoot ? (inspecaoUnidadeId ? docEscolaId === escolaAtivaId : true) : docEscolaId === escolaAtivaId;
        });

      let totalMin = 0;
      let countComTempo = 0;

      docsFiltrados.forEach(atend => {
        if (atend.horario && atend.horarioSaida && atend.statusAtendimento === "finalizado") {
          const [h1, m1] = atend.horario.split(':').map(Number);
          const [h2, m2] = atend.horarioSaida.split(':').map(Number);
          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diff > 0) { totalMin += diff; countComTempo++; }
        }
      });

      setResultadoRelatorio({
        total: docsFiltrados.length,
        tempoMedio: countComTempo > 0 ? Math.round(totalMin / countComTempo) : 0,
        lista: docsFiltrados.sort((a, b) => 
          a.data.localeCompare(b.data) || (a.horario || "").localeCompare(b.horario || "")
        )
      });
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
    } finally {
      setCarregandoRelatorio(false);
    }
  };

  return { 
    metricas, 
    todosAtendimentosHoje, 
    resultadoRelatorio, 
    carregandoRelatorio, 
    gerarRelatorioGeral,
    unidadeExibida: escolaAtivaId 
  };
};