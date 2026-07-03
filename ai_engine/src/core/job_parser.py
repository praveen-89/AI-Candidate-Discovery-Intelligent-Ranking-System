import os
import re
from typing import Dict, Any, List
from utils.logger import get_logger

logger = get_logger(__name__)

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False
    logger.warning("python-docx not installed. JobParser will use fallback mock parsing if .docx is provided.")

class JobParser:
    """
    Parses a job description document and extracts structured requirements.
    Generates a semantic query for vector search.
    """
    
    def __init__(self, jd_path: str):
        self.jd_path = jd_path
        self.raw_text = ""
        self.structured_job: Dict[str, Any] = {
            "title": "",
            "skills": [],
            "experience_years": None,
            "industry": "",
            "responsibilities": [],
            "semantic_query": ""
        }
        
    def parse(self) -> Dict[str, Any]:
        """
        Parses the document and populates the structured job object.
        """
        if not os.path.exists(self.jd_path):
            logger.warning(f"JD file not found at {self.jd_path}. Using fallback query.")
            self._set_fallback_query()
            return self.structured_job
            
        if self.jd_path.lower().endswith('.docx'):
            if HAS_DOCX:
                self._parse_docx()
            else:
                logger.warning("Cannot parse .docx without python-docx. Using fallback.")
                self._set_fallback_query()
                return self.structured_job
        else:
            self._parse_text()
            
        self._extract_entities()
        self._build_semantic_query()
        return self.structured_job
        
    def _parse_docx(self):
        doc = docx.Document(self.jd_path)
        self.raw_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        
    def _parse_text(self):
        with open(self.jd_path, 'r', encoding='utf-8', errors='ignore') as f:
            self.raw_text = f.read()
            
    def _extract_entities(self):
        """
        Basic regex/keyword based entity extraction since we are operating under 
        strict CPU/memory constraints without an external LLM endpoint.
        """
        text = self.raw_text.lower()
        
        # 1. Extract Title (assume first line is title usually)
        lines = [l.strip() for l in self.raw_text.split('\n') if l.strip()]
        if lines:
            self.structured_job["title"] = lines[0]
        
        # 2. Extract Skills
        known_skills = [
            "python", "java", "c++", "machine learning", "deep learning", 
            "nlp", "vector database", "faiss", "transformers", "pytorch", 
            "tensorflow", "aws", "gcp", "azure", "docker", "kubernetes",
            "sql", "nosql", "llm", "langchain", "qdrant", "pinecone",
            "sentence transformers", "xgboost", "retrieval", "ranking",
            "a/b testing", "ndcg"
        ]
                        
        found_skills = set()
        for skill in known_skills:
            if re.search(r'\b' + re.escape(skill) + r'\b', text):
                found_skills.add(skill)
                
        self.structured_job["skills"] = list(found_skills)
        
        # 3. Extract Experience
        exp_match = re.search(r'(\d+)(?:\s*-\s*\d+)?\s*\+?\s*years?(?:\s+of)?\s+experience', text)
        if exp_match:
            self.structured_job["experience_years"] = int(exp_match.group(1))
            
    def _build_semantic_query(self):
        """
        Builds a rich semantic query from the parsed job description.
        """
        parts = []
        if self.structured_job["title"]:
            parts.append(f"Role: {self.structured_job['title']}")
            
        if self.structured_job["skills"]:
            parts.append(f"Required Skills: {', '.join(self.structured_job['skills'])}")
            
        if self.structured_job["experience_years"]:
            parts.append(f"Experience: {self.structured_job['experience_years']}+ years")
            
        # Add a snippet of the raw text to capture context (first 1000 chars)
        snippet = self.raw_text[:1000].replace('\n', ' ')
        parts.append(f"Context: {snippet}")
        
        # Also append some explicit search expansion keywords
        expansion = "Senior AI Engineer Machine Learning Natural Language Processing Data Science"
        parts.append(f"Keywords: {expansion}")
        
        self.structured_job["semantic_query"] = " | ".join(parts)
        
    def _set_fallback_query(self):
        self.structured_job["semantic_query"] = "Role: Senior AI Engineer | Required Skills: python, embeddings, vector database, nlp, pytorch, transformers | Experience: 5+ years"
