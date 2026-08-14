import os
import json
import asyncio
import time
import subprocess
from app.core.logging import get_logger
from app.core.exceptions import APIException

logger = get_logger(__name__)

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.abspath(os.path.join(_SCRIPT_DIR, "../.."))
_ROOT_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))

AI_ENGINE_DIR = os.path.join(_ROOT_DIR, "ai_engine")
INFERENCE_SCRIPT = os.path.join(AI_ENGINE_DIR, "scripts", "inference.py")
OUTPUTS_DIR = os.path.join(AI_ENGINE_DIR, "outputs")
SUBMISSION_FILE = os.path.join(OUTPUTS_DIR, "submission.json")
MANIFEST_FILE = os.path.join(OUTPUTS_DIR, "manifest.json")

DATASETS_DIR = os.path.join(_ROOT_DIR, "datasets")
EMBEDDINGS_DIR = os.path.join(DATASETS_DIR, "embeddings")
FAISS_FILE = os.path.join(EMBEDDINGS_DIR, "candidates.faiss")
IDS_FILE = os.path.join(EMBEDDINGS_DIR, "candidate_ids.npy")
META_FILE = os.path.join(EMBEDDINGS_DIR, "metadata.json")

class AIEngineService:
    """
    Bridge to orchestrate the existing AI Engine.
    Executes inference via subprocess and reads generated artifacts natively.
    """
    
    @staticmethod
    async def run_inference() -> dict:
        """
        Executes the AI engine inference script as a subprocess.
        """
        if not os.path.exists(INFERENCE_SCRIPT):
            raise APIException(status_code=500, message="Inference script not found.")
            
        logger.info(f"Triggering inference script: {INFERENCE_SCRIPT}")
        start_time = time.time()
        
        # Determine the Python executable to use (using current sys.executable ensures the venv is active)
        import sys
        python_exe = sys.executable
        
        def _run_cmd():
            logger.debug(f"Executing: {python_exe} {INFERENCE_SCRIPT} in cwd: {_ROOT_DIR}")
            return subprocess.run(
                [python_exe, INFERENCE_SCRIPT],
                cwd=_ROOT_DIR,
                capture_output=True,
                text=True
            )
            
        try:
            result = await asyncio.to_thread(_run_cmd)
        except Exception as e:
            logger.error(f"Failed to execute inference subprocess: {e}")
            raise APIException(status_code=500, message=f"AI Engine subprocess execution failed: {e}")
        
        if result.returncode != 0:
            error_msg = result.stderr.strip() if result.stderr else result.stdout.strip()
            logger.error(f"Inference failed with exit code {result.returncode}. Output: {error_msg}")
            raise APIException(status_code=500, message=f"AI Engine inference failed: {error_msg}")
            
        duration = time.time() - start_time
        logger.info(f"Inference completed in {duration:.2f} seconds.")
        
        # Parse output for stats if possible, otherwise rely on manifest/submission
        try:
            with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            total_cands = manifest.get("total_candidates_processed", 0)
        except Exception:
            total_cands = 0
            
        try:
            with open(SUBMISSION_FILE, "r", encoding="utf-8") as f:
                sub = json.load(f)
            top_cands = len(sub.get("results", []))
        except Exception:
            top_cands = 0
            
        return {
            "status": "success",
            "processing_time": duration,
            "total_candidates": total_cands,
            "top_candidates": top_cands
        }
        
    @staticmethod
    def load_submission() -> dict:
        """
        Loads the generated submission JSON.
        """
        if not os.path.exists(SUBMISSION_FILE):
            raise APIException(status_code=404, message="Submission file not found. Run inference first.")
        try:
            with open(SUBMISSION_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.exception("Failed to parse submission.json")
            raise APIException(status_code=500, message="Failed to parse submission file.")
            
    @staticmethod
    def get_candidate(candidate_id: str) -> dict:
        """
        Retrieves a single candidate from the submission JSON.
        """
        sub = AIEngineService.load_submission()
        results = sub.get("results", [])
        for cand in results:
            if cand.get("candidate_id") == candidate_id:
                return cand
        raise APIException(status_code=404, message=f"Candidate {candidate_id} not found in submission.")
        
    @staticmethod
    def get_manifest() -> dict:
        """
        Loads the generated manifest JSON.
        """
        if not os.path.exists(MANIFEST_FILE):
            raise APIException(status_code=404, message="Manifest file not found. Run inference first.")
        try:
            with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.exception("Failed to parse manifest.json")
            raise APIException(status_code=500, message="Failed to parse manifest file.")
            
    @staticmethod
    def get_cache_status() -> dict:
        """
        Checks the status of the FAISS/embeddings cache.
        """
        cache_valid = os.path.exists(FAISS_FILE) and os.path.exists(IDS_FILE) and os.path.exists(META_FILE)
        
        vectors = 0
        model = "unknown"
        dataset = "unknown"
        
        if cache_valid:
            try:
                with open(META_FILE, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                vectors = meta.get("candidate_count", 0)
                model = meta.get("model", "unknown")
                dataset = meta.get("dataset", "unknown")
            except Exception:
                pass
                
        return {
            "cache": cache_valid,
            "vectors": vectors,
            "model": model,
            "dataset": dataset
        }
        
    @staticmethod
    def get_ai_status() -> dict:
        """
        Verifies the health and readiness of the AI Engine.
        """
        engine_ready = os.path.exists(AI_ENGINE_DIR) and os.path.exists(INFERENCE_SCRIPT)
        cache_status = AIEngineService.get_cache_status()
        
        return {
            "engine": "ready" if engine_ready else "not_ready",
            "cache": "loaded" if cache_status["cache"] else "missing",
            "vectors": cache_status["vectors"]
        }
