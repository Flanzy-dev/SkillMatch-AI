#!/usr/bin/env python3
"""
Import Job Vacancies Dataset into MongoDB Serverless (Atlas).
Supports:
  - Glints dataset (glints_dataset.csv)
  - Simaremare dataset (simaremare_jobs.csv)
  - Kaggle Jobstreet dataset (jobstreet_*.csv)
"""

import os
import sys
import csv
import re
import argparse
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
env_local = Path(".env.local")
if env_local.exists():
    load_dotenv(env_local)
else:
    load_dotenv(".env")

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "excelinjourney_db_user")

if not MONGODB_URI:
    print("Error: MONGODB_URI is not set in environment or .env.local")
    sys.exit(1)


def clean_text(text: str) -> str:
    """Normalize whitespace and strip HTML/escaped chars."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_skills_from_str(raw: str) -> list[str]:
    """Extract and clean skill list from comma-separated or pipe-separated strings."""
    if not raw or raw.strip() in ("N/A", "None", "-"):
        return []

    # If it's simaremare style: "Category | Skills Skill1 Skill2 ..."
    if "| Skills" in raw:
        raw = raw.split("| Skills", 1)[1]

    # Split by comma or semicolon
    parts = re.split(r"[,;]+", raw)
    skills = []
    seen = set()
    for p in parts:
        cleaned = clean_text(p)
        cleaned_lower = cleaned.lower()
        if 2 <= len(cleaned) <= 40 and cleaned_lower not in seen:
            seen.add(cleaned_lower)
            skills.append(cleaned)
    return skills[:15]


def create_summary(title: str, company: str, location: str, desc: str) -> dict[str, str]:
    """Generate clean localized summary { id, en }."""
    clean_desc = clean_text(desc)
    # Remove redundant prefix like "Deskripsi pekerjaan ..."
    clean_desc = re.sub(r"^(?:Deskripsi pekerjaan|Job Description)\s+.*?(?:Kualifikasi|Responsibilities|Requirements|:\s*)", "", clean_desc, flags=re.IGNORECASE)
    clean_desc = clean_text(clean_desc)
    
    # Truncate to reasonable sentence length for summary
    short_desc = clean_desc[:250].rsplit(" ", 1)[0] if len(clean_desc) > 250 else clean_desc
    if not short_desc.endswith("."):
        short_desc += "..."

    loc_id = f" di {location}" if location and location != "N/A" else ""
    loc_en = f" in {location}" if location and location != "N/A" else ""

    summary_id = f"Posisi {title} pada {company}{loc_id}. Tanggung jawab dan persyaratan: {short_desc}"
    summary_en = f"{title} opportunity at {company}{loc_en}. Key requirements and responsibilities: {short_desc}"

    return {
        "id": summary_id[:350],
        "en": summary_en[:350],
    }


def parse_job_row(row: dict, index: int, prefix: str) -> dict | None:
    """Detect format and return structured Job document matching jobSchema."""
    # Column detection
    title = (
        row.get("job_title")
        or row.get("title")
        or row.get("Judul Pekerjaan")
        or ""
    ).strip()
    company = (
        row.get("company_name")
        or row.get("company")
        or row.get("Perusahaan")
        or ""
    ).strip()
    location = (
        row.get("location")
        or row.get("job_location")
        or row.get("Lokasi")
        or ""
    ).strip()
    raw_skills = (
        row.get("job_requirements")
        or row.get("requirement")
        or row.get("skills")
        or ""
    ).strip()
    desc = (
        row.get("job_responsibilities")
        or row.get("description")
        or row.get("job_description")
        or ""
    ).strip()

    if not title or not company:
        return None

    skills = extract_skills_from_str(raw_skills)

    # If skills are empty or very short, extract common skills from title and description
    if len(skills) < 2 and desc:
        common_tech = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "SQL",
            "PostgreSQL", "MySQL", "MongoDB", "PHP", "Laravel", "Docker", "Git",
            "REST API", "Figma", "HTML", "CSS", "AWS", "Linux", "Excel", "Data Analysis"
        ]
        text_to_search = f"{title} {desc}".lower()
        for tech in common_tech:
            if re.search(r"\b" + re.escape(tech.lower()) + r"\b", text_to_search):
                if tech.lower() not in [s.lower() for s in skills]:
                    skills.append(tech)

    # Need at least 1 skill
    if not skills:
        skills = [title.split()[-1] if len(title.split()[-1]) > 2 else "Communication"]

    summary = create_summary(title, company, location, desc)

    return {
        "id": f"job-{prefix}-{index:05d}",
        "title": clean_text(title),
        "company": clean_text(company),
        "summary": summary,
        "skills": skills[:12],
    }


def main():
    parser = argparse.ArgumentParser(description="Import job listings into MongoDB.")
    parser.add_argument(
        "--file",
        default="glints_dataset.csv",
        help="Path to CSV dataset file (default: glints_dataset.csv)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=1500,
        help="Maximum number of jobs to import (default: 1500, use 0 for all)",
    )
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append to existing jobs instead of replacing imported jobs",
    )
    parser.add_argument(
        "--tech-priority",
        action="store_true",
        default=True,
        help="Prioritize technology and digital roles (default: True)",
    )

    args = parser.parse_args()

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    print(f"Connecting to MongoDB Atlas ({MONGODB_DB_NAME})...")
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
    db = client[MONGODB_DB_NAME]
    jobs_col = db["jobs"]

    print(f"Connected! Current jobs in collection: {jobs_col.count_documents({})}")
    print(f"Reading dataset from {file_path}...")

    prefix = file_path.stem[:6].lower()

    tech_keywords = [
        "developer", "engineer", "software", "data", "it", "web", "frontend",
        "backend", "full stack", "fullstack", "mobile", "android", "ios", "devops",
        "cloud", "system", "network", "qa", "analyst", "designer", "ui/ux",
        "product", "security", "database", "ai", "machine learning"
    ]

    seen = set()
    tech_candidates = []
    other_candidates = []

    with open(file_path, mode="r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        idx = 1
        for row in reader:
            job = parse_job_row(row, idx, prefix)
            if not job:
                continue

            dedup_key = (job["title"].lower(), job["company"].lower())
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            # Categorize
            searchable = (job["title"] + " " + " ".join(job["skills"])).lower()
            if any(k in searchable for k in tech_keywords):
                tech_candidates.append(job)
            else:
                other_candidates.append(job)

            idx += 1

    print(f"Found {len(tech_candidates)} tech/engineering roles and {len(other_candidates)} other roles.")

    # Combine according to limit
    if args.limit > 0:
        # Give ~65% tech and ~35% other professions
        tech_limit = int(args.limit * 0.65)
        other_limit = args.limit - tech_limit
        selected_jobs = tech_candidates[:tech_limit] + other_candidates[:other_limit]
    else:
        selected_jobs = tech_candidates + other_candidates

    # Re-index ids sequentially
    for i, j in enumerate(selected_jobs, 1):
        j["id"] = f"job-{prefix}-{i:04d}"

    print(f"Prepared {len(selected_jobs)} jobs for insertion into MongoDB.")

    # Preserve initial baseline sample jobs (job-01 to job-14)
    if not args.append:
        print("Cleaning up previously imported dataset jobs (preserving baseline sample jobs)...")
        res = jobs_col.delete_many({"id": {"$regex": r"^job-(?!0[1-9]|1[0-4]$)"}})
        print(f"Deleted {res.deleted_count} previous imported jobs.")

    # Insert in batches
    BATCH_SIZE = 500
    total_inserted = 0
    for i in range(0, len(selected_jobs), BATCH_SIZE):
        batch = selected_jobs[i : i + BATCH_SIZE]
        # Use ordered=False to continue on any duplicate id
        try:
            res = jobs_col.insert_many(batch, ordered=False)
            total_inserted += len(res.inserted_ids)
            print(f"  Inserted batch {i//BATCH_SIZE + 1} ({len(res.inserted_ids)} jobs)")
        except Exception as e:
            print(f"  Batch error (handled): {e}")

    # Ensure unique index on id
    jobs_col.create_index("id", unique=True)
    jobs_col.create_index("skills")
    jobs_col.create_index("title")

    final_count = jobs_col.count_documents({})
    print(f"\nSuccessfully imported jobs!")
    print(f"Total jobs in MongoDB Atlas: {final_count}")

    client.close()


if __name__ == "__main__":
    main()
