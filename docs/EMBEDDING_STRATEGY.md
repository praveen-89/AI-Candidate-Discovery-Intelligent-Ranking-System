# EMBEDDING_STRATEGY.md

## Overview
This document outlines the strategy for generating dense vector representations of textual candidate data and job requirements.

## Selected Strategy
Instead of blindly picking an embedding model, we will **benchmark** a selection of small, efficient, open-source models suitable for a CPU-only environment with a 16 GB RAM limit.

## Benchmark Candidates
- **BGE (BAAI General Embedding)**: Specifically `bge-small-en-v1.5`
- **E5 (intfloat/e5-small-v2)**: Optimized for retrieval.
- **MiniLM (all-MiniLM-L6-v2)**: Extremely fast, lightweight.
- **GTE (thenlper/gte-small)**: High performance on retrieval tasks.
- **Instructor (hkunlp/instructor-base)**: Instruction-tuned embeddings.

## Evaluation Criteria
Models will be evaluated based on:
1. **Inference Time (CPU)**: Milliseconds per document.
2. **Memory Footprint**: RAM consumed during inference.
3. **Index Size**: Storage footprint (FAISS float32/float16).
4. **Retrieval Quality**: (Offline NDCG proxy if applicable).

## Target Fields
We will embed the following concatenated text fields for candidates:
- `profile.headline`
- `profile.summary`
- `career_history` (concatenation of `title` strings)

## Output Format
Embeddings will be exported as 1D numpy arrays and ingested into a FAISS index.

---
