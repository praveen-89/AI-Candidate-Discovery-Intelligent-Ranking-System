# HYBRID_RANKING.md

## Overview
This document specifies the hybrid scoring equation used to rank candidates in the final candidate pool.

## The Hybrid Scoring Equation
We combine multiple signals into a single score $S_{final}$ using a linear blend of normalized sub-scores. This avoids the complexity of learning-to-rank without labels while providing an explainable output.

$$S_{final} = \alpha S_{semantic} + \beta S_{lexical} + \gamma S_{experience} + \delta S_{behavioral}$$

Where:
- $S_{semantic} \in [0, 1]$: FAISS Inner Product score, min-max normalized.
- $S_{lexical} \in [0, 1]$: BM25 score, min-max normalized.
- $S_{experience} \in [0, 1]$: Based on `years_of_experience` matching the 5-9 years JD requirement (e.g., Gaussian penalty outside the range).
- $S_{behavioral} \in [0, 1]$: An aggregated score derived from Redrob platform signals.

### Behavioral Sub-Score
$$S_{behavioral} = 0.5 \cdot (recruiter\_response\_rate) + 0.3 \cdot (\text{normalized } profile\_views\_received\_30d) + 0.2 \cdot (last\_active\_decay)$$
- $last\_active\_decay$: An exponential decay function $e^{-\lambda \cdot days\_since\_active}$.

## Tunable Parameters
The weights ($\alpha, \beta, \gamma, \delta$) will be tuned manually or via grid search on offline pseudo-labels. Initial priors:
- $\alpha = 0.40$ (Semantic matching is paramount)
- $\beta = 0.20$ (Keyword matching for specific tech stacks)
- $\gamma = 0.25$ (Seniority matching)
- $\delta = 0.15$ (Platform engagement)

## Hard Filters (Multipliers)
- Disqualifiers act as binary multipliers (0 or 1).
- Example: If expected salary > $300k, multiplier = 0.

---
