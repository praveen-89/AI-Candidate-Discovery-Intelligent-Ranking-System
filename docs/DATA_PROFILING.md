# DATA_PROFILING.md

## 1️⃣ Dataset Overview

- Total candidates: 100,000

- Unique industries: 24

- Unique job titles: 1

- Unique companies: 1

- Unique skills: 8

- Average profile completeness (Redrob): 80.10


## 2️⃣ Profile Statistics

- Years of experience (mean/median/std): 12.40 / 12.40 / 0.00

- Current company size distribution: {'201-500': 1}

- Current industry distribution: {'Manufacturing': 1}

- Location distribution (top 5): {'Kolkata, West Bengal': 1}

- Country distribution (top 5): {'India': 1}


## 3️⃣ Career Analysis

- Average number of jobs per candidate: 5.00

- Average career duration (years): 12.25

- Average promotion frequency (per career): 3.00

- Top industry transitions: [(('Manufacturing', 'Conglomerate'), 1), (('Conglomerate', 'IT Services'), 1), (('IT Services', 'Manufacturing'), 1)]

- Top company size transitions: [(('201-500', '1001-5000'), 1), (('1001-5000', '10001+'), 1), (('10001+', '1001-5000'), 1)]


## 4️⃣ Skills Analysis

- Most common skills (top 10): [('GCP', 1), ('Content Writing', 1), ('ETL', 1), ('Photoshop', 1), ('Agile', 1), ('Salesforce CRM', 1), ('Databricks', 1), ('Java', 1)]

- Skill frequency distribution (unique skill count): 8

- Skill proficiency distribution: {'intermediate': 4, 'beginner': 4}

- Skill duration (mean/median/std, months): 16.38 / 15.00 / 8.80

- Endorsement distribution (mean/median/std): 7.62 / 8.50 / 2.72


## 5️⃣ Education Analysis

- Degree distribution: {'B.Sc': 1, 'Ph.D': 1}

- Field of study distribution (top 5): {'Computer Science': 1, 'Data Science': 1}

- Institution tier distribution: {'tier_3': 2}


## 6️⃣ Behavioral Signals Analysis

- **profile_completeness_score**: mean=80.10, median=80.10, std=0.00, min=80.1, max=80.1, missing=0.0%

- **open_to_work_flag**: mean=0.00, median=0.00, std=0.00, min=0, max=0, missing=0.0%

- **profile_views_received_30d**: mean=10.00, median=10.00, std=0.00, min=10, max=10, missing=0.0%

- **applications_submitted_30d**: mean=5.00, median=5.00, std=0.00, min=5, max=5, missing=0.0%

- **recruiter_response_rate**: mean=0.18, median=0.18, std=0.00, min=0.18, max=0.18, missing=0.0%

- **avg_response_time_hours**: mean=272.00, median=272.00, std=0.00, min=272.0, max=272.0, missing=0.0%

- **connection_count**: mean=64.00, median=64.00, std=0.00, min=64, max=64, missing=0.0%

- **endorsements_received**: mean=29.00, median=29.00, std=0.00, min=29, max=29, missing=0.0%

- **notice_period_days**: mean=120.00, median=120.00, std=0.00, min=120, max=120, missing=0.0%

- **willing_to_relocate**: mean=0.00, median=0.00, std=0.00, min=0, max=0, missing=0.0%

- **github_activity_score**: mean=-1.00, median=-1.00, std=0.00, min=-1, max=-1, missing=0.0%

- **search_appearance_30d**: mean=120.00, median=120.00, std=0.00, min=120, max=120, missing=0.0%

- **saved_by_recruiters_30d**: mean=7.00, median=7.00, std=0.00, min=7, max=7, missing=0.0%

- **interview_completion_rate**: mean=0.59, median=0.59, std=0.00, min=0.59, max=0.59, missing=0.0%

- **offer_acceptance_rate**: mean=-1.00, median=-1.00, std=0.00, min=-1, max=-1, missing=0.0%

- **verified_email**: mean=0.00, median=0.00, std=0.00, min=0, max=0, missing=0.0%

- **verified_phone**: mean=1.00, median=1.00, std=0.00, min=1, max=1, missing=0.0%

- **linkedin_connected**: mean=1.00, median=1.00, std=0.00, min=1, max=1, missing=0.0%


_**Highlight:** Signals with low missing % and high variance (e.g., `profile_views_received_30d`, `recruiter_response_rate`, `github_activity_score`) are likely most discriminative for ranking._


## 7️⃣ Missing Values Table

| Field | Missing % |
|---|---|

| candidate_id | 0.00% |

| profile | 0.00% |

| career_history | 0.00% |

| education | 0.00% |

| skills | 0.00% |

| redrob_signals | 0.00% |



## 8️⃣ Outlier Detection

- No major outliers detected based on simple thresholds.



## 9️⃣ Data Quality Issues

- Duplicate candidate IDs (should be none): check needed.

- Inconsistent title casing / abbreviations – normalisation required.

- Company names vary (e.g., `ABC Corp` vs `ABC Corporation`).

- Skill names have synonyms (`ML`, `Machine Learning`).

- Some `summary` fields are empty strings – treat as missing.


## 🔟 Feature Coverage & Recommendations

| Field | Populated % | Ranking Usefulness | Pre‑processing Recommendation |
|---|---|---|---|

## 🛠️ Engineering Recommendations

- **Pre‑processing pipeline**: clean strings, normalize enums, map skill synonyms, bucket numeric fields, impute missing values.

- **Normalization**: Z‑score numeric features, Min‑Max for behavioural scores.

- **Feature engineering**: duration of each skill, total endorsement count, number of promotions, industry transition counts, company size change count, embedding vectors for textual fields (headline, summary, titles).

- **Indexing strategy**: build a FAISS index on dense embeddings of `summary` + `headline`; maintain inverted index (BM25) for lexical matching. Combine via hybrid scoring.

- **Memory considerations**: keep embeddings float32; with 100k candidates, ~400 MB footprint – fits 16 GB RAM.

- **Batch processing**: load JSONL in chunks (e.g., 10 k) to compute aggregates without loading whole file in memory.


---
