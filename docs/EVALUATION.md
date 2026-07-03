# EVALUATION.md

## Overview
This document describes how we will evaluate the performance of the ranking engine, considering the lack of ground-truth relevance labels in the dataset.

## 1. Internal Comparative Metrics & Qualitative Analysis
Without explicit labels, we avoid supervised ranking assumptions. Instead, we evaluate strategies through:
- **Retrieval Coverage**: Ensuring the semantic retrieval pipeline returns known strong candidates (based on explicit JD constraints) that lexical models might miss.
- **Qualitative Relevance Analysis**: Manual review of the top 20 candidates across varying queries to ensure the scoring engine balances semantic match, seniority, and behavioural signals effectively.
- **Score Distribution Analysis**: Monitoring the distribution of the hybrid score to ensure no single feature dominates the ranking incorrectly.

## 2. Operational Metrics
We will evaluate the system's operational viability against the strict hackathon constraints:
- **Latency**: End-to-end time for a query to return 100 results must be < 5 minutes for the entire dataset.
- **Memory**: Peak RAM usage must stay below 16 GB during the indexing and retrieval process.
- **CPU Efficiency**: Single-core or multi-core usage without relying on accelerators.

## 3. Online Evaluation (Future)
- **A/B Testing Framework**: In production, the system will route a percentage of traffic to the v2 model.
- **KPIs**: 
  - Recruiter Click-Through Rate (CTR) on candidate profiles.
  - Interview Request Rate.
  - Time-to-hire.

---
