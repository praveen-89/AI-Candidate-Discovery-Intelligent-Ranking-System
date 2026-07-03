# BENCHMARKS.md

## Overview
This document contains the evaluation of various open-source embedding models to ensure they meet the Hackathon's strict constraints: **CPU-only execution, 16 GB RAM limit, and <5 minute total runtime**.

## Model Candidates

| Model | Parameters | Dimensions | CPU Latency (ms / 100 docs) | FAISS Index RAM (100k) |
|---|---|---|---|---|
| **all-MiniLM-L6-v2** | 22M | 384 | ~150 ms | ~150 MB |
| **BAAI/bge-small-en-v1.5** | 33M | 384 | ~220 ms | ~150 MB |
| **intfloat/e5-small-v2** | 33M | 384 | ~220 ms | ~150 MB |
| **thenlper/gte-small** | 33M | 384 | ~220 ms | ~150 MB |
| **hkunlp/instructor-base** | 110M | 768 | ~700 ms | ~300 MB |

*Note: Latency estimates are based on typical Intel Core i7 / AMD Ryzen CPU performance using PyTorch inference without quantization. Index RAM assumes float32 dense vectors (4 bytes per dimension).*

## Analysis & Decision
1. **Latency**: The hackathon SLA requires processing 100k candidates. Pre-computing embeddings for the 100k candidates offline is standard. During inference (query time), we only embed the recruiter's query (1 document), which takes < 10ms for all models.
2. **RAM**: 16 GB is plenty for any of these models. The FAISS index for 384-dimensional models will consume ~150 MB. 
3. **Quality vs Size**: `BAAI/bge-small-en-v1.5` and `intfloat/e5-small-v2` consistently top the MTEB (Massive Text Embedding Benchmark) for small models, heavily outperforming MiniLM despite similar memory footprints.

**Selected Model**: We will proceed with **`BAAI/bge-small-en-v1.5`** for dense semantic retrieval due to its superior semantic matching capability on English text and minimal CPU/RAM footprint.

---
