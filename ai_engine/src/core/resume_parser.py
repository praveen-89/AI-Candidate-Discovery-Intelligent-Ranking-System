import os
import re
from datetime import datetime
from typing import Dict, Any, List, Optional

from utils.logger import get_logger
from core.exceptions import RankingEngineError
from core.skills_taxonomy import KNOWN_SKILLS

logger = get_logger(__name__)

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False
    logger.warning("python-docx not installed. ResumeParser cannot read .docx files.")

try:
    from pypdf import PdfReader
    HAS_PDF = True
except ImportError:
    HAS_PDF = False
    logger.warning("pypdf not installed. ResumeParser cannot read .pdf files.")


class UnsupportedResumeFormat(RankingEngineError):
    """Raised when the uploaded resume file extension is not supported."""
    pass


SECTION_HEADERS = {
    "experience": [
        "work experience", "professional experience", "experience",
        "employment history", "career history", "work history",
    ],
    "education": ["education", "academic background", "academic qualifications"],
    "skills": ["skills", "technical skills", "core competencies", "key skills"],
    "summary": ["summary", "professional summary", "objective", "profile"],
    "certifications": ["certifications", "certificates", "licenses"],
}

_DATE_TOKEN = r"(?:[A-Za-z]{3,9}\.?\s+\d{4}|\d{1,2}/\d{4}|\d{4})"
_DATE_RANGE_RE = re.compile(
    rf"({_DATE_TOKEN})\s*(?:-|–|—|to)\s*({_DATE_TOKEN}|present|current|now)",
    re.IGNORECASE,
)
_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_PHONE_RE = re.compile(r"(\+?\d[\d\s\-()]{8,}\d)")
_EXPERIENCE_YEARS_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*\+?\s*years?(?:\s+of)?\s+experience", re.IGNORECASE
)

DEGREE_KEYWORDS = [
    "b.tech", "btech", "b.e.", "be ", "bachelor", "b.sc", "bsc",
    "m.tech", "mtech", "m.e.", "master", "m.sc", "msc", "mba",
    "phd", "ph.d", "doctorate", "diploma", "b.com", "bcom", "m.com", "mcom",
]


def extract_text_from_pdf(path: str) -> str:
    if not HAS_PDF:
        raise UnsupportedResumeFormat("pypdf is not installed; cannot parse PDF resumes.")
    reader = PdfReader(path)
    pages_text = []
    for page in reader.pages:
        try:
            pages_text.append(page.extract_text() or "")
        except Exception:
            logger.exception("Failed to extract text from a PDF page; skipping it.")
    return "\n".join(pages_text)


def extract_text_from_docx(path: str) -> str:
    if not HAS_DOCX:
        raise UnsupportedResumeFormat("python-docx is not installed; cannot parse DOCX resumes.")
    doc = docx.Document(path)
    # Blank paragraphs are kept (not filtered) — they are the main signal used to
    # separate one job/education entry from the next in _split_blank_separated_blocks.
    return "\n".join(p.text for p in doc.paragraphs)


def extract_text_from_txt(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def extract_text(path: str) -> str:
    """
    Dispatches to the right extractor based on file extension.
    """
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(path)
    if ext == ".docx":
        return extract_text_from_docx(path)
    if ext in (".txt", ".md"):
        return extract_text_from_txt(path)
    raise UnsupportedResumeFormat(f"Unsupported resume file extension: '{ext}'. Supported: .pdf, .docx, .txt")


def _split_into_sections(raw_text: str) -> Dict[str, List[str]]:
    """
    Splits resume text into named sections based on common header lines.
    Lines that occur before the first recognized header are bucketed under "header".
    Blank lines are preserved (as "") within each section's line list — they are the
    primary signal `_split_blank_separated_blocks` uses to tell consecutive job /
    education entries apart.
    """
    lines = [l.strip() for l in raw_text.split("\n")]
    sections: Dict[str, List[str]] = {"header": []}
    current = "header"

    header_lookup = {}
    for section, aliases in SECTION_HEADERS.items():
        for alias in aliases:
            header_lookup[alias] = section

    for line in lines:
        if not line:
            sections.setdefault(current, []).append("")
            continue
        normalized = line.lower().strip(" :-")
        matched_section = None
        if len(normalized) <= 40:
            for alias, section in header_lookup.items():
                if normalized == alias or normalized.startswith(alias):
                    matched_section = section
                    break
        if matched_section:
            current = matched_section
            sections.setdefault(current, [])
            continue
        sections.setdefault(current, []).append(line)

    # Trim leading/trailing blank markers per section (cosmetic, keeps callers simple).
    for key, section_lines in sections.items():
        while section_lines and section_lines[0] == "":
            section_lines.pop(0)
        while section_lines and section_lines[-1] == "":
            section_lines.pop()

    return sections


def _split_blank_separated_blocks(lines: List[str]) -> List[List[str]]:
    """
    Splits a section's lines into blocks separated by blank ("") lines — the normal
    way one job/education entry is visually separated from the next in a resume.
    Consecutive blanks collapse; leading/trailing blanks are ignored.
    """
    blocks: List[List[str]] = []
    current: List[str] = []
    for line in lines:
        if line == "":
            if current:
                blocks.append(current)
                current = []
        else:
            current.append(line)
    if current:
        blocks.append(current)
    return blocks


def _is_date_only_line(line: str) -> bool:
    """
    True if a line is essentially just a date range (e.g. "Jan 2021 - Present"),
    as opposed to a header/description line that happens to mention a date.
    """
    match = _DATE_RANGE_RE.search(line)
    if not match:
        return False
    remainder = (line[:match.start()] + line[match.end():]).strip(" ,.-–—|")
    return len(remainder) <= 3


def _parse_experience_block(block_lines: List[str]) -> Optional[Dict[str, Any]]:
    """
    Best-effort parse of one job entry out of a handful of resume lines.
    The first line is treated as the header ("Title at Company" / "Title, Company"),
    a standalone date-range line anchors start/end dates, and everything else is
    folded into the description.
    """
    if not block_lines:
        return None

    header_line = block_lines[0]
    date_line = None
    desc_lines: List[str] = []
    for line in block_lines[1:]:
        if date_line is None and _is_date_only_line(line):
            date_line = line
        else:
            desc_lines.append(line)

    date_match = _DATE_RANGE_RE.search(date_line or header_line)

    title = ""
    company = ""
    for sep in [" at ", " @ ", " - ", " – ", ","]:
        if sep in header_line:
            parts = header_line.split(sep, 1)
            title, company = parts[0].strip(), parts[1].strip()
            break
    if not title and not company:
        title = header_line.strip()

    is_current = False
    start_date, end_date, duration_months = None, None, 0
    if date_match:
        start_raw, end_raw = date_match.group(1), date_match.group(2)
        is_current = end_raw.lower() in ("present", "current", "now")
        start_date = _normalize_partial_date(start_raw)
        end_date = None if is_current else _normalize_partial_date(end_raw)
        duration_months = _months_between(start_date, end_date, is_current)

    description = " ".join(desc_lines).strip()

    if not title and not company and not date_match:
        return None

    return {
        "company": company or "Unknown",
        "title": title or "Unknown",
        "start_date": start_date,
        "end_date": end_date,
        "duration_months": duration_months,
        "is_current": is_current,
        "industry": "",
        "company_size": "unknown",
        "description": description,
    }


def _normalize_partial_date(token: str) -> Optional[str]:
    """
    Normalizes a loosely-formatted date token ("Jan 2021", "2021", "01/2021") into an
    ISO date string ("2021-01-01"). Falls back to None if it can't be parsed.
    """
    token = token.strip()
    year_match = _YEAR_RE.search(token)
    if not year_match:
        return None
    year = int(year_match.group(0))

    month = 1
    month_match = re.search(r"[A-Za-z]{3,9}", token)
    if month_match:
        try:
            month = datetime.strptime(month_match.group(0)[:3], "%b").month
        except ValueError:
            month = 1
    elif "/" in token:
        try:
            month = int(token.split("/")[0])
        except ValueError:
            month = 1

    try:
        return datetime(year, month, 1).date().isoformat()
    except ValueError:
        return f"{year}-01-01"


def _months_between(start_iso: Optional[str], end_iso: Optional[str], is_current: bool) -> int:
    if not start_iso:
        return 0
    start = datetime.strptime(start_iso, "%Y-%m-%d")
    end = datetime.utcnow() if is_current or not end_iso else datetime.strptime(end_iso, "%Y-%m-%d")
    months = (end.year - start.year) * 12 + (end.month - start.month)
    return max(months, 0)


def _parse_career_history(section_lines: List[str]) -> List[Dict[str, Any]]:
    """
    Groups experience-section lines into per-job blocks using blank lines as entry
    separators (the normal visual separator between jobs on a resume), then parses
    each block independently. If a resume crams every job together with no blank
    line between them, this falls back to treating the whole section as one block
    (a known best-effort limitation of a regex-based parser with no layout/formatting
    cues to lean on).
    """
    blocks = _split_blank_separated_blocks(section_lines)
    jobs = []
    for block in blocks:
        parsed = _parse_experience_block(block)
        if parsed:
            jobs.append(parsed)
    return jobs


def _parse_education(section_lines: List[str]) -> List[Dict[str, Any]]:
    section_lines = [l for l in section_lines if l.strip()]
    if not section_lines:
        return []

    # Group lines: a line containing a degree keyword starts a new entry; lines
    # without one (e.g. wrapped continuation text) are folded into the current entry.
    current_entry_lines: List[str] = []
    grouped: List[List[str]] = []
    for line in section_lines:
        lower = line.lower()
        has_degree = any(kw in lower for kw in DEGREE_KEYWORDS)
        if has_degree and current_entry_lines:
            grouped.append(current_entry_lines)
            current_entry_lines = [line]
        else:
            current_entry_lines.append(line)
    if current_entry_lines:
        grouped.append(current_entry_lines)

    entries = []
    for group in grouped:
        text = ", ".join(group)
        year_matches = [int(y) for y in re.findall(r"\b(19\d{2}|20\d{2})\b", text)]
        start_year = min(year_matches) if year_matches else None
        end_year = max(year_matches) if year_matches else None

        degree, field, institution = "", "", ""
        for part in (p.strip() for p in text.split(",") if p.strip()):
            part_lower = part.lower()
            is_date_part = bool(re.fullmatch(r"[\d\s\-–—]+", part)) or bool(_DATE_RANGE_RE.search(part))
            if is_date_part:
                continue
            if not degree and any(kw in part_lower for kw in DEGREE_KEYWORDS):
                if " in " in part_lower:
                    idx = part_lower.index(" in ")
                    degree, field = part[:idx].strip(), part[idx + 4:].strip()
                else:
                    degree = part
                continue
            if not institution:
                institution = part

        entries.append({
            "institution": institution or "Unknown",
            "degree": degree.title() if degree else "Unknown",
            "field_of_study": field,
            "start_year": start_year,
            "end_year": end_year,
            "grade": None,
            "tier": "unknown",
        })

    return entries


def _parse_skills(raw_text: str) -> List[Dict[str, Any]]:
    text_lower = raw_text.lower()
    found = []
    seen = set()
    for skill in KNOWN_SKILLS:
        key = skill.lower()
        if key in seen:
            continue
        if re.search(r"\b" + re.escape(key) + r"\b", text_lower):
            seen.add(key)
            found.append({
                "name": skill,
                "proficiency": "intermediate",
                "endorsements": 0,
                "duration_months": 0,
            })
    return found


def _estimate_years_of_experience(raw_text: str, career_history: List[Dict[str, Any]]) -> Optional[float]:
    match = _EXPERIENCE_YEARS_RE.search(raw_text)
    if match:
        return float(match.group(1))

    if career_history:
        total_months = sum(job.get("duration_months", 0) for job in career_history)
        if total_months > 0:
            return round(total_months / 12.0, 1)
    return None


def _default_redrob_signals() -> Dict[str, Any]:
    """
    Neutral defaults for platform-engagement signals that cannot be derived from a
    resume. These mirror the neutral fallbacks `preprocessing/feature_extractor.py`
    already applies for missing data, so an uploaded resume is scored on
    skill/semantic/education/career merit without being artificially boosted or
    penalized on signals it structurally cannot have.
    """
    today = datetime.utcnow().date().isoformat()
    return {
        "profile_completeness_score": 60.0,
        "signup_date": today,
        "last_active_date": today,
        "open_to_work_flag": True,
        "profile_views_received_30d": 0,
        "applications_submitted_30d": 0,
        "recruiter_response_rate": 0.0,
        "avg_response_time_hours": 0.0,
        "skill_assessment_scores": {},
        "connection_count": 0,
        "endorsements_received": 0,
        "notice_period_days": 30,
        "expected_salary_range_inr_lpa": {"min": 0, "max": 0},
        "preferred_work_mode": "flexible",
        "willing_to_relocate": False,
        "github_activity_score": -1,
        "search_appearance_30d": 0,
        "saved_by_recruiters_30d": 0,
        "interview_completion_rate": 0.0,
        "offer_acceptance_rate": -1,
        "verified_email": False,
        "verified_phone": False,
        "linkedin_connected": False,
    }


class ResumeParser:
    """
    Parses an uploaded resume file (PDF/DOCX/TXT) into the same structured shape as
    datasets/raw/candidate_schema.json, so it can flow through the exact same
    feature-extraction, embedding, and ranking code as the 100k base candidate pool.
    """

    def __init__(self, file_path: str, candidate_id: str):
        self.file_path = file_path
        self.candidate_id = candidate_id
        self.raw_text = ""

    def parse(self) -> Dict[str, Any]:
        self.raw_text = extract_text(self.file_path)
        if not self.raw_text.strip():
            logger.warning(f"No text extracted from resume at {self.file_path}.")

        sections = _split_into_sections(self.raw_text)
        header_lines = [l for l in sections.get("header", []) if l.strip()]
        summary_lines = [l for l in sections.get("summary", []) if l.strip()]

        name = header_lines[0].strip() if header_lines else "Unknown Candidate"
        email_match = _EMAIL_RE.search(self.raw_text)
        phone_match = next(
            (m for m in _PHONE_RE.finditer(self.raw_text) if len(re.sub(r"\D", "", m.group(0))) >= 9),
            None,
        )

        career_history = _parse_career_history(sections.get("experience", []))
        education = _parse_education(sections.get("education", []))
        skills = _parse_skills(self.raw_text)
        years_of_experience = _estimate_years_of_experience(self.raw_text, career_history)

        current_job = next((j for j in career_history if j.get("is_current")), None)
        current_title = current_job.get("title") if current_job else (career_history[0].get("title") if career_history else "")
        current_company = current_job.get("company") if current_job else (career_history[0].get("company") if career_history else "")

        summary_text = " ".join(summary_lines).strip() or " ".join(header_lines[1:]).strip()

        candidate: Dict[str, Any] = {
            "candidate_id": self.candidate_id,
            "profile": {
                "anonymized_name": name,
                "headline": header_lines[1].strip() if len(header_lines) > 1 else current_title or "",
                "summary": summary_text,
                "location": "",
                "country": "",
                "years_of_experience": years_of_experience if years_of_experience is not None else 0.0,
                "current_title": current_title or "",
                "current_company": current_company or "",
                "current_company_size": "unknown",
                "current_industry": "",
            },
            "career_history": career_history or [{
                "company": "Unknown", "title": "Unknown", "start_date": None, "end_date": None,
                "duration_months": 0, "is_current": False, "industry": "", "company_size": "unknown",
                "description": "",
            }],
            "education": education,
            "skills": skills,
            "certifications": [],
            "languages": [],
            "redrob_signals": _default_redrob_signals(),
            "contact": {
                "email": email_match.group(0) if email_match else None,
                "phone": phone_match.group(0).strip() if phone_match else None,
            },
        }
        return candidate
