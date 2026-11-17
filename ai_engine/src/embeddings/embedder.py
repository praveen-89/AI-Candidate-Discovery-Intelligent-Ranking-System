import random
import math
from typing import List
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# Fallback mechanism if sentence_transformers cannot be compiled in the current OS environment.
try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False
    logger.warning("sentence-transformers not installed. Using MockEmbedder for pipeline validation.")

class CandidateEmbedder:
    """
    Handles generation of semantic embeddings for candidates using a pre-trained small model.
    Falls back to a random deterministic mock embedder using pure Python if dependencies fail.
    """
    def __init__(self):
        self.dim = settings.EMBEDDING_DIMENSION
        self.model_name = settings.EMBEDDING_MODEL_NAME
        
        if HAS_SENTENCE_TRANSFORMERS:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name, device="cpu")
        else:
            self.model = None
            random.seed(42)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Embed a list of text strings into a list of floats (shape N x dim).
        """
        if not texts:
            return []
            
        if self.model:
            bs = settings.BATCH_SIZE
            embeddings = self.model.encode(
                texts, 
                batch_size=bs,
                convert_to_numpy=True, 
                normalize_embeddings=True,
                show_progress_bar=True
            )
            return embeddings.tolist()
        else:
            # MOCK EMBEDDER: Generate deterministic vectors using pure python
            mock_embeddings = []
            for _ in texts:
                vec = [random.gauss(0, 1) for _ in range(self.dim)]
                norm = math.sqrt(sum(v*v for v in vec))
                if norm == 0: norm = 1
                mock_embeddings.append([v/norm for v in vec])
            return mock_embeddings

def build_candidate_text(cand: dict) -> str:
    """
    Constructs the rich text document that represents a candidate for embedding.
    Uses extensive profile, career history, skills, education, and redrob signals.
    """
    profile = cand.get("profile", {})
    signals = cand.get("redrob_signals", {})
    
    parts = []
    
    # Profile Basics
    headline = profile.get("headline") or ""
    summary = profile.get("summary") or ""
    yoe = profile.get("years_of_experience")
    industry = profile.get("current_industry") or profile.get("industry") or ""
    
    if headline: parts.append(f"Headline: {headline}")
    if yoe is not None: parts.append(f"Experience: {yoe} years")
    if industry: parts.append(f"Industry: {industry}")
    if summary: parts.append(f"Summary: {summary}")
    
    # Career History
    career = cand.get("career_history", [])
    if career:
        parts.append("Career History:")
        for job in career:
            title = job.get("title") or ""
            company = job.get("company") or job.get("company_name") or ""
            desc = job.get("description") or ""
            is_current = " (Current)" if job.get("is_current") else ""
            if title or company:
                parts.append(f"- {title} at {company}{is_current}. {desc}")
                
    # Skills
    skills = cand.get("skills", [])
    if skills:
        skill_strs = []
        for s in skills:
            name = s.get("name")
            prof = s.get("proficiency")
            if name:
                skill_strs.append(f"{name} ({prof})" if prof else name)
        parts.append(f"Skills: {', '.join(skill_strs)}")
        
    # Education
    edu_list = cand.get("education", [])
    if edu_list:
        edu_strs = []
        for edu in edu_list:
            degree = edu.get("degree") or edu.get("degree_name") or ""
            field = edu.get("field_of_study") or ""
            inst = edu.get("institution") or edu.get("institution_name") or ""
            if degree or field:
                edu_strs.append(f"{degree} in {field} from {inst}")
        parts.append(f"Education: {'; '.join(edu_strs)}")
        
    # Certifications & Languages
    certs = cand.get("certifications", [])
    if certs:
        cert_names = [c.get("name") for c in certs if c.get("name")]
        if cert_names:
            parts.append(f"Certifications: {', '.join(cert_names)}")
            
    langs = cand.get("languages", [])
    if langs:
        lang_names = [l.get("name") for l in langs if l.get("name")]
        if lang_names:
            parts.append(f"Languages: {', '.join(lang_names)}")
            
    # Signals
    open_to_work = signals.get("open_to_work_flag")
    work_mode = signals.get("preferred_work_mode")
    notice = signals.get("notice_period_days")
    github = signals.get("github_activity_score")
    connections = signals.get("connection_count")
    
    if open_to_work: parts.append("Open to work")
    if work_mode: parts.append(f"Preferred Work Mode: {work_mode}")
    if notice is not None: parts.append(f"Notice Period: {notice} days")
    if github is not None: parts.append(f"GitHub Score: {github}")
    if connections is not None: parts.append(f"Connections: {connections}")
    
    text = " | ".join(p.strip() for p in parts if p and str(p).strip())
    
    import re
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
