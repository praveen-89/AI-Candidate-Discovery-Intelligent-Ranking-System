# SYSTEM_REQUIREMENTS.md

## Functional Requirements
- Ingest `candidates.jsonl` (≈100k records) and a single `job_description.docx`.
- Produce a CSV of top‑100 ranked candidates with natural‑language explanations.
- Validate output against `submission_spec.docx` using `validate_submission.py`.

## Non‑Functional Requirements
- **Performance:** end‑to‑end runtime < 5 minutes on CPU‑only, ≤ 16 GB RAM.
- **Explainability:** each ranking entry must contain at least three reason sentences.
- **Reliability:** handle missing fields gracefully; no crashes on malformed data.
- **Portability:** pure Python package, runnable on Windows/Linux without external services.
- **Reproducibility:** deterministic ranking given the same seed and data.

---
