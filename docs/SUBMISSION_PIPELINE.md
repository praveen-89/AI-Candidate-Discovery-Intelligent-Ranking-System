# SUBMISSION_PIPELINE.md

## Overview
This document describes the workflow for generating the final hackathon submission.

## Pipeline Steps

### 1. Data Ingestion & Preprocessing
- **Input**: `candidates.jsonl`
- **Action**: Stream processing (chunked) to handle 100k records within 16 GB RAM. Cleans schema fields, normalizes data, and computes derived features.
- **Output**: Preprocessed dataframe (in memory) and text corpora for embedding.

### 2. Embedding Generation
- **Action**: Use the selected embedding model (from `BENCHMARKS.md`) to generate dense vectors for the text corpora.
- **Output**: Float32 numpy arrays.

### 3. Index Build
- **Action**: Build FAISS and BM25 indices. 
- **Output**: Saved index files to `data/embeddings/` to avoid recomputing if the process fails. Memory-mapped loading is used for the FAISS index during serving.

### 4. Serving / Inference
- **Input**: Query (e.g., job description keywords).
- **Action**: 
  - Execute dense and lexical retrieval.
  - Compute the Hybrid Score for the candidate pool.
  - Generate explainability payloads.
- **Output**: JSON payload of the top-100 ranked candidates.

## Artifact Versioning
We will use a simple `manifest.json` in the `outputs/` folder to track the dataset version, model used, and index timestamp to ensure reproducibility.

---
