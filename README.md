# India Runs Data & AI Challenge - Candidate Ranking System

## Working Source Code
The core working source code is located in the `src/` directory. It is organized into modular pipelines:
- `src/embeddings/`: Transformer-based embedding generation.
- `src/retrieval/`: FAISS dense vector search.
- `src/ranking/`: 8-factor linear blend hybrid ranking engine.
- `src/explainability/`: Dynamic reason generation.
- `src/core/`: Native .docx parsing for job descriptions.

## Project Structure
```text
├── configs/
├── docs/
├── scripts/
│   ├── inference.py
│   └── profile_inference.py
├── src/
│   ├── config/
│   ├── core/
│   ├── data/
│   ├── embeddings/
│   ├── evaluation/
│   ├── explainability/
│   ├── preprocessing/
│   ├── ranking/
│   ├── retrieval/
│   └── utils/
├── tests/
├── README.md
├── requirements.txt
└── pyproject.toml
```

## Requirements
- **Python 3.11+**
- **Hardware constraints:** Designed to run on a standard CPU with ≤ 16GB RAM.
- **Dependencies:** 
  - `sentence-transformers`
  - `faiss-cpu`
  - `python-docx`
  - `pydantic`
  (See `requirements.txt` for the full list)

## Installation Instructions
1. Clone this repository to your local machine.
2. Create a clean virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   - **Windows:** `.venv\Scripts\activate`
   - **Linux/Mac:** `source .venv/bin/activate`
4. Install all required dependencies:
   ```bash
   pip install -r requirements.txt
   pip install python-docx
   ```

## Scripts to Reproduce Results
To reproduce the end-to-end inference pipeline and generate the top-100 ranked candidates:

1. Ensure the dataset (`candidates.jsonl`) and the target job description (`job_description.docx`) are available. By default, the script looks in the repository root or `data/raw/`.
2. Execute the inference script:
   ```bash
   python scripts/inference.py <path_to_candidates.jsonl> <path_to_output_submission.json> <path_to_manifest.json>
   ```

**Example (using default paths):**
```bash
python scripts/inference.py
```
This script will autonomously parse the `.docx` job description, stream the candidates, generate vector embeddings, rank them using the hybrid scorer, and output the final `submission.json` and `manifest.json` files.
