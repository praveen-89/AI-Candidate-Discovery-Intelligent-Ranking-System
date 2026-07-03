# PROBLEM_STATEMENT.md

## Business Problem

The **India Runs Data & AI Challenge** requires an **enterprise‑grade AI Candidate Discovery and Intelligent Ranking** system that can:

1. **Ingest** a static dataset of ~100 000 candidate profiles (JSONL) and a single job description (DOCX). 
2. **Understand** the recruiter’s hidden and explicit requirements (seniority, technical stack, soft‑skill expectations, compensation constraints, location preferences). 
3. **Score** each candidate using a **hybrid approach** that combines:
   - Semantic similarity between the job description and candidate textual fields (headline, summary, career titles, etc.).
   - Structured signals (years of experience, industry, company size, education tier, skill proficiency). 
   - Behavioral signals from the Redrob platform (activity, response rate, GitHub activity, salary expectations, etc.).
4. **Rerank** the initial retrieval results using additional handcrafted or unsupervised heuristics (no supervised labels are provided). 
5. **Explain** the ranking rationale for the top‑100 candidates in natural language (e.g., “Strong relevance to required backend technologies, high activity score, and recent experience in fintech”).
6. **Generate** a submission CSV that conforms to `submission_spec.docx` and passes the validator script `validate_submission.py`.

## Success Metrics (as defined by the challenge)
- **Recall@100** ≥ 0.85 on the hidden test set.
- **Explainability** – each top‑100 entry must include at least three concise reason sentences.
- **Runtime** – full end‑to‑end pipeline runs in **< 5 minutes** on a **CPU‑only** machine with **≤ 16 GB RAM**.
- **Robustness** – the system must handle missing or malformed fields gracefully (e.g., missing GitHub score).

## Constraints
- No external APIs or cloud services; everything runs locally. 
- No heavyweight distributed infrastructure (Kafka, Kubernetes, Redis, etc.). 
- Only open‑source Python libraries are permitted (e.g., `sentence‑transformers`, `faiss‑cpu`, `pandas`).

---
