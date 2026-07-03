# INNOVATION.md

## Overview
This document highlights the unique differentiators, design trade-offs, and key innovations of our candidate ranking engine for the India Runs Data & AI Challenge.

## Key Innovations

### 1. Constraint-Aware Hybrid Ranking
Instead of deploying a resource-heavy Learning-to-Rank (LTR) model, we utilize a deterministic, tunable hybrid scoring equation. This approach provides:
- **Zero-shot adaptability**: No need for explicit training labels.
- **Extreme Efficiency**: Executes well within the 16 GB RAM and CPU-only limits.
- **Explainability**: Allows exact tracing of how semantic, lexical, and behavioral signals influence the final score.

### 2. Behavioral Decay Penalty
We integrated Redrob platform signals directly into the ranking algorithm using a time-decay penalty for stale profiles (`last_active_date`). This ensures recruiters see active, engaged candidates first, directly boosting real-world metrics like Interview Request Rate.

### 3. Lightweight Semantic Retrieval
By explicitly benchmarking and selecting `BAAI/bge-small-en-v1.5`, we achieve state-of-the-art semantic matching on a fraction of the compute budget required by larger transformer models, allowing 100k vectors to comfortably reside in RAM via FAISS.

## Design Trade-Offs
- **No LLM Re-Ranking**: While LLMs can provide nuanced evaluation, running a local LLM on 100k candidates within 5 minutes on a CPU is mathematically impossible. We traded maximum nuance for speed and determinism.
- **Pre-computed Embeddings vs On-the-fly**: We compute candidate embeddings offline. Only the search query is embedded at runtime, ensuring sub-second retrieval latency.
- **No Pseudo-labels**: We consciously avoided generating synthetic labels with an LLM for offline training, as this often forces the ranking model to learn the biases of the specific LLM used for generation, rather than true recruiter intent.

## Future Enhancements
- **Click-Through-Rate (CTR) Feedback Loop**: If deployed in production, implicit recruiter feedback (clicks, interview requests) could be fed into a lightweight XGBoost LambdaMART model.
- **Multi-lingual Support**: Swapping the embedding model for a multi-lingual variant (e.g., `bge-m3`) to support non-English resumes.

---
