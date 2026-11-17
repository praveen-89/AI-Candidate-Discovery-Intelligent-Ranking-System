# Implementation Plan — Resume Upload & Ranking System

Status: **Phase 1 and Phase 2 implemented and smoke-tested end-to-end.** Phase 3
(frontend) not started. See "Build log" at the end of each completed phase for what
was actually built, what diverged from the original plan, and what's deferred.

## Build order (explicit decision)

Supabase/Google-auth is built **last**, not first. Every earlier phase is built and
testable against **local, file-based storage** (plain JSON/SQLite under `uploads/` and
`datasets/`) so the backend, AI engine, and frontend can all be built and exercised
without an auth gate in the way. The final phase then swaps the storage layer over to
Supabase Postgres and adds the Google sign-in gate on top of working features.

Order:
1. AI Engine — resume parsing + incremental indexing (the core logic everything else calls)
2. Backend — long-lived AI service + REST endpoints (local storage backing)
3. Frontend — upload UI, job management UI, results UI (no auth gate yet, open access)
4. Env/config cleanup
5. Supabase — Google sign-in + Postgres persistence + RLS (migrate local storage → Supabase, add auth gate)

---

## Current state (reference, from codebase analysis)

- `ai_engine` builds a FAISS cache of the 100k dataset once (`datasets/embeddings/candidate_ids.npy`,
  `candidates.faiss`, `metadata.json`), keyed by a checksum of `candidates.jsonl`.
  `ai_engine/scripts/inference.py` is a **batch, one-shot script**: load cache → re-stream
  100k rows to recompute `features` into memory (never persisted) → parse one static JD
  (`datasets/raw/job_description.docx`) → rank → write `ai_engine/outputs/submission.json`.
- `backend/app/services/ai_engine.py` just spawns `python inference.py` as a subprocess and
  reads the JSON files afterward. No DB, no auth, no upload endpoint.
- `frontend` (Next.js 16.3.1, App Router) already has `/dashboard`, `/candidates`, `/ranking`,
  `/jobs`, `/system` pages wired to the static submission data. `/` just redirects to
  `/dashboard`. No landing page, no auth.
  - Next 16 is newer than training data — `frontend/AGENTS.md` warns APIs may differ from
    what's remembered. Before writing `middleware.ts`, route handlers, or any App Router
    file conventions, check `frontend/node_modules/next/dist/docs/01-app/` first.
- `supabase/schema.sql` is a placeholder comment — nothing built yet. Built last, per above.
- `datasets/raw/candidate_schema.json` is the canonical shape every candidate record
  (base dataset or newly parsed resume) must conform to: `candidate_id`, `profile`,
  `career_history`, `education`, `skills`, `certifications`, `languages`, `redrob_signals`.

---

## Phase 1 — AI Engine: resume parsing + incremental indexing

Goal: given an uploaded resume file and a job's requirements, produce a score + explanation
without re-touching the 100k base pipeline.

- **`ai_engine/src/core/resume_parser.py`** (new)
  - Extract raw text from PDF (add `pdfplumber` or `pypdf`) and DOCX (`python-docx`, already
    a dependency via `ai_engine`/`backend`).
  - Reuse the section-detection/regex approach from `job_parser.py` to populate the same
    `candidate_schema.json` shape: `profile` (headline, summary, years_of_experience,
    current_title/company, location), `career_history`, `education`, `skills`.
  - `redrob_signals` fields that cannot be derived from a resume (recruiter_response_rate,
    profile_views_received_30d, github_activity_score, etc.) get the **same neutral
    defaults** `preprocessing/feature_extractor.py` already falls back to for missing data —
    so a parsed resume scores fairly on skill/semantic/education/career, without being
    artificially boosted or crushed on signals it structurally can't have.
  - Output: a dict matching `candidate_schema.json`, plus the raw extracted text (for
    debugging/display).

- **Job registry (extend `ai_engine/src/core/job_parser.py`)**
  - `JobParser` currently only reads one hardcoded path
    (`datasets/raw/job_description.docx`). Generalize it to parse arbitrary text or an
    uploaded file tied to a `job_id`, so multiple company requirements can coexist.

- **Persist what is currently memory-only**
  - Base-pool `features` (from `extract_all_features`) are recomputed every run and never
    saved. Write them once to a cache file alongside the FAISS artifacts (e.g.
    `datasets/embeddings/features_cache.json`), keyed by `candidate_id`, invalidated by the
    same checksum/metadata rules `inference.py` already uses for the FAISS cache.
  - This lets a long-lived process load features once at startup instead of re-streaming
    100k JSONL rows per request.

- **Incremental indexing**
  - `DenseRetriever.add_to_index` already supports adding vectors without rebuilding
    (`index.add`). Add a `persist()` step that re-saves the FAISS index + id mapping to disk
    after each new resume is added, and tag each id as `base` or `uploaded` so the two
    pools can be filtered/reported separately later.

- **Single-candidate scoring path** (new helper, e.g. `ai_engine/src/core/score_single.py`)
  - Given one parsed candidate + one `structured_job`: build candidate text
    (`embeddings.embedder.build_candidate_text`) → embed with the already-loaded model →
    compute semantic similarity against the job's query embedding → run
    `HybridRanker.score_candidates` for just this one id → run
    `CandidateExplainer.generate_explanation` → return the result. No streaming, no cache
    rebuild, no subprocess.

### Build log (Phase 1 — done)

- Built exactly as planned: `ai_engine/src/core/resume_parser.py`,
  `core/score_single.py`, `core/base_pool.py` (the persisted features cache), and
  `DenseRetriever.persist()`. `job_parser.py` extended with `JobParser.from_text()`
  and a `job_id` field, backward-compatible with the existing file-based `parse()`.
- Added `ai_engine/src/core/skills_taxonomy.py` — pulled the real 133-skill
  vocabulary out of `datasets/raw/candidates.jsonl` and pointed both `job_parser.py`
  and `resume_parser.py` at it, replacing job_parser's old ~25-word hardcoded list.
- **Found and fixed two pre-existing bugs** while building this (not part of the
  original plan, but directly relevant — they were silently degrading every
  candidate's embedding/feature quality, old and new alike):
  - `embeddings/embedder.py`: `build_candidate_text` read `job.get("company_name")`
    and `edu.get("degree_name"/"institution_name")`, but the real dataset field
    names are `company`, `degree`, `institution`. Company names and degree/
    institution text were silently missing from every candidate's embedded text.
  - `preprocessing/feature_extractor.py`: read `profile.industry`, but the real
    field is `profile.current_industry` — industry-match scoring was silently
    always failing.
  - Fixed both with `.get("new_name") or .get("old_name")` fallbacks (safe either
    way). Bumped `inference.py`'s `cache_version` to force a re-embed of the 100k
    base pool with the fix applied — then **reverted that bump** (see below).
- **Deferred**: re-embedding the 100k base pool with the fixed field names. This
  sandbox's embedding throughput for `BAAI/bge-small-en-v1.5` turned out to be far
  below the ~36s documented for a full 100k run — a background attempt used ~2.7
  hours of actual CPU time to get through only ~14% of the dataset before being
  killed. Reverted the `cache_version` bump so the existing (valid, just slightly
  stale on those two fields) FAISS cache keeps working. **This does not block
  anything** — resume uploads embed fresh every time regardless of cache state, so
  the fix is already fully in effect for every new resume. The only consequence is
  the base 100k pool's embeddings are marginally less rich until someone reruns
  `ai_engine/scripts/inference.py` on hardware where that's actually fast — bump
  `cache_version` back to `3` in `ai_engine/scripts/inference.py` (both occurrences)
  when ready to do that.
- Validated by parsing real `.txt` and `.docx` sample resumes end-to-end (section
  splitting, career history with correct company/title/dates, education with
  correct institution/degree/field/years, skill extraction) and by scoring a parsed
  resume against a `JobParser.from_text()` job — correct, sensible scores and
  explanations came back.

---

## Phase 2 — Backend: long-lived AI service + endpoints

Goal: a FastAPI app that loads the model/index once and answers upload requests fast,
backed by local storage (swapped for Supabase in Phase 5).

- Relax the "backend never imports ai_engine" rule from `backend/README.md` — it was
  written for the batch-subprocess era and is incompatible with instant resume scoring
  against a warm model. Document the new boundary: backend imports `ai_engine` as an
  in-process library for the real-time path; the old subprocess `/rank` endpoint stays for
  "rebuild the whole 100k pipeline" admin use only.

- **Startup (`backend/app/main.py`)**: on FastAPI startup, load the embedder model once,
  load the FAISS index + id mapping + persisted features cache into `app.state`. Kept warm
  for the process lifetime.

- **Local storage (temporary, replaced in Phase 5)**
  - `uploads/job_descriptions/jobs.json` — list of created jobs (id, title, raw_text,
    structured_job, semantic_query, created_at).
  - `uploads/resumes/<id>/` — original uploaded file + `parsed.json` (parsed candidate +
    features + score + explanation + status).
  - A tiny local repository module (`backend/app/database/local_store.py`) wrapping reads/
    writes to these so Phase 5 only has to swap this module for Supabase calls, not the
    route/service layer.

- **New endpoints** (no auth yet — added in Phase 5):
  - `POST /jobs` — create a job from JD text or uploaded file → parse → store.
  - `GET /jobs` / `GET /jobs/{id}` — list/fetch jobs.
  - `POST /resumes/upload` — multipart file + `job_id` → parse → extract features → embed →
    add to live FAISS index → score against the given job → persist → return score +
    explanation immediately.
  - `GET /resumes/{id}` — fetch a stored parse/score result.
  - `GET /jobs/{id}/results` — list all resume results scored against a job.

- New dependencies in `backend/requirements.txt`: `pdfplumber` (or `pypdf`), plus whatever
  `ai_engine` needs that backend doesn't already have (`sentence-transformers`,
  `faiss-cpu`, `numpy`) — now a direct dependency since backend imports `ai_engine`
  in-process.

### Build log (Phase 2 — done)

- Built as planned, with real module names (vs. the plan's placeholders):
  `app/core/ai_engine_bootstrap.py` (puts `ai_engine/src` on `sys.path`, pins its
  settings to absolute dataset paths via env vars so it's independent of the
  backend's cwd), `app/services/ai_runtime.py` (the warm embedder/FAISS/features
  singleton, plus a per-job-id embedding cache and `persist_index()`),
  `app/database/local_store.py`, `app/services/job_service.py` /
  `resume_service.py`, `app/schemas/jobs.py` / `resumes.py`, and
  `app/api/v1/routes/jobs.py` / `resumes.py`, wired into `app/api/v1/router.py`.
- `main.py`'s startup event now calls `ai_runtime.init_runtime()` (via
  `asyncio.to_thread`, so it doesn't block the event loop) — the model/index/
  features load once at process start, not on first request.
- `local_store.py` uses one JSON file for all jobs (`uploads/job_descriptions/jobs.json`)
  and one `record.json` per resume under `uploads/resumes/<resume_id>/`, rather than
  a `parsed.json` split from the rest — simpler, and the full record (status,
  candidate, score, error) is what every caller wants anyway.
- `backend/requirements.txt` ended up needing `pypdf` (not `pdfplumber` — chosen in
  Phase 1 for being lighter, pure-Python, no Pillow dependency),
  `python-multipart` (required by FastAPI for `UploadFile`/`Form`), and
  `sentence-transformers`/`faiss-cpu`/`numpy<2.0.0` as direct deps.
- `.gitignore` had no rule for `uploads/` at all (a real gap — it now holds
  user-uploaded resumes). Added `uploads/{resumes,job_descriptions,exports}/*` with
  `.gitkeep` exceptions, matching the existing `datasets/`-ignoring pattern.
- `pyrightconfig.json`'s `extraPaths` was missing `ai_engine/src` itself (only had
  `ai_engine`), so static analysis couldn't resolve `ai_engine`'s bare
  `core.xxx`/`embeddings.xxx` imports even though they resolve fine at runtime via
  `ai_engine_bootstrap.py`'s `sys.path` insert. Added it.
- **End-to-end smoke test** (ran the real server with `uvicorn`, hit it with
  `curl`): `POST /jobs` → parsed correctly; `POST /resumes/upload` with a real
  `.txt` resume + that `job_id` → parsed, embedded, scored, explained, and added to
  the live FAISS index in roughly a second total; `persist_index()` confirmed
  working (index went 100000 → 100001 vectors, survived an independent reload);
  `GET /resumes/{id}`, `GET /jobs/{id}/results`, `GET /jobs` all returned correctly;
  upload with no `job_id` correctly short-circuits to "parsed" status without
  scoring; invalid file extension and nonexistent `job_id`/`resume_id` all returned
  the expected 400/404s. All test data (the dummy job, dummy resumes, and the one
  test vector added to the FAISS index) was removed afterward — the 100k base pool
  is back to exactly its original state (verified `ntotal == 100000` after cleanup).

---

## Phase 3 — Frontend: upload UI, job management, results

Goal: usable UI against the Phase 2 endpoints, no auth gate yet (added in Phase 5).

- Check `frontend/node_modules/next/dist/docs/01-app/` for current route handler / file
  convention specifics before writing new routes (per `frontend/AGENTS.md` warning).
- Extend `/jobs` page: create-job form (title + paste JD text or upload JD file), list of
  existing jobs.
- New upload flow (new `/jobs/[jobId]/upload` or similar): drag-drop PDF/DOCX, upload
  progress, then render the result using existing components already built for the batch
  view (`ScoreBreakdown`, `RadarChart`, `StatusBadge`, `ScoreBar`).
- New `lib/api/jobs.ts` (create/list) and `lib/api/resumes.ts` (upload/fetch result) client
  modules following the existing pattern in `lib/api/candidates.ts` / `lib/api/client.ts`.
- No landing page or sign-in yet — all pages remain open, reachable directly, exactly as
  today, just with the new job/upload pages added alongside `/dashboard`, `/candidates`,
  `/ranking`, `/system`.

### Build log (Phase 3 — job creation/upload UI done; resume browsing elsewhere deferred)

- Backend gained a sibling endpoint not in the original plan: `POST /jobs/upload`
  (multipart `title` + `file`), alongside the existing `POST /jobs` (JSON text).
  Reuses `core.resume_parser.extract_text()` (the same PDF/DOCX/TXT extractor
  resumes use) rather than `JobParser`'s own old docx-only file reader — so a JD can
  now be a PDF too. `local_store.create_job()` gained an optional
  `source_file_path` field; `JobResponse` schema updated to match.
  Validated against the repo's real sample JD (`datasets/raw/job_description.docx`)
  — parsed 23 real skills out of it correctly.
- `/jobs` page rewritten from its old "read-only, backend-managed JD" placeholder
  into: a `JobCreateForm` (paste-text / upload-file tabs, calls `POST /jobs` or
  `POST /jobs/upload`) + a list of existing jobs (`JobCard`), sorted newest-first.
- New `/jobs/[jobId]` detail page: shows the structured requirements (skills,
  experience), a `ResumeUploadForm` scoped to that job (calls
  `POST /resumes/upload` with `job_id` set), and the list of resumes already scored
  against it (`ResumeResultCard`, reusing the existing `ScoreBreakdown`/`ScoreBar`
  components from the batch-candidates view). No separate `/jobs/[jobId]/upload`
  route was needed — upload lives directly on the detail page.
- `lib/api/jobs.ts` and `lib/api/resumes.ts` added, following the existing
  `lib/api/candidates.ts` pattern. `lib/api/client.ts` gained `apiUpload()` — a
  sibling to `apiFetch()` that sends `FormData` without forcing a JSON
  `Content-Type` header (so the browser sets the multipart boundary itself).
- Checked `frontend/node_modules/next/dist/docs/01-app/` conventions before writing
  the dynamic route — confirmed via the existing `/candidates/[candidateId]/page.tsx`
  that this Next 16 app already uses `params: Promise<{...}>` + `use(params)`, and
  matched that exactly in the new `/jobs/[jobId]/page.tsx`.
- Validated: `tsc --noEmit` clean; ran the real `next dev` server against the real
  `uvicorn` backend; created a job via `curl`, confirmed `/jobs` and
  `/jobs/[jobId]` both return 200 with no error-boundary triggered. (Full
  browser-driven interaction — actually clicking the upload form — wasn't checked
  with a real browser in this pass; only direct-API and page-render checks. The
  upload form reuses the same `POST /resumes/upload` call already proven correct
  via `curl` in Phase 2.)
- **Deferred / not built this pass**: a standalone resume-browsing page outside
  the job-detail context (e.g. "all my uploaded resumes" independent of which job
  they were scored against). Not needed yet since every upload is scored against
  exactly one job in the current flow; add if that changes.

---

## Phase 4 — Env/config cleanup

- Fill in real values/placeholders in `.env.example` for the new pieces added so far
  (embedding model already there; add any new ai_engine/backend settings introduced in
  Phase 1–2, e.g. features cache path).
- Update `backend/README.md` (currently says "not yet implemented" and forbids importing
  `ai_engine` — both now false after Phase 2) and the root `README.md` (says frontend is
  "React, Vite" — it's Next.js).
- No Supabase env vars yet — those arrive in Phase 5.

### Build log (Phase 4 — done)

- Status note: `backend/README.md` was actually already updated during the
  Phase 2 build log (it needed rewriting there to explain the new
  ai_engine-import boundary, so it was done early rather than deferred to here).
- `.env.example`: rewritten to document every env var actually read by
  `backend/app/config/settings.py` and `ai_engine/src/config/settings.py` — all
  of which already have working code defaults, so the file is "here's what you
  can override," not "here's what you
  must fill in." Supabase vars stay empty/unused, clearly marked Phase 5.
- Root `README.md`: fixed the stale "React, Vite" frontend claim (it's Next.js),
  updated the `ai_engine`/`backend`/`supabase` sections to reflect what's actually
  built vs. deferred, added `uploads/` as a module (didn't exist in the original
  monorepo description), and replaced the vague "see docs/ folder" setup
  instructions (that `docs/` folder doesn't exist) with the actual working
  commands for each of the three services.
- Not touched: `scripts/setup.ps1` / `setup.sh` (still explicit no-op
  placeholders) and `scripts/README.md`. Automating them wasn't in this phase's
  scope — the root README's new Setup Instructions section covers the same
  ground manually. Worth doing later if the manual steps get tedious enough to
  bother scripting.

### Follow-up: real `.env` created, and a wiring gap fixed along the way

- User created a real root-level `.env`. Before populating it, found and fixed a
  real bug this would otherwise have silently hit: `backend/app/config/settings.py`
  had `env_file=".env"` — a path pydantic-settings resolves relative to the
  backend **process's cwd**, not the repo root. Since `backend/README.md`'s
  documented run command is `cd backend && uvicorn app.main:app`, it would have
  looked for `backend/.env` and silently ignored a root-level `.env` entirely.
  Fixed by computing the root `.env` path explicitly in `settings.py` (same
  `_THIS_DIR`/`_ROOT_DIR` pattern as `ai_engine_bootstrap.py`).
- Separately, `ai_engine/src/config/settings.py` reads plain `os.getenv()` — it
  never loaded any `.env` file on its own (pydantic-settings' dotenv loading is
  backend-only). Added `load_dotenv(ROOT_DIR/.env)` to
  `backend/app/core/ai_engine_bootstrap.py` (before the `DATA_RAW_DIR` etc.
  `setdefault` calls, so an explicit `.env` override still wins) and to
  `ai_engine/scripts/inference.py` (for standalone batch runs) — `python-dotenv`
  was already present transitively via `pydantic-settings`, now declared
  explicitly in both `requirements.txt` files.
- Verified end-to-end: set `PROJECT_NAME` to a distinguishing test value in the
  real `.env`, restarted the backend, confirmed `GET /api/v1/version` reflected
  it, then reverted. Root `.env` is now the single real source of config for
  both backend and ai_engine.
- Populated the real `.env` with the same documented values as `.env.example`
  (all currently at their working defaults) plus empty `SUPABASE_*` placeholders
  for Phase 5.

---

## Phase 5 — Supabase: Google sign-in + persistence (built last)

Goal: swap local storage for real persistence, add the Google sign-in gate, without
changing the features built in Phases 1–4.

- **Auth**: enable Google provider in Supabase Auth. Email/password can be enabled later
  as an additional provider on the same `auth.users` table — no schema change needed when
  that's added.
- **Schema** (`supabase/schema.sql` + a migration in `supabase/migrations/`):
  - `jobs` (id, owner_user_id, title, raw_text, structured_job jsonb, semantic_query, created_at)
  - `uploaded_resumes` (id, owner_user_id, job_id, original_filename, storage_path,
    parsed_candidate jsonb, status, created_at)
  - `ranking_results` (id, resume_id, job_id, final_score, sub_scores jsonb, reasons jsonb, created_at)
- **RLS** in `supabase/policies.sql`: users only see their own jobs/resumes/results.
- **Storage**: move uploaded resume files from local `uploads/resumes/` to a Supabase
  Storage bucket; `uploaded_resumes.storage_path` references it.
- **Backend**: replace `local_store.py` with real Supabase calls (service role key);
  add a JWT-verification dependency (`app/api/dependencies.py`) that checks the
  Supabase-issued `Authorization: Bearer` token via Supabase's JWKS and attaches
  `user_id` to the request context. Apply it to the `/jobs` and `/resumes` routers.
- **Frontend**:
  - New public landing page at `/` (replacing the current `/` → `/dashboard` redirect):
    marketing content + "Sign in with Google" CTA.
  - `@supabase/supabase-js` + `@supabase/ssr` for the OAuth flow.
  - `middleware.ts` gating `/dashboard`, `/candidates`, `/jobs`, `/ranking`, `/system`
    behind an authenticated session — check the vendored Next 16 docs for current
    middleware conventions first (flagged as an area likely to have changed).
  - All API calls from `lib/api/*` attach the Supabase session JWT.
- **Env vars**: fill in `.env.example` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`) and `frontend/.env.local`
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Build log (Phase 5 — code complete; two manual steps left for the user)

- **Key format changed the plan**: the project uses Supabase's newer
  `sb_publishable_`/`sb_secret_` API keys, not the legacy JWT-shaped
  `anon`/`service_role` keys the original plan assumed. Researched current
  Supabase guidance (web search + inspecting the installed `supabase-py`
  2.34.1 source directly, since docs examples were JS-only) before writing
  any verification code, rather than guessing. Landed on: `auth.get_claims(jwt=token)`
  for verification (handles both legacy HS256 and new asymmetric JWT-signing-key
  tokens correctly, per Supabase's own recommendation not to hand-roll this),
  and `postgrest.auth(user_access_token)` so every DB/storage call runs **as
  the signed-in user** — RLS is the real enforcement, there is no service-role
  bypass anywhere in this backend.
- **Schema simplified from the original 3-table plan to 2 tables**
  (`jobs`, `uploaded_resumes`) — matches what Phase 2 actually built (a
  resume's score lives inline on its own row via `score_result jsonb`; a
  separate `ranking_results` table would have no second consumer and no
  current need for one-resume-many-jobs). `supabase/schema.sql` is one
  self-contained, idempotent file (tables + indexes + RLS + storage buckets +
  storage policies) — the user runs it once in the SQL Editor.
  `supabase/policies.sql` is now just a readable RLS-only extract for review;
  `supabase/migrations/<timestamp>_init.sql` mirrors it for future CLI use.
- **Backend**: `app/core/supabase_client.py` (token verification + per-request
  user-scoped client factory), `app/api/dependencies.py` gained `AuthContext`
  + `get_current_user` (reads `Authorization: Bearer`, verifies, builds the
  user-scoped client). `local_store.py` is superseded by
  `app/database/supabase_store.py` (same function shapes, now taking
  `client`/`owner_user_id`) — kept in the repo, unused, rather than deleted.
  `job_service.py`/`resume_service.py` and both route files thread
  `AuthContext` through every call; every `/jobs*` and `/resumes*` route now
  requires a valid bearer token (verified live: no header → 401, garbage
  token → 401).
  - **File handling changed**: resume/JD text extraction (`pypdf`/`python-docx`)
    needs a real local file path, but the durable copy now lives in Supabase
    Storage, not local disk. Resolved by writing uploaded bytes to a short-lived
    `tempfile`, extracting text from that, deleting it, and uploading the
    original bytes to Storage separately — local disk is now just transient
    processing scratch space, not storage.
- **Frontend**: this Next.js version renamed `middleware.ts` → `proxy.ts`
  (confirmed by reading the vendored docs, exactly as `AGENTS.md` warned) — the
  route-protection file is `frontend/proxy.ts`, exporting `proxy()`, not
  `middleware()`. Added `lib/supabase/client.ts` (browser client),
  `app/auth/callback/route.ts` (PKCE code exchange), rewrote `app/page.tsx`
  into a real landing page with a "Sign in with Google" button, and wired
  `lib/api/client.ts`'s `apiFetch`/`apiUpload` to attach the current session's
  access token to every backend call. `TopNav.tsx`'s static avatar placeholder
  became a real signed-in-user indicator + sign-out button.
- **Verified so far** (everything that doesn't require an actual completed
  Google OAuth round-trip, which needs a real browser): backend boots clean
  with all this wired in; `/jobs` correctly 401s with no/invalid token;
  frontend landing page renders with the sign-in button; `proxy.ts` correctly
  307-redirects an unauthenticated `/dashboard` request back to `/`.
- **Two things only the user can finish** (flagged via `AskUserQuestion`
  before touching the DB, and both still pending as of this build log):
  1. Run `supabase/schema.sql` once in the Supabase SQL Editor — nothing in
     the DB exists yet, so every `/jobs`/`/resumes` call will fail at the
     query step until this is done (auth itself already works independently
     of this).
  2. Add `http://localhost:3000/auth/callback` to Supabase's Authentication →
     URL Configuration → Redirect URLs (and set Site URL to
     `http://localhost:3000` for local dev) — without this, Google's redirect
     back through Supabase will be rejected before it ever reaches the app.
  Full end-to-end validation (actually clicking "Sign in with Google" in a
  browser) is still outstanding — no browser-automation tool is available in
  this environment, so this needs the user (or a future session with one) to
  exercise it directly.

### Post-launch fix: storage uploads were silently running as anon

After the user ran `schema.sql` and completed a real Google sign-in (both
worked correctly first try — landing page → Google → `/dashboard`/`/jobs`,
with the user's own job visible), the one real bug surfaced: uploading a
resume failed with a generic "Unable to reach the API" message in the
browser, which turned out to be misleading — confirmed via the backend's own
logs (not guesswork) that the real error was
`storage3.exceptions.StorageApiError: 403 new row violates row-level security
policy`, thrown from `supabase_store.save_resume_file`.

Root cause, found by reading the installed `supabase-py` source directly:
`Client.postgrest` and `Client.storage` are separate lazily-initialized
sub-clients that each read `client.options.headers` only once, on first
access. `client_for_user()` was calling `client.postgrest.auth(token)`, which
only patches postgrest's own (already-initialized) headers — it never touches
`client.options.headers` itself, so when `.storage` was accessed for the
first time moments later, it initialized from the client's original anon-key
headers. Every DB query correctly ran as the signed-in user; every storage
upload silently ran as anon and got rejected by the storage RLS policies
(correctly — anon has no folder to own).

Fixed in `app/core/supabase_client.py`'s `client_for_user()`: set
`client.options.headers["Authorization"] = f"Bearer {access_token}"` directly,
before either sub-client is touched, so both `.table()` and `.storage` read
the correct header on their first (lazy) initialization. Restarted the
backend; awaiting the user's retry to confirm the full upload → parse →
embed → score flow now works end-to-end for a real signed-in user.

---

## Phase 6 — Search the existing 100k pool against a job (done)

Goal: resolve open item #2 below — show existing base-pool candidates ranked
against a job, not just uploaded resumes, with full reasons.

- `ai_engine/src/core/search_pool.py` (new): `search_existing_pool()` — dense-
  retrieves the top-K semantically similar vectors from the already-warm FAISS
  index (`DenseRetriever.search`), filters to ids present in the base-pool
  features cache (so previously uploaded resumes that got added to the same
  index are naturally excluded — this is specifically "search existing
  candidates"), runs them through the same `HybridRanker` and
  `CandidateExplainer` used everywhere else, so scores are directly
  comparable to uploaded-resume scores. No re-streaming or re-embedding of
  the 100k dataset — reuses what `ai_runtime` already keeps warm.
- `JobService.search_existing_candidates()` + `GET /jobs/{job_id}/existing-matches?top_k=20`
  (auth-protected, like every other `/jobs*` route).
- Frontend: `/jobs/[jobId]` now has a tab switcher — "Existing Candidates"
  (default view) vs "Uploaded Resumes" — fetched in parallel with the job
  itself on page load, so matches appear immediately without an extra click.
  New `ExistingMatchCard.tsx`: shows rank, score, matching skills, and the
  human-readable "why this candidate matches" reasons inline (not behind a
  link to `/candidates/[id]`, since that page reads from the old static
  `submission.json` batch file and would 404 for most of these dynamically-
  found candidates — a full score breakdown is available via an in-card
  expand toggle instead).

### Follow-up: real pagination instead of a growing single page

Initially shipped as a flat top-20 list with a "load more" button that kept
accumulating results on one page. User asked for real paging — 10 per page,
not a never-ending single page. Reworked:

- `search_existing_pool()` now takes `offset`/`limit` instead of
  `top_k_final`, and returns `{"results": [...], "total": N}` — `total` is
  the full ranked-candidate count (capped at `top_k_dense=500`), needed to
  compute page count. Re-ranks on every call (confirmed cheap: a few ms
  against the warm index) rather than caching a ranking server-side across
  pages — simpler, and always reflects the latest index state.
- `JobService.search_existing_candidates()` and the route now take `page`
  (1-indexed) + `page_size` (default 10, max 100, validated) instead of
  `top_k`.
- New `components/ui/Pagination.tsx` (page numbers + prev/next, matching the
  existing dark/violet style) replaces the old "load more" button on the job
  detail page. Rank numbers shown on each card now account for the current
  page offset (e.g. page 2 starts at rank 11), not reset to 1 each page.
- Validated directly: confirmed `total=500` and that page 1 and page 2 return
  disjoint, correctly non-overlapping candidate sets.
- **Validated directly** (bypassing the browser, since I can't complete auth
  from here): ran the real `search_existing_pool()` against the live 100k
  FAISS index with a test job — found sensible real candidates with correctly
  matched skills in ~40ms once the model/index were warm. Backend route
  confirmed wired (401 without auth, not 404/405). Full browser click-through
  still needs the user to verify.

---

## Phase 7 — Visual theme pass (done)

Goal: move off the default "AI startup template" look (purple/indigo gradient
accents, gradient-text headline, glowing badge pill, centered-hero-with-icon-
grid landing page) toward something more restrained and corporate.

- `app/globals.css`: overrode Tailwind's `violet-*` scale (50–950) with a
  single flat corporate blue, in `@theme` — every existing `violet-*`
  utility class across ~20 component files re-themes from this one place,
  instead of hand-editing each file's class names. `RadarChart.tsx`'s two
  hardcoded hex values (not Tailwind classes, so the override above doesn't
  reach them) were updated separately to match.
- Flattened every `bg-gradient-to-br from-violet-500 to-indigo-600`-style
  gradient to a solid `bg-violet-600` (Sidebar logo, TopNav avatar, landing
  page logo) or a solid soft tint (`bg-violet-500/10` for icon chips on the
  candidate/job/ranking detail pages) — gradients paired with the old
  violet+indigo combination were the main "generic AI SaaS" tell.
- `app/page.tsx` (landing page) rewritten: removed the gradient hero text,
  the glowing "Sparkles" badge pill, and the centered-hero/icon-grid layout.
  Replaced with an asymmetric two-column hero (copy + CTA on the left, a
  plain data-table-style panel showing an example score breakdown on the
  right, instead of an illustration), an uppercase eyebrow label instead of
  a badge pill, and a 3-step numbered list instead of an icon-card grid for
  the "how it works" section.
- Scope: this pass covered shared layout chrome (Sidebar, TopNav) and the
  landing page fully; it did not restructure every individual page's
  internals (dashboard/candidates/ranking/system) beyond what the palette
  override and gradient flattening already reach — those pages inherit the
  new accent color automatically but weren't otherwise redesigned.

### Follow-up: real light/dark theming, not just a dark palette swap

Phase 7 above only changed the accent color — every surface/text color was
still a hardcoded `slate-*` class, meaning there was only ever one theme
(dark). User asked for an actual light theme too. Reworked properly rather
than bolting on `dark:` variants everywhere:

- Added `next-themes` (`ThemeProvider` in `app/layout.tsx` wrapping the app,
  `attribute="class"` — matches the existing `@custom-variant dark
  (&:is(.dark *))` in `globals.css`, `defaultTheme="dark"` so existing users
  see no change until they opt in, `enableSystem={false}` since this is an
  explicit two-way toggle, not OS-preference-following). `suppressHydrationWarning`
  on `<html>` is required here — next-themes sets the class client-side
  before paint, which is an expected, documented SSR/CSR mismatch on that
  one element.
- `globals.css`: introduced real semantic tokens (`--background`, `--surface`,
  `--surface-hover`, `--input`, `--border`, `--foreground`, `--muted-foreground`)
  defined once in `:root` (light values) and overridden in `.dark` (the
  previous dark values), then exposed as Tailwind colors via `@theme inline`.
  This generates `bg-background`, `bg-surface`, `border-border`,
  `text-foreground`, `text-muted-foreground`, etc. automatically — components
  use these instead of literal `slate-*`, so the same JSX renders correctly
  in both themes with zero per-component `dark:` prefixing.
- Converting ~270 hardcoded `slate-*` occurrences across 29 files by hand
  wasn't practical — wrote a one-off Python script
  (`retheme.py`, not committed) applying an ordered set of regex rules (hover-
  and group-hover-prefixed patterns before their bare counterparts, to avoid
  e.g. `hover:bg-slate-800` being only half-converted) mapping every distinct
  `slate-*` class found to its semantic equivalent. Verified zero `slate-*`
  references remained afterward. Two chrome-specific cases (`Sidebar`'s and
  `TopNav`'s `bg-slate-900`, which meant "app chrome background" rather than
  "sunken input field" like every other `bg-slate-900` usage) were fixed by
  hand first and excluded from the generic `bg-slate-900` → `bg-input` rule.
- **The script introduced two real bugs, both found and fixed**: blanket
  substitution doesn't distinguish "this color is paired with the *same*
  color for text" — `StatusBadge`'s `offline`/`unknown` variants and
  `TopCandidatesTable`'s silver-rank badge went from a tinted badge
  (`bg-slate-500/15 text-slate-400`) to a solid-color badge with
  same-color text (`bg-muted-foreground text-muted-foreground` — invisible
  text). Caught by grepping for `bg-{token} ... text-{token}` collisions
  with no distinguishing opacity, then verified no other instances existed
  via a second automated pass.
- Also fixed one real pre-existing bug the theme change exposed: the landing
  page's "Sign in" ghost button used `hover:text-white`, which was invisible
  on a light background (harmless before, since dark was the only theme).
- `components/theme/ThemeToggle.tsx` (Sun/Moon icon button, defers rendering
  until mounted to avoid a hydration mismatch — standard next-themes pattern)
  added to `TopNav` (every dashboard page) and the landing page header.
- Validated: `tsc --noEmit` clean, dev server compiles with no errors,
  restarted (required — new npm dependency) and confirmed serving 200s.

### Follow-up: light-mode contrast bug (accent/status text too light on light backgrounds)

User reported sidebar nav text and skill-chip text looking "blurry" in light
mode. Root cause: `violet-400`/`violet-300` (and the same pattern for
`emerald-400`/`amber-400`/`red-400`/`sky-400`) were chosen for readability as
*text* on a *dark* background — on the new light background, that same light
shade has too little contrast against both white and its own pale tinted chip
background. This wasn't caught in the original theming pass because the
palette-override approach only re-themes a color's *hue*, not which shade is
appropriate as text-on-light vs text-on-dark for that hue.

- Added `--accent-fg` token (`globals.css`): `#2159c9` (same as the
  violet-600 button color) in light mode, `#5b9bf5` (the original violet-400)
  in dark mode. Swept all plain-text/icon uses of `text-violet-300`/`-400`
  (not the tinted chip *backgrounds*, which were already fine) to
  `text-accent-fg` via another one-off regex script — 15 files.
- Same issue existed for status/score colors (`scoreColorClass` in
  `lib/utils/format.ts`, `StatusBadge`, `TopNav`'s "API Online/Offline",
  `StatsCard` icon chips, etc.) — rather than a shared token per status color,
  used Tailwind's `dark:` variant directly (`text-emerald-600
  dark:text-emerald-400`, same for amber/red/sky) since these are genuinely
  different named colors, not one accent hue. Swept via script across 14
  files.
- Verified no new text-on-identical-background collisions introduced (same
  automated check as the earlier theming pass), `tsc --noEmit` clean, dev
  server restarted and compiling with no errors.

---

## Phase 8 — Public marketing site (Home page + design system done; 6 pages pending)

User supplied a full, detailed spec for a 7-page marketing site ("precision
instrument" design: ink + electric-lime, distinct from the dashboard's
corporate-blue theme). Agreed scope for this round (via `AskUserQuestion`):
replace `/` with the new marketing site (old sign-in-landing content moved to
a new `/login`); build the design system + Home page first, remaining 6 pages
(`/product`, `/how-it-works`, `/scoring`, `/architecture`, `/use-cases`,
`/docs`) in follow-up rounds.

- **Isolated design system**: added a second, fully separate set of tokens in
  `globals.css` (`--mkt-bg`, `--mkt-surface`, `--mkt-border`, `--mkt-text`,
  `--mkt-text-secondary`, `--mkt-accent`, `--mkt-accent-ink`, plus the 8 fixed
  `--color-factor-*` data-palette colors) alongside the dashboard's existing
  `--background`/`--surface`/`--foreground`/`--accent-fg` tokens — deliberately
  not shared, so neither theme can bleed into the other. A marketing-only
  `ThemeToggleMkt` (mirrors the dashboard's `ThemeToggle` but styled with
  `mkt-*`/lime instead of dashboard blue) exists for the same reason.
- **Fonts**: Instrument Sans (`font-display` utility) and JetBrains Mono
  (folded into the existing `font-mono` utility, so dashboard `font-mono`
  usages like candidate IDs also benefit) loaded globally via `next/font/google`
  in the root layout — one loading site, available everywhere, zero fallback
  flash. (Named the next/font CSS variables `--instrument-sans`/
  `--jetbrains-mono`, not `--font-display`/`--font-mono` — those are the
  *Tailwind* theme variable names; reusing them for next/font's own variable
  would have been a circular reference.)
- **Route structure**: `app/(marketing)/layout.tsx` + `app/(marketing)/page.tsx`
  (Home) — a route group so the marketing pages get their own
  Navbar/Footer/fonts/background without affecting the URL or touching
  `/dashboard` etc., which still use the root layout only. Old `app/page.tsx`
  (the single-page sign-in landing from the earlier "add a landing page"
  request) deleted — its sign-in flow now lives at `app/login/page.tsx`
  (slimmed to just the Google sign-in, no marketing copy), which `/` and
  `/dashboard`'s proxy redirect both point to in spirit (proxy still redirects
  to `/`, which is now the marketing home, whose "Get Started"/header CTA
  link to `/login`).
- **Components built** (`components/marketing/`): `Navbar` (sticky,
  blurred-on-scroll, mobile menu), `Footer`, `Button` (primary lime/secondary
  outline/ghost), `ScoreBar` (the 8-segment brand mark — animates in on
  scroll via Framer Motion, `prefers-reduced-motion`-aware), `FunnelViz`
  (100,000 → 5,000 → 1,000 → 100, sqrt-scaled bar widths so the narrow end
  stays visible, count-up numbers), `StatCounter` (requestAnimationFrame
  count-up, triggers once on scroll into view), `ExplanationCard` (the
  realistic candidate-result mock — score, Score Bar, matched/missing skill
  chips, plain-language reasons), `BrowserFrame` (plain browser-chrome mock,
  no screenshot needed), `CTABand`. `lib/marketing/factors.ts` is the single
  source of truth for the 8 factors' labels/weights/colors (weights taken
  directly from `ai_engine/src/config/settings.py`'s real `WEIGHT_*` defaults,
  not invented) — every component that renders factor data reads from it.
- **Content**: every number on the page (100,000+ profiles, ~36s, ~1s,
  8 factors, 133-skill taxonomy, CPU-only, the funnel's 100K→5K→1K→100) is
  real, taken from the user's spec / the actual codebase — no fabricated
  metrics, logos, or testimonials, per the spec's explicit honesty rule.
- **Real bug found and fixed while building**: `lucide-react` in this project
  (a newer major version, `^1.31.0`) has dropped brand/logo icons — `Github`
  doesn't exist in it, unlike older lucide-react majors. Caught by `tsc`
  immediately (`TS2305: Module has no exported member 'Github'`) rather than
  silently failing at runtime. Verified which other icons used on this page
  (`Star`, `Menu`, `X`, `ArrowRight`, `Search`, `Sparkles`,
  `MessageSquareQuote`) actually exist in the installed version before
  shipping, rather than assuming. Fixed by adding a small inline
  `GithubIcon.tsx` SVG, matching the pattern the login page's Google icon
  already used.
- Validated: `tsc --noEmit` clean, `.next` cache cleared and dev server
  restarted (new `framer-motion` dependency), confirmed `/` (home), `/login`,
  and `/dashboard` (redirects unauthenticated, as before) all respond
  correctly, and the hero/funnel/CTA copy renders in the server-rendered HTML.
- **Pending** (next rounds, per the agreed delivery order): `/product`,
  `/how-it-works`, `/scoring` (including the interactive weight-slider
  explorer), `/architecture`, `/use-cases`, `/docs`. The spec's optional
  `/about` page was not committed to either way.

### Follow-up: hero didn't fit the viewport, and lime read as unprofessional

User feedback after seeing the live Home page: the hero (copy + CTA + card
stack + funnel, all stacked in one bordered section) overflowed well past
100vh, so the CTAs weren't visible without scrolling, and the electric-lime
accent (`#C6F432`) read as unprofessional rather than "precision instrument."

- Pulled the funnel out of the hero section into its own section below.
  Hero is now `min-h-[calc(100vh-4rem)]` (4rem = the sticky navbar's height)
  with `flex items-center`, so the headline/CTA/card-stack vertically center
  and fit within the first viewport without scrolling.
- Replaced the lime accent with a refined amber/gold (`#e3a53d` dark /
  `#8a5a0f` light) — still distinct from the dashboard's blue, closer to the
  spec's own "Bloomberg terminal" reference point than the original neon lime.

### Build log: remaining 6 marketing pages (done)

Built out the rest of the site per the original spec, reusing the Phase 8
component set plus new ones where the spec called for genuinely different
interaction patterns:

- **New components**: `FeatureRow` (zig-zag feature sections, used 7x on
  `/product`), `PipelineStepper` (click-to-expand horizontal stepper, used on
  `/how-it-works` for the 7-step pipeline), `WeightExplorer` (8 live sliders
  + a `recharts` donut that recomputes a sample candidate's score in real
  time — `recharts` was already a dependency, no new install needed),
  `ArchitectureDiagram` (plain box-and-arrow system diagram, no illustration
  asset needed), `PersonaCard`, `CodeBlock` (copy-to-clipboard), `Tabs`,
  `EndpointRow` (GET/POST method badges).
- **`/product`**: 7 feature rows (batch discovery, real-time upload, job
  creation, explainability, incremental indexing, security/RLS, dashboard)
  with inline representative UI mocks, plus an 8-tile recap grid.
- **`/how-it-works`**: the full Parse→Extract→Embed→Retrieve→Rank→Explain→Review
  pipeline as an interactive stepper (each step shows input/process/output,
  some with a real code/data snippet), a batch-vs-real-time comparison, and
  the funnel again at full width.
- **`/scoring`**: big Score Bar hero, the interactive weight explorer (sliders
  default to the real `WEIGHT_*` values; the sample candidate's sub-scores
  used are real numbers from an actual test run logged earlier in this
  session, not invented), one card per factor, an annotated anatomy of the
  `ExplanationCard`, and the fairness note from the spec.
- **`/architecture`**: the system diagram, 8 monorepo module cards, a tech
  stack table, and performance/security panels with the real figures (36s,
  16GB RAM, CPU-only, RLS, no service-role key for data access).
- **`/use-cases`**: 4 persona cards (recruiter, TA lead, staffing agency,
  hiring manager) — problem → how the platform helps → which feature, no
  fabricated outcomes, per the spec's honesty rule.
- **`/docs`**: two-pane layout (sticky "on this page" anchor nav + content),
  3-tab quickstart with copy-button terminal blocks, env var table, API
  reference with method-colored endpoint rows, candidate schema field list,
  and a Docker Compose deployment note.
- **Two real bugs found and fixed**:
  1. `lucide-react` in this project doesn't export `Github` (brand icons
     dropped in this major version) — caught by `tsc`, fixed with a small
     inline `GithubIcon.tsx` SVG. Verified every other newly-used icon
     (`UploadCloud`, `ShieldCheck`, `Boxes`, `UserRound`, etc.) actually
     exists in the installed version before shipping, rather than assuming.
  2. `/use-cases` 500'd at runtime: it was a Server Component passing
     `{icon: SomeLucideIcon, ...}` objects as plain prop data into a Client
     Component (`PersonaCard`) — React can't serialize a raw function
     reference across that boundary. This is different from rendering an
     icon as JSX directly (`<Icon />`), which Next's RSC layer does handle
     specially — the bug was specifically storing the component *reference*
     as data inside a plain object. Fixed by making the page itself a Client
     Component (consistent with every other marketing page). Confirmed no
     other server-component page (`/architecture`, `/docs`) has the same
     pattern — both only render icons directly as JSX or pass already-
     rendered elements (e.g. `content: <CodeBlock />`) across the boundary,
     which is safe.
- Validated: `tsc --noEmit` clean, all 8 marketing/auth routes (`/`,
  `/product`, `/how-it-works`, `/scoring`, `/architecture`, `/use-cases`,
  `/docs`, `/login`) return 200 against the live dev server, re-checked after
  the `/use-cases` fix.
- **Not built**: the spec's optional 8th page, `/about`.

## Phase 9 — Dashboard redesign: "Shortlist Ledger" (tokens + AppFrame + Overview done; 7 screens pending)

User supplied a full, detailed spec for a complete recruiter-dashboard redesign
("Shortlist Ledger": Paper/Graphite, job-first, Score Strand as the one
chromatic system, no KPI cards/radar chart/medal badges). Agreed scope for
this round (via `AskUserQuestion`): full replacement of the current blue
theme and pages (same routes, rebuilt screen-by-screen, not a parallel `/v2`
build); this round delivers the design tokens, the AppFrame shell, and a
fully working Overview screen wired to real data. Remaining 7 screens
(Candidates, Jobs, Uploads, Runs, System, Candidate deep-link, Sign-in) and
the heavier components (DossierPane, LedgerTable, WeightLens, CompareTray,
CareerTimeline) are explicitly deferred to follow-up rounds.

- **Tokens** (`globals.css`): replaced the dashboard's `:root`/`.dark`
  background/surface/border/foreground/muted-foreground/accent-fg values
  with the spec's Paper (light default) and Graphite (dark) values — same
  token *names*, so every existing dashboard component (old `Sidebar`,
  `TopNav`, `StatsCard`, `CandidateTable`, etc., not yet migrated to the new
  design) re-themes to Paper/Graphite automatically, even before its layout
  is rebuilt. Also replaced the `violet-*` accent scale (previously blue,
  from an earlier request) with the spec's signal vermilion — same technique,
  same reasoning: one override point re-themes every old
  `bg-violet-600`/`text-violet-400` usage at once. Added new tokens this
  redesign needed that didn't exist before: `--positive`/`--caution`/
  `--negative` (muted, ink-like semantic states) and 8 new
  `--color-ledger-*` factor colors (muted/print-like, ~15% lightened in
  Graphite) — kept distinctly named from the marketing site's own
  `--color-factor-*` (brighter, fixed-across-themes) so the two never collide;
  the marketing site (`mkt-*` tokens) is untouched and confirmed still
  rendering correctly after this change.
- **Fonts**: added Newsreader (serif, for scores/ranks/funnel counts —
  registered as the `font-serif` utility) and swapped the UI body font from
  plain Inter to Inter Tight (denser, per the spec's preference), both via
  `next/font/google` in the root layout alongside the already-loaded
  Instrument Sans and JetBrains Mono. Verified via the font's underlying
  `font-data.json` (not a plain `require()`, which doesn't work for
  `next/font/google`'s special export mechanism) that Newsreader, Fraunces,
  Inter Tight, and Geist are all actually available before committing to them.
- **New components** (`components/ledger/`): `ScoreStrand` (the signature
  component — one stacked bar per candidate, segment widths from
  `reasons.ranking_score_breakdown`, native-tooltip accessible, screen-reader
  label summarizing the full breakdown), `ScoreNumeral` (serif, tabular,
  integer in lists / decimal in the dossier), `FunnelRail` (click-to-expand,
  replaces the KPI card row), `DistributionRibbon` (histogram + a
  pointer/keyboard-draggable shortlist threshold line), `SkillCoverageMatrix`
  (filled/hollow squares, flags required skills nobody has), `JobSwitcher`,
  `LeftRail`, `StatusBar` (polls `getHealth`/`getAIStatus` every 15s, shows a
  "Warming up engine…" state instead of a blank screen during cold start),
  `CommandPalette` (⌘K/Ctrl+K, functional — navigates screens and switches
  jobs by typing, not yet a candidate-ID lookup since no such endpoint
  exists), `AppFrame` (composes all of the above into the 52px-top-bar /
  56px-left-rail / 28px-status-bar frame the spec calls for).
- **Overview screen** (`app/dashboard/page.tsx`, fully rewritten): job
  header (serif title, skill tags, experience/industry/created date), the
  Funnel Rail, a two-column body — Leaderboard (top 25, `ScoreStrand` +
  serif `ScoreNumeral`, no medal badges, no per-factor decimal columns) on
  the left, Distribution Ribbon + Skill Coverage Matrix (top 8 above the
  shortlist line) + a computed "hardest to find" list (required skills
  missing most often) on the right. Empty state when the user has no jobs
  yet: one sentence + an inline paste-a-JD form, no illustration — killing
  the old "Welcome to AI Talent Intelligence" greeting + 4 KPI cards +
  radar chart entirely, per the spec's explicit list of clichés to remove.
  Wired to real endpoints: `listJobs()` for the switcher, `getExistingMatches()`
  (already built in Phase 6) for the ranked leaderboard — no mock data.
  Active job persisted in `localStorage` so it survives a refresh.
- Validated: `tsc --noEmit` clean, `.next` cleared and dev server restarted
  (new fonts), confirmed `/`, `/login` render and `/dashboard`/`/jobs`/
  `/candidates` still correctly 307-redirect when unauthenticated (proxy
  behavior unchanged), confirmed the marketing site (`/architecture`, tested
  live) still renders correctly post-token-change. **Not independently
  verified**: the actual authenticated Overview render — no browser
  automation available in this environment to complete Google sign-in, so
  this needs the user to check directly.
- **Deliberately not done this round**: virtualized/sortable table (Top 25
  is small enough that it wasn't needed yet — real virtualization matters
  more for the full Top-100 Candidates explorer, a later round), Weight Lens,
  Compare Tray, Dossier split-pane (selecting a leaderboard row doesn't yet
  open anything — next round), migrating the other 5 screens' *layouts* (they
  already inherit the new color tokens, but still have their old
  KPI-card/radar-chart/medal-badge structure until rebuilt).

---

## Open items (flagged, not blocking)

1. **Scoring fairness**: uploaded resumes always score weaker on the behavioral sub-score
   (0.10 weight) since they have no platform engagement history — neutral default, not
   zero, but worth knowing.
2. ~~**"Re-rank everyone against job X"**~~ — done, see Phase 6 above.
