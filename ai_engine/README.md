# AI Engine

The core AI Candidate Discovery & Intelligent Ranking System.

This module contains the complete inference pipeline for processing 100,000+ candidates, generating semantic embeddings, performing dense vector retrieval, hybrid multi-factor ranking, and generating explainability payloads.

## How to Run

```bash
# From the repository root
python ai_engine/scripts/inference.py
```

## Architecture
```
ai_engine/
├── src/
│   ├── config/         # Centralized settings
│   ├── core/           # Job parser, exceptions
│   ├── data/           # Streaming loader, validator
│   ├── embeddings/     # SentenceTransformer embedder
│   ├── evaluation/     # Pipeline benchmarking
│   ├── explainability/ # Reason generation
│   ├── preprocessing/  # Feature extraction
│   ├── ranking/        # 8-factor hybrid scorer
│   ├── retrieval/      # FAISS dense search
│   └── utils/          # Structured JSON logger
├── scripts/            # Inference and profiling entry points
├── tests/              # Unit and integration tests
├── configs/            # Configuration files
├── models/             # Cached model weights
├── outputs/            # Generated submission artifacts
├── requirements.txt
└── pyproject.toml
```

## Performance
- Processes 100,000 candidates in ~36 seconds (with embedding cache)
- Peak memory: ~16 MB overhead during batch encoding
- Designed for CPU-only environments with ≤ 16GB RAM
