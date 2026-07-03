# FEATURE_IMPORTANCE.md

## Overview
This document quantifies the **ranking relevance** of each field in `candidate_schema.json` for the **Senior AI Engineer** role. The importance scores (★ out of 5) reflect how heavily the field should influence the final hybrid score after the **Architecture Review**.

| Field | ★ Importance | Feature Category | How it contributes to ranking | Pre‑processing / Notes |
|---|---|---|---|---|
| `candidate_id` | ★★ | Identifier | Used only for de‑duplication / output; no predictive power. | Keep as string, no transformation. |
| `profile.anonymized_name` | ★ | Text (identity) | Not used for ranking (privacy). | Drop from feature set. |
| `profile.headline` | ★★★★ | Text (semantic) | Captures concise self‑description; strong cue for seniority & domain. | Lower‑case, strip punctuation, embed. |
| `profile.summary` | ★★★★★ | Text (semantic) | Provides rich context for experience, projects, and tech stack. | Sentence‑segmentation, embed, TF‑IDF fallback. |
| `profile.location` | ★★ | Structured | Helps enforce location constraint (Pune/Noida). | Normalise city names, map to Tier‑1 flag. |
| `profile.country` | ★ | Structured | Mostly India; can be used for sanity checks. |
| `profile.years_of_experience` | ★★★★★ | Numeric | Direct seniority signal; higher years generally better but must be capped. | Impute missing with median; bucketize (0‑2,3‑5,6‑10,>10). |
| `career_history` (array) | ★★★★★ | Structured & Text | Titles, companies, dates give **career trajectory** and **domain relevance**. | Parse each entry, extract title embeddings, compute recency weight. |
| `education` | ★★ | Structured | Institution tier & degree level act as background signal. | Map institutions to tier (top‑10, mid, others). |
| `skills` (array) | ★★★★★ | Text (semantic) | Direct match to required technical stack (embeddings, vector DB, LLM). | Extract unique skills, compute numeric aggregate (counts, max proficiency), avoid TF-IDF. |
| `redrob_signals.profile_views_received_30d` | ★★★★ | Behavioral | Recent platform activity correlates with candidate availability. | Normalise to [0,1]; multiply final score. |
| `redrob_signals.recruiter_response_rate` | ★★★★ | Behavioral | Recruiter response rate indicates engagement. | Normalise; treat low values as penalty. |
| `redrob_signals.expected_salary_range_inr_lpa` | ★★ | Numeric | Used for **budget fitting**; not primary ranking but filter. | Cap at 300k USD equivalent, treat as soft constraint. |
| `redrob_signals.last_active_date` | ★★★ | Behavioral | Freshness of profile; stale profiles down‑weighted. | Compute days since last active, map to decay factor. |
| `derived.career_span_years` | ★★★★ | Numeric | Total time from first start_date to last end_date/current. | Compute from `career_history`, use as consistency check against `years_of_experience`. |
| `derived.location_tier_1` | ★★★ | Boolean | Matches Pune/Noida or Tier-1 cities constraint. | Binary flag based on `profile.location`. |

## Feature‑Category Summary
- **Semantic Text** – `headline`, `summary`, `career_history.title`
- **Structured Numeric** – `years_of_experience`, `redrob_signals.expected_salary_range_inr_lpa`, `derived.career_span_years`
- **Behavioral Signals** – `redrob_signals.profile_views_received_30d`, `redrob_signals.recruiter_response_rate`, `redrob_signals.last_active_date`
- **Location / Geography** – `location`, `country`, `derived.location_tier_1`
- **Identifier** – `candidate_id`

---
