import { db } from '../../firebase/firebaseConfig';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

/**
 * script de migração global - padrão r s
 * finalidade: normalizar todos os registros para lowercase e vincular ao cept anísio teixeira
 */
const executarMigracaoGlobal = async () => {
  // constantes de destino (lowercase para facilitar buscas)
  const ID_ALVO = "cept-anisio-teixeira";
  const NOME_ALVO = "cept anísio teixeira";

  const colecoes = [
    "alunos", 
    "atendimentos_enfermagem", 
    "funcionarios", 
    "pastas_digitais", 
    "questionarios_saude", 
    "tratativas_auditoria", 
    "usuarios"
  ];

  const toastId = toast.loading("☢️ iniciando limpeza global: carimbando cept anísio teixeira...");

  try {
    for (const nomeColecao of colecoes) {
      const colRef = collection(db, nomeColecao);
      const snapshot = await getDocs(colRef);
      
      let batch = writeBatch(db);
      let contador = 0;

      for (const documento of snapshot.docs) {
        const docRef = doc(db, nomeColecao, documento.id);
        const data = documento.data();

        // payload de normalização r s
        const atualizacao = {
          escolaId: ID_ALVO,
          escola: NOME_ALVO,
          unidade: NOME_ALVO, // campo extra para redundância de filtros
          lastSync: new Date().toISOString()
        };

        // normalização de campos de nome (lowercase total)
        if (data.nome) {
          atualizacao.nome = data.nome.toLowerCase().trim();
        }
        
        if (data.nomePaciente) {
          atualizacao.nomePaciente = data.nomePaciente.toLowerCase().trim();
        }

        if (data.alunoNome) {
          atualizacao.alunoNome = data.alunoNome.toLowerCase().trim();
        }

        // campos específicos da coleção usuários
        if (nomeColecao === "usuarios") {
          atualizacao.unidadeId = ID_ALVO;
          // garante que o e-mail também esteja em lowercase para o login
          if (data.email) atualizacao.email = data.email.toLowerCase().trim();
        }

        batch.update(docRef, atualizacao);
        contador++;

        // limite do firebase (500 por lote)
        if (contador === 450) { // margem de segurança
          await batch.commit();
          batch = writeBatch(db);
          contador = 0;
        }
      }

      if (contador > 0) {
        await batch.commit();
      }
      console.log(`✅ ${nomeColecao}: dados normalizados.`);
    }

    toast.success("missão cumprida! todos os dados estão em lowercase e vinculados ao cept.", { id: toastId });
    
    // aguarda 2 segundos e reinicia para limpar o estado do sistema
    setTimeout(() => {
        window.location.reload();
    }, 2000);

  } catch (error) {
    console.error("erro crítico na migração:", error);
    toast.error("erro ao normalizar dados. verifique o console.", { id: toastId });
  }
};

export default executarMigracaoGlobal;