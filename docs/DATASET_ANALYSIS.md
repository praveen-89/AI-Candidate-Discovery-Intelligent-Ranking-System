# DATASET_ANALYSIS.md

## Overview

This document provides a comprehensive analysis of the **candidate dataset** supplied for the India Runs Data & AI Challenge. All information is extracted directly from the official JSON schema (`candidate_schema.json`) and reflects the exact structure, field definitions, and validation constraints of the data. No assumptions are made beyond what is defined in the schema.

## Top‑Level Schema

- **Root object** – an object representing a single candidate profile.
- **Required top‑level properties**: `candidate_id`, `profile`, `career_history`, `education`, `skills`, `redrob_signals`.

## Field Breakdown

### `candidate_id`
- **Type**: `string`
- **Pattern**: `^CAND_[0-9]{7}$`
- **Description**: Unique identifier for the candidate. Example format: `CAND_0123456`.

### `profile`
- **Type**: `object` (required fields listed below)
- **Required sub‑fields**:
  - `anonymized_name` (string): Anonymized full name.
  - `headline` (string): One‑line professional headline.
  - `summary` (string): Multi‑sentence professional summary.
  - `location` (string): City, region/state.
  - `country` (string).
  - `years_of_experience` (number, 0‑50).
  - `current_title` (string).
  - `current_company` (string).
  - `current_company_size` (string, enumerated): One of `"1-10"`, `"11-50"`, `"51-200"`, `"201-500"`, `"501-1000"`, `"1001-5000"`, `"5001-10000"`, `"10001+"`.
  - `current_industry` (string).

### `career_history`
- **Type**: `array` (1‑10 items)
- **Each item** is an object with required fields:
  - `company` (string)
  - `title` (string)
  - `start_date` (string, format `date`)
  - `end_date` (string or `null`, format `date`)
  - `duration_months` (integer, ≥ 0)
  - `is_current` (boolean)
  - `industry` (string)
  - `company_size` (string, same enum as `current_company_size`)
  - `description` (string): Role responsibilities and achievements.

### `education`
- **Type**: `array` (0‑5 items)
- **Each item** includes:
  - `institution` (string)
  - `degree` (string)
  - `field_of_study` (string)
  - `start_year` (integer, 1970‑2030)
  - `end_year` (integer, 1970‑2035)
  - Optional: `grade` (string or `null`), `tier` (enum: `tier_1`, `tier_2`, `tier_3`, `tier_4`, `unknown`).

### `skills`
- **Type**: `array`
- **Each skill** object contains:
  - `name` (string)
  - `proficiency` (enum: `beginner`, `intermediate`, `advanced`, `expert`)
  - `endorsements` (integer, ≥ 0)
  - `duration_months` (integer, ≥ 0) – months the candidate has used the skill.

### `certifications`
- **Type**: `array`
- **Each certification** includes:
  - `name` (string)
  - `issuer` (string)
  - `year` (integer)

### `languages`
- **Type**: `array`
- **Each language** object contains:
  - `language` (string)
  - `proficiency` (enum: `basic`, `conversational`, `professional`, `native`)

### `redrob_signals`
- **Type**: `object` (required fields listed below)
- **Key signals** (all numeric or boolean unless noted):
  - `profile_completeness_score` (number 0‑100)
  - `signup_date` (date)
  - `last_active_date` (date)
  - `open_to_work_flag` (boolean)
  - `profile_views_received_30d` (integer ≥ 0)
  - `applications_submitted_30d` (integer ≥ 0)
  - `recruiter_response_rate` (number 0‑1)
  - `avg_response_time_hours` (number ≥ 0)
  - `skill_assessment_scores` (object: map of skill name → score 0‑100)
  - `connection_count` (integer ≥ 0)
  - `endorsements_received` (integer ≥ 0)
  - `notice_period_days` (integer 0‑180)
  - `expected_salary_range_inr_lpa` (object with `min` and `max`, both numbers ≥ 0)
  - `preferred_work_mode` (enum: `remote`, `hybrid`, `onsite`, `flexible`)
  - `willing_to_relocate` (boolean)
  - `github_activity_score` (number ‑1 to 100; ‑1 = no GitHub linked)
  - `search_appearance_30d` (integer ≥ 0)
  - `saved_by_recruiters_30d` (integer ≥ 0)
  - `interview_completion_rate` (number 0‑1)
  - `offer_acceptance_rate` (number ‑1 to 1; ‑1 = no offer history)
  - `verified_email` (boolean)
  - `verified_phone` (boolean)
  - `linkedin_connected` (boolean)

## Validation Constraints
- All required fields must be present for each candidate.
- Enumerated fields restrict values to a predefined set (e.g., `current_company_size`).
- Numeric ranges enforce realistic bounds (e.g., `years_of_experience` ≤ 50).
- Dates follow ISO‑8601 `YYYY‑MM‑DD` format.

## Next Steps
- **Data Profiling** will compute actual distributions, missing‑value rates, and anomalies using `candidates.jsonl`. This will inform feature importance and architecture decisions.

---
