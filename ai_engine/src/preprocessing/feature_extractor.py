"""
Feature engineering module: extracts structured, behavioral, and derived features
from a single candidate dictionary. Every feature is documented in FEATURE_IMPORTANCE.md.

This module does NOT handle semantic text features (embeddings) — those live in
the retrieval/embedding phase. It only produces numeric and boolean signals
that feed into the hybrid scoring equation.
"""

import math
from datetime import datetime, date
from typing import Dict, Any, Optional, List

from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# ──────────────────────────────────────────────
# Helper functions
# ──────────────────────────────────────────────
_CACHE_REF_DATE: Optional[datetime] = None

def _get_reference_date() -> datetime:
    global _CACHE_REF_DATE
    if _CACHE_REF_DATE is None:
        try:
            _CACHE_REF_DATE = datetime.strptime(settings.REFERENCE_DATE_STR, "%Y-%m-%d")
        except ValueError:
            _CACHE_REF_DATE = datetime(2026, 7, 1)
    return _CACHE_REF_DATE

def _parse_date(date_str: Optional[str]) -> Optional[date]:
    """Parse an ISO date string into a date object, returning None on failure."""
    if not date_str or not isinstance(date_str, str):
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None


def _days_since(date_str: Optional[str]) -> Optional[float]:
    """Return the number of days between a date string and REFERENCE_DATE."""
    d = _parse_date(date_str)
    if d is None:
        return None
    ref_date = _get_reference_date()
    delta = ref_date.date() - d
    return max(delta.days, 0)


def _min_max_clamp(value: float, lo: float, hi: float) -> float:
    """Clamp a value into [lo, hi] then normalize to [0, 1]."""
    if hi == lo:
        return 0.5
    clamped = max(lo, min(hi, value))
    return (clamped - lo) / (hi - lo)


# ──────────────────────────────────────────────
# Feature extractors
# ──────────────────────────────────────────────

def extract_behavioral_score(cand: Dict[str, Any]) -> float:
    """
    S_behavioral ∈ [0, 1].
    Composite of three sub-signals as defined in HYBRID_RANKING.md:
      0.5 * recruiter_response_rate
    + 0.3 * normalized_profile_views
    + 0.2 * last_active_decay
    """
    signals = cand.get("redrob_signals", {})

    # 1. Recruiter response rate (already 0-1)
    response_rate = signals.get("recruiter_response_rate")
    if response_rate is None or not isinstance(response_rate, (int, float)):
        response_rate = 0.0
    response_rate = max(0.0, min(1.0, float(response_rate)))

    # 2. Profile views (normalize: assume max ~200 views in 30d)
    views = signals.get("profile_views_received_30d")
    if views is None or not isinstance(views, (int, float)):
        views = 0.0
    norm_views = _min_max_clamp(float(views), 0.0, 200.0)

    # 3. Last active decay: e^(-lambda * days_since_active), lambda = 0.01
    days = _days_since(signals.get("last_active_date"))
    if days is None:
        decay = 0.3  # weak neutral if missing
    else:
        lam = 0.01
        decay = math.exp(-lam * days)

    return 0.5 * response_rate + 0.3 * norm_views + 0.2 * decay


def extract_career_span_years(cand: Dict[str, Any]) -> float:
    """
    derived.career_span_years: total time from first start_date to last end_date.
    """
    history = cand.get("career_history", [])
    if not history:
        return 0.0

    earliest = None
    latest = None
    ref_date = _get_reference_date().date()

    for job in history:
        start = _parse_date(job.get("start_date"))
        end = _parse_date(job.get("end_date"))

        if start and (earliest is None or start < earliest):
            earliest = start
        if end and (latest is None or end > latest):
            latest = end
        # If current role, use reference date as end
        if job.get("is_current", False):
            if latest is None or ref_date > latest:
                latest = ref_date

    if earliest and latest:
        return max((latest - earliest).days / 365.25, 0.0)
    return 0.0


def extract_location_tier_1(cand: Dict[str, Any]) -> bool:
    """
    derived.location_tier_1: True if the candidate is in a Tier-1 city.
    """
    location = (cand.get("profile", {}).get("location") or "").lower().strip()
    return any(city in location for city in settings.TIER_1_CITIES)


def extract_education_tier_score(cand: Dict[str, Any]) -> float:
    """
    Education quality signal ∈ [0, 1].
    Uses the schema-provided 'tier' field.
    """
    edu_list = cand.get("education", [])
    if not edu_list:
        return 0.3  # neutral default

    tier_scores = {
        "tier_1": 1.0,
        "tier_2": 0.75,
        "tier_3": 0.5,
        "tier_4": 0.3,
        "unknown": 0.3,
    }

    best = 0.0
    for edu in edu_list:
        tier = edu.get("tier", "unknown")
        score = tier_scores.get(tier, 0.3)
        best = max(best, score)
    return best


def extract_all_features(cand: Dict[str, Any]) -> Dict[str, Any]:
    """
    Master function: extracts all numeric/boolean features from a single candidate.
    Returns a flat dictionary ready for the hybrid scoring engine.
    """
    cand_id = cand.get("candidate_id", "UNKNOWN")

    skills = cand.get("skills", [])
    raw_skills = [s.get("name", "").lower() for s in skills if s.get("name")]
    industry = (cand.get("profile", {}).get("industry") or "").lower()

    features = {
        "candidate_id": cand_id,
        "behavioral_score": extract_behavioral_score(cand),
        "career_span_years": extract_career_span_years(cand),
        "location_tier_1": extract_location_tier_1(cand),
        "education_tier_score": extract_education_tier_score(cand),
        "years_of_experience": cand.get("profile", {}).get("years_of_experience"),
        "recruiter_response_rate": cand.get("redrob_signals", {}).get("recruiter_response_rate"),
        "profile_views_30d": cand.get("redrob_signals", {}).get("profile_views_received_30d"),
        "open_to_work": cand.get("redrob_signals", {}).get("open_to_work_flag", False),
        "github_activity_score": cand.get("redrob_signals", {}).get("github_activity_score"),
        "raw_skills": raw_skills,
        "industry": industry,
    }

    return features
