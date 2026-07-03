from typing import Dict, Any, List, Tuple
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class HybridRanker:
    """
    Implements the linear blend scoring equation.
    Combines semantic similarity and independent features into a unified score.
    """
    def __init__(self):
        self.weights = {
            "semantic": settings.WEIGHT_SEMANTIC,
            "skill": settings.WEIGHT_SKILL,
            "experience": settings.WEIGHT_EXPERIENCE,
            "career": settings.WEIGHT_CAREER,
            "education": settings.WEIGHT_EDUCATION,
            "behavioral": settings.WEIGHT_BEHAVIORAL,
            "availability": settings.WEIGHT_AVAILABILITY,
            "location": settings.WEIGHT_LOCATION
        }
        
        # Normalize weights
        total_weight = sum(self.weights.values())
        if abs(total_weight - 1.0) > 1e-5:
            logger.warning(f"Hybrid weights sum to {total_weight}, not 1.0. Normalizing internally.")
            for k in self.weights:
                self.weights[k] /= total_weight

    def _score_semantic(self, sem_score: float) -> float:
        return max(0.0, min(1.0, float(sem_score)))
        
    def _score_skill(self, features: Dict[str, Any], structured_job: Dict[str, Any]) -> float:
        req_skills = [s.lower() for s in structured_job.get("skills", [])]
        cand_skills = features.get("raw_skills", [])
        if not req_skills:
            return 0.5
        if not cand_skills:
            return 0.0
            
        match_count = sum(1 for req_s in req_skills if any(req_s in cand_s for cand_s in cand_skills))
        return min(1.0, match_count / len(req_skills))

    def _score_experience(self, features: Dict[str, Any], structured_job: Dict[str, Any]) -> float:
        req_exp = structured_job.get("experience_years")
        yoe = features.get("years_of_experience")
        if req_exp is None or yoe is None:
            return features.get("experience_score", 0.5) 
            
        yoe = float(yoe)
        if yoe >= req_exp:
            return 1.0
        elif yoe >= req_exp - 2:
            return 0.5
        return 0.0

    def _score_career(self, features: Dict[str, Any]) -> float:
        span = features.get("career_span_years", 0)
        return min(1.0, span / 10.0)

    def _score_education(self, features: Dict[str, Any]) -> float:
        return features.get("education_tier_score", 0.3)

    def _score_behavioral(self, features: Dict[str, Any]) -> float:
        return features.get("behavioral_score", 0.3)

    def _score_availability(self, features: Dict[str, Any]) -> float:
        return 1.0 if features.get("open_to_work") else 0.5

    def _score_location(self, features: Dict[str, Any]) -> float:
        return 1.0 if features.get("location_tier_1") else 0.5

    def score_candidates(
        self, 
        candidates_features: Dict[str, Dict[str, Any]], 
        semantic_scores: Dict[str, float],
        structured_job: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Calculates final ranking scores by applying independent sub-scoring functions.
        """
        results = []
        for cand_id, features in candidates_features.items():
            sem_val = semantic_scores.get(cand_id, 0.0)
            
            sub_scores = {
                "semantic": self._score_semantic(sem_val),
                "skill": self._score_skill(features, structured_job),
                "experience": self._score_experience(features, structured_job),
                "career": self._score_career(features),
                "education": self._score_education(features),
                "behavioral": self._score_behavioral(features),
                "availability": self._score_availability(features),
                "location": self._score_location(features)
            }
            
            final_score = sum(sub_scores[k] * self.weights[k] for k in sub_scores)
            
            results.append({
                "candidate_id": cand_id,
                "final_score": round(final_score, 4),
                "sub_scores": {k: round(v, 4) for k, v in sub_scores.items()}
            })
            
        results.sort(key=lambda x: x["final_score"], reverse=True)
        return results
