# PROJECT_OVERVIEW.md

## Vision

Build an **enterprise‑grade AI Candidate Discovery and Intelligent Ranking platform** for the India Runs Data & AI Challenge. The system must rank 100 k candidates against a single job description with a **Top‑100** output that is **explainable**, **accurate**, and generated within **5 minutes** on a **CPU‑only** machine (≤ 16 GB RAM).

## Scope
- End‑to‑end pipeline: Job Understanding → Candidate Parsing → Feature Engineering → Semantic Retrieval → Hybrid Scoring → Reranking → Explainable Ranking → Submission Generation.
- No reliance on external APIs or heavyweight infra (Kafka, Kubernetes, etc.).
- Fully reproducible, modular Python package.

## Success Criteria
- Recall@100 ≥ 0.85 on hidden test set (provided by the challenge).
- Explanation per candidate with ≥ 3 meaningful sentences.
- Runtime ≤ 5 min, memory ≤ 16 GB.
