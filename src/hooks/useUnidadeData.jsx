import { query, where, collection, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

export const useUnidadeQuery = (colecaoNome, ordemCampo = "createdAt") => {
  const { user } = useAuth();
  
  // 🛡️ Se não houver usuário, retornamos uma query vazia ou nula para evitar crash
  if (!user) return null;

  const ref = collection(db, colecaoNome);
  
  // Recupera as flags de inspeção
  const unidadeInspecaoId = localStorage.getItem('inspecao_unidade_id');
  const modoInspecao = localStorage.getItem('modo_inspecao') === 'true';
  const isRoot = user.role?.toLowerCase() === 'root' || user.email === "rodrigohono21@gmail.com";

  // 1. MODO ROOT TOTAL (Visualização global)
  if (isRoot && !modoInspecao) {
    // Traz tudo de todas as escolas
    return query(ref, orderBy(ordemCampo, "desc"));
  }

  // 2. DEFINIÇÃO DO ESCOLA_ID (Filtro R S)
  // Prioriza a unidade inspecionada se o Root estiver em modo inspeção
  let escolaIdParaFiltro = (modoInspecao && unidadeInspecaoId) 
    ? unidadeInspecaoId 
    : user.escolaId;

  // Normalização para o padrão do banco (lowercase)
  if (escolaIdParaFiltro) {
    escolaIdParaFiltro = String(escolaIdParaFiltro).toLowerCase().trim();
  } else {
    // 🛡️ Segurança: Se o escolaId for nulo/undefined, forçamos um ID inexistente
    // para que a query não retorne nada por engano.
    return query(ref, where("escolaId", "==", "unidade_nao_definida"));
  }

  // 3. QUERY FILTRADA E SEGURA
  // Nota: Firebase exige índice composto para [escolaId + ordemCampo]
  try {
    return query(
      ref,
      where("escolaId", "==", escolaIdParaFiltro),
      orderBy(ordemCampo, "desc")
    );
  } catch (error) {
    console.error("Erro ao gerar query:", error);
    // Fallback: retorna apenas o filtro sem ordem para evitar que a tela trave se o índice sumir
    return query(ref, where("escolaId", "==", escolaIdParaFiltro));
  }
};