# SEMANTIC_RETRIEVAL.md

## Overview
This document specifies the retrieval pipeline used to surface candidates for the ranking engine. Given 100,000 candidates, we must rapidly filter them down to a top-K set to meet the 5-minute overall runtime constraint.

## Retrieval Strategy
We employ a **hybrid retrieval** approach to capture both exact matches (lexical) and intent-based matches (semantic).

### 1. Dense Retrieval (Semantic)
- **Library**: `FAISS`
- **Index Type**: Memory-mapped `IndexFlatIP` (Inner Product) or `IndexIVFFlat` if `IndexFlatIP` exceeds the memory budget.
- **Top-K limit**: $K_{dense} = 500$
- **Expected Latency**: ~5-15 ms per query on CPU.
- **Memory Constraint**: With 100k vectors at 384d float32, index size is ~150 MB. This easily fits in the 16 GB RAM limit.

### 2. Lexical Retrieval (Keyword)
- **Library**: BM25 (via `rank_bm25` or `scikit-learn` TF-IDF)
- **Target Fields**: Skills, current title, past titles.
- **Top-K limit**: $K_{lexical} = 500$
- **Expected Latency**: ~10-20 ms per query.

### 3. Union and Deduplication
The candidates retrieved from both pipelines are unioned into a candidate pool ($|Pool| \le 1000$), on which the Hybrid Scoring Equation is executed.

---
