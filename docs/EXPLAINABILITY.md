# EXPLAINABILITY.md

## Overview
This document specifies how the ranking engine explains its decisions. An opaque neural score is unacceptable; recruiters need to know *why* a candidate was ranked highly.

## Explainability Format
Every candidate in the top-100 results will include a `reasons` payload alongside their final score.

### 1. Feature Contribution Breakdown
The hybrid score is a linear combination of normalized components. We can output the percentage contribution of each component to the candidate's final score:
```json
{
  "semantic_contribution_pct": 52.0,
  "lexical_contribution_pct": 18.0,
  "experience_contribution_pct": 20.0,
  "behavioral_contribution_pct": 10.0
}
```

### 2. Human-Readable Reasons
We will map threshold triggers to human-readable strings.
- **Semantic/Lexical match**: "Strong match on 'Sentence Transformers' and 'Vector Databases'."
- **Experience match**: "Has 7 years of experience, perfectly matching the 5-9 year requirement."
- **Behavioral bump**: "Highly responsive on the platform (85% recruiter response rate)."
- **Location**: "Located in Tier-1 city (Pune)."

## Logging and Audit
The system will log a JSON structure for every query execution containing the query text, the candidate IDs of the top 100, and their `reasons` payloads. This provides an audit trail for offline evaluation.

---
