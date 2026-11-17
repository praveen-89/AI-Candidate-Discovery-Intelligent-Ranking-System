"""
Shared skill vocabulary, derived from the actual `skills[].name` values present in
datasets/raw/candidates.jsonl. Used by both JobParser (to detect required skills in a
job description) and ResumeParser (to detect skills in an uploaded resume), so job
requirements and resumes are matched against the same vocabulary the 100k base pool
uses.
"""

KNOWN_SKILLS = [
    "ASR", "AWS", "Accounting", "Agile", "Airflow", "Angular", "Apache Beam",
    "Apache Flink", "Azure", "BM25", "BentoML", "BigQuery", "CI/CD", "CNN", "CSS",
    "Computer Vision", "Content Matching", "Content Writing", "Data Pipelines",
    "Data Science", "Databricks", "Deep Learning", "Diffusion Models", "Django",
    "Docker", "Document Processing", "ETL", "Elasticsearch", "Embeddings", "Excel",
    "FAISS", "FastAPI", "Feature Engineering", "Figma", "Fine-tuning LLMs", "Flask",
    "Forecasting", "GANs", "GCP", "Go", "GraphQL", "HTML", "Hadoop", "Haystack",
    "Hugging Face Transformers", "Illustrator", "Image Classification",
    "Indexing Algorithms", "Information Retrieval", "Information Retrieval Systems",
    "Java", "JavaScript", "Kafka", "Kubeflow", "Kubernetes", "LLMs", "LangChain",
    "Learning to Rank", "LlamaIndex", "LoRA", "MLOps", "MLflow", "Machine Learning",
    "Marketing", "Microservices", "Milvus", "Model Adaptation", "MongoDB", "NLP",
    "Natural Language Processing", "Next.js", "Node.js", "Object Detection",
    "Open-source ML libraries", "OpenCV", "OpenSearch", "PEFT", "Photoshop",
    "Pinecone", "PostgreSQL", "PowerPoint", "Project Management", "Prompt Engineering",
    "PyTorch", "Python", "QLoRA", "Qdrant", "RAG", "REST APIs", "Ranking Systems",
    "React", "Recommendation Systems", "Redis", "Redux", "Reinforcement Learning",
    "Rust", "SAP", "SEO", "SQL", "Sales", "Salesforce CRM", "Scrum",
    "Search & Discovery", "Search Backend", "Search Infrastructure", "Semantic Search",
    "Sentence Transformers", "Six Sigma", "Snowflake", "Spark", "Speech Recognition",
    "Spring Boot", "Statistical Modeling", "TTS", "Tailwind", "Tally", "TensorFlow",
    "Terraform", "Text Encoders", "Time Series", "TypeScript",
    "Vector Representations", "Vector Search", "Vue.js", "Weaviate", "Webpack",
    "Weights & Biases", "Workflow Orchestration", "YOLO", "dbt", "gRPC", "pgvector",
    "scikit-learn", "C++", "Qdrant", "NoSQL", "A/B Testing", "NDCG",
]

# De-duplicated, lowercase -> canonical-case lookup, longest-first so multi-word
# skills ("Fine-tuning LLMs") are matched before shorter substrings ("LLMs").
_SEEN = set()
_UNIQUE_SKILLS = []
for _s in KNOWN_SKILLS:
    _key = _s.lower()
    if _key not in _SEEN:
        _SEEN.add(_key)
        _UNIQUE_SKILLS.append(_s)

KNOWN_SKILLS = sorted(_UNIQUE_SKILLS, key=len, reverse=True)
