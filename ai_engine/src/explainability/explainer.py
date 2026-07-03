from typing import Dict, Any, List
from config.settings import settings

class CandidateExplainer:
    """
    Generates human-readable reasons and feature contribution breakdowns
    for the final ranked candidates.
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
        
        total_weight = sum(self.weights.values())
        if abs(total_weight - 1.0) > 1e-5:
            for k in self.weights:
                self.weights[k] /= total_weight

    def generate_explanation(self, rank_result: Dict[str, Any], raw_features: Dict[str, Any], structured_job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Takes the output of the ranker, raw features, and the job description to generate 
        the extensive `reasons` payload.
        """
        sub_scores = rank_result.get("sub_scores", {})
        final_score = rank_result.get("final_score", 0.0001)
        if final_score == 0:
            final_score = 0.0001  # Prevent division by zero
            
        # 1. Feature Contribution Breakdown
        contributions = {}
        for k, weight in self.weights.items():
            score = sub_scores.get(k, 0.0)
            contrib_pct = (score * weight) / final_score * 100
            contributions[f"{k}_contribution_pct"] = round(contrib_pct, 1)
            
        # 2. Extract Matching/Missing Skills
        req_skills = [s.lower() for s in structured_job.get("skills", [])]
        cand_skills = raw_features.get("raw_skills", [])
        
        matched_skills = [s for s in req_skills if any(s in cs for cs in cand_skills)]
        missing_skills = [s for s in req_skills if not any(s in cs for cs in cand_skills)]
        
        yoe = raw_features.get("years_of_experience")
        req_exp = structured_job.get("experience_years")
        
        # 3. Human-Readable Reasons
        human_reasons = []
        
        if matched_skills:
            human_reasons.append(f"Strong match for required skills: {', '.join(matched_skills)}.")
            
        if yoe is not None and req_exp is not None:
            if float(yoe) >= req_exp:
                human_reasons.append(f"Exceeds experience requirement with {yoe} years.")
            elif float(yoe) >= req_exp - 2:
                human_reasons.append(f"Close to experience requirement with {yoe} years.")
                
        if sub_scores.get("semantic", 0) > 0.7:
            human_reasons.append("High semantic similarity to the core job description.")
            
        if raw_features.get("location_tier_1"):
            human_reasons.append("Located in a preferred Tier-1 city.")
            
        if raw_features.get("open_to_work"):
            human_reasons.append("Candidate is actively looking for new opportunities.")
            
        return {
            "top_matching_skills": matched_skills,
            "missing_requirements": missing_skills,
            "matched_experience": yoe,
            "why_candidate_matches": human_reasons,
            "ranking_score_breakdown": contributions
        }
