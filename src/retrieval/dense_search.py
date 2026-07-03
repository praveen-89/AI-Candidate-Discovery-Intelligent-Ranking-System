import os
from typing import List, Tuple, Dict
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False
    logger.warning("faiss-cpu not installed. DenseSearch will run in MOCK mode.")


class DenseRetriever:
    """
    Handles indexing and searching of semantic candidate vectors using FAISS.
    Uses Inner Product (IndexFlatIP) since vectors are L2-normalized.
    """
    def __init__(self):
        self.dim = settings.EMBEDDING_DIMENSION
        self.index_path = os.path.join(settings.DATA_EMBEDDINGS_DIR, "candidates.faiss")
        
        self.id_mapping: Dict[int, str] = {}
        
        if HAS_FAISS:
            self.index = faiss.IndexFlatIP(self.dim)
        else:
            self.index = None
            self.mock_db = []

    def add_to_index(self, candidate_ids: List[str], embeddings: List[List[float]]):
        """
        Incrementally adds vectors to the FAISS index.
        """
        if len(candidate_ids) != len(embeddings):
            raise ValueError("Number of IDs must match number of embeddings.")
            
        logger.info(f"Adding {len(candidate_ids)} vectors to the index...")
        
        start_idx = len(self.id_mapping)
        for i, cid in enumerate(candidate_ids):
            self.id_mapping[start_idx + i] = cid
            
        if HAS_FAISS:
            import numpy as np
            emb_np = np.array(embeddings, dtype=np.float32)
            self.index.add(emb_np)
        else:
            self.mock_db.extend(embeddings)

    def save_index(self, path: str):
        if HAS_FAISS:
            faiss.write_index(self.index, path)
            logger.info(f"Saved FAISS index to {path}")
        else:
            import pickle
            with open(path + ".mock", 'wb') as f:
                pickle.dump(self.mock_db, f)
            logger.info(f"Saved mock index to {path}.mock")

    def load_index(self, faiss_path: str, ids_path: str):
        logger.info(f"Loading IDs from {ids_path}")
        try:
            import numpy as np
            ids_arr = np.load(ids_path, allow_pickle=True)
        except ImportError:
            import pickle
            with open(ids_path, "rb") as f:
                ids_arr = pickle.load(f)
                
        for i, cid in enumerate(ids_arr):
            self.id_mapping[i] = str(cid)
            
        if HAS_FAISS:
            logger.info(f"Loading FAISS index from {faiss_path}")
            self.index = faiss.read_index(faiss_path)
        else:
            import pickle
            mock_path = faiss_path + ".mock"
            if os.path.exists(mock_path):
                with open(mock_path, 'rb') as f:
                    self.mock_db = pickle.load(f)
                logger.info(f"Loaded mock index from {mock_path}")

    def search(self, query_embedding: List[List[float]], top_k: int = None) -> List[Tuple[str, float]]:
        """
        Searches the index for the query_embedding.
        Returns a list of (candidate_id, similarity_score).
        """
        k = top_k or settings.TOP_K_DENSE
        
        if HAS_FAISS:
            if self.index.ntotal == 0:
                return []
            import numpy as np
            q_np = np.array(query_embedding, dtype=np.float32)
            scores, indices = self.index.search(q_np, k)
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx != -1:
                    cid = self.id_mapping.get(idx)
                    if cid:
                        clamped_score = max(0.0, min(1.0, float(score)))
                        results.append((cid, clamped_score))
            return results
        else:
            # MOCK search using pure python dot product
            if len(self.mock_db) == 0:
                return []
                
            q_vec = query_embedding[0]
            scores = []
            for idx, db_vec in enumerate(self.mock_db):
                score = sum(q * d for q, d in zip(q_vec, db_vec))
                scores.append((idx, score))
                
            # Sort by score descending
            scores.sort(key=lambda x: x[1], reverse=True)
            top_indices = scores[:k]
            
            results = []
            for idx, score in top_indices:
                cid = self.id_mapping.get(idx)
                if cid:
                    clamped_score = max(0.0, min(1.0, float(score)))
                    results.append((cid, clamped_score))
            return results
