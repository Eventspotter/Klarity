# Klarity

> *Every piece of content. One clear brand identity.*

**Klarity** is an AI-powered brand consistency and governance platform that ensures organizational content stays on-brand, accurate, and compliant across all channels before publication.

---

## The Problem

Modern organizations publish content across distributed teams, external agencies, and AI generators. Without centralized governance, messaging diverges, visual standards slip, and unverified claims create brand and compliance risks.

| S.No | Challenge | Impact |
|---|---|---|
| 1 | **Inconsistent Messaging** | Fragmented voice, tone, and terminology across marketing channels |
| 2 | **Factual Inaccuracies** | Outdated product details, unverified claims, and compliance exposure |
| 3 | **Visual Non-Compliance** | Incorrect color palettes, typography, and logo usage |
| 4 | **Fragmented Review Loops** | Disjointed feedback across chat apps and email with no audit trail |
| 5 | **Governance Blind Spots** | No visibility into recurring errors or gaps in brand documentation |

---

## The Solution

Klarity acts as an intelligent brand control center. Content is validated in real time against approved guidelines, verified facts, and design tokens. Rather than just rejecting drafts, Klarity flags specific deviations, links to supporting guidelines, and provides contextual corrections that preserve the author's intent.

### Core Workflow

1. **Knowledge Ingestion** — Centralize brand guidelines, tone rules, approved terminology, verified facts, and design tokens.
2. **Pre-flight & Audit** — Analyze drafts using heuristic rules and AI validation to detect tone drift, prohibited terms, and factual mismatches.
3. **Actionable Feedback** — Generate an evidence-backed audit report with a compliance score (0–100), severity breakdown, and suggested fixes.
4. **Structured Governance** — Route submissions through an editorial review lifecycle with role-specific approval authority.

---

## Key Differentiators

- **Evidence-Based Validation** — Every flagged issue cites a specific approved guideline or authoritative source.
- **Context-Aware Corrections** — Targeted suggestions resolve specific issues rather than generic content rewriting.
- **Unified Brand Intelligence** — Single source of truth for guidelines, factual constraints, and reusable assets.
- **Human-in-the-Loop Governance** — Final review and sign-off authority remains strictly with authorized personnel.
- **Continuous Brand Health Insights** — Pinpoints recurring mistakes and areas where brand documentation requires clarification.

---

## Implemented Features

### 1. Creator Studio
- Real-time pre-flight analysis with live compliance score (0–100) calculated as content is drafted.
- Inline detection for tone drift, banned vocabulary, missing disclaimers, and guideline matches.
- Multi-format support (Markdown, rich text, campaign copy) with direct submission into the review queue.

### 2. Editorial Review Desk
- Structured review lifecycle: `Draft` → `Pending` → `Reviewing` → `Needs Changes` → `Approved` / `Rejected`.
- Evidence-backed violation reports with severity indicators (High, Medium, Low) and direct guideline citations.
- Reviewer comments, audit notes, revision logs, and status transitions with timestamp tracking.

### 3. Editorial Calendar & Scheduler
- Monthly calendar grid and upcoming publication timeline.
- Schedule release dates, filter by review status, and track publishing pipelines.
- Direct linking between scheduled items and their underlying compliance reports.

### 4. Brand Guidelines Management
- Structured guideline catalog across five pillars: Voice & Tone, Terminology, Messaging, Visuals, and Compliance.
- Full CRUD operations with priority weighting (1–5) and category filtering.
- Dynamic rule synchronization feeding directly into the validation engine.

### 5. Brand Assets & Design Tokens
- Digital asset repository for official SVG wordmarks, monograms, and campaign plates.
- Interactive color token swatches with hex codes, role labels, and CSS variables.
- Typography specifications pairing display and body font specimens.

### 6. Team Governance & Role-Based Access Control (RBAC)
- Three discrete organizational roles with dedicated permission matrices:
  - **Brand Owner (Admin)**: Full governance, guideline authoring, team roster management, brand code issuance, and workspace settings.
  - **Reviewer (Auditor)**: Editorial queue oversight, compliance audits, and approval/rejection authority.
  - **Team Member (Creator)**: Creator Studio authoring, live pre-flight checks, and personal submission tracking.
- Brand Value Code verification preventing unauthorized workspace entry.
- Admin review queue for verifying pending team member registrations.

### 7. Multi-Brand Workspace Directory
- Multi-tenant architecture supporting instant context switching across 5 curated showcase brands:
  1. **Aster & Oak** (`KLARITY-2026`) — Sustainable Luxury & Craft
  2. **Nova Athletics** (`NOVA-4821`) — High-Performance Activewear
  3. **Ember & Ivy** (`EMBER-7390`) — Artisanal Home & Botanicals
  4. **Solaris Media** (`SOLAR-5147`) — Next-Gen Digital Media Studio
  5. **Velvet Thread** (`VELVET-6283`) — Modern Tailoring & Haute Couture
- Strict multi-brand isolation: Brand Directory is locked to the 5 showcase brands for demo owners, while private custom organizations remain completely isolated with zero cross-tenant data leakage.

### 8. Analytics & Governance Insights
- Aggregated brand health metrics and compliance score distribution.
- Issue frequency tracking to pinpoint commonly violated guidelines.
- Departmental review velocity and approval throughput charts.

### 9. 1-Click Evaluation Profiles
- Dedicated 1-click login profiles on `/login` for rapid testing and hackathon evaluation:
  - **Elena Vance** — Brand Owner (`judge.owner@klarity.local` / `klarity`)
  - **Marcus Chen** — Reviewer (`judge.reviewer@klarity.local` / `klarity`)
  - **Maya Iyer** — Team Member (`judge.member@klarity.local` / `klarity`)

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, Vite | Modular single-page application built with custom hooks and context state |
| **Styling & Motion** | CSS Design Tokens, Motion, GSAP | System design variables, responsive fluid layouts, and micro-interactions |
| **UI Components** | Lucide React, React Day Picker | Accessible iconography and custom calendar date selection |
| **Backend** | Python 3.12, FastAPI, Uvicorn | Asynchronous REST API with Pydantic v2 schemas and request validation |
| **Database & ORM** | PostgreSQL, SQLite, SQLAlchemy 2.0 | PostgreSQL for production on Render; SQLite for zero-config local development |
| **Security & Auth** | PBKDF2-SHA256, HTTP-only Cookies | Salted password hashing, revocable server-side sessions, CORS, and BotShield |
| **Deployment** | Render, Webhooks | Cloud API hosting and static frontend delivery with automated webhook CI/CD |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Vite + React 18)            │
│   Creator Studio  │  Review Desk  │  Guidelines  │  Assets  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON / Session Cookies
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Gateway                   │
│   BotShield Middleware  │  CORS & Security  │  Session Auth │
└───────┬──────────────────────┬──────────────────────┬───────┘
        │                      │                      │
┌───────▼──────────────┐┌──────▼──────────────┐┌──────▼───────┐
│ Compliance Engine    ││ Workspace Router    ││ Auth & RBAC  │
│ - Rule-based Matcher ││ - Bootstrap Service ││ - Multi-Brand│
│ - Scoring (0-100)    ││ - Guidelines CRUD   ││ - Code Verify│
│ - Severity Tagging   ││ - Review Workflow   ││ - Team Roster│
└───────┬──────────────┘└──────┬──────────────┘└──────┬───────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │ SQLAlchemy 2.0 ORM
┌──────────────────────────────▼──────────────────────────────┐
│                  Database Storage Layer                     │
│        SQLite (Local Dev) / PostgreSQL (Production)         │
│  Accounts │ Sessions │ Brands │ Guidelines │ Submissions    │
└─────────────────────────────────────────────────────────────┘
```

---

## API Overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Service health and database connectivity check |
| `GET` | `/api/bootstrap` | Authenticated | Consolidated workspace data (stats, guidelines, submissions, activity) |
| `POST` | `/api/auth/register` | Public | Register new account with role and optional Brand Value Code |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and establish revocable cookie session |
| `POST` | `/api/auth/logout` | Authenticated | Revoke active session and clear client credentials |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and role visibility matrix |
| `GET` | `/api/auth/brands` | Public | List available showcase brands for registration lookup |
| `GET` | `/api/auth/brand-directory` | Authenticated | Fetch curated demo brands (Owners) or assigned brand (Members) |
| `POST` | `/api/auth/switch-brand` | Owner Only | Switch active workspace among authorized showcase brands |
| `GET/POST` | `/api/auth/team-members` | Owner Only | View workspace team roster or invite new team members |
| `PATCH/DELETE`| `/api/auth/team-members/{id}` | Owner Only | Update member role/password or revoke membership |
| `GET` | `/api/auth/pending-accounts` | Owner Only | List pending reviewer/member registrations awaiting verification |
| `POST` | `/api/auth/verify-account` | Owner Only | Verify and activate pending team accounts |
| `GET/POST` | `/api/guidelines` | Authenticated | List brand guidelines or create a new guideline rule |
| `GET/PATCH/DELETE` | `/api/guidelines/{id}` | Authenticated | Retrieve, update, or delete a specific guideline rule |
| `GET/POST` | `/api/submissions` | Authenticated | List submission queue or submit content for compliance audit |
| `GET` | `/api/submissions/{id}` | Authenticated | Retrieve detailed compliance audit report and evidence breakdown |
| `POST` | `/api/submissions/{id}/action` | Reviewer/Owner| Approve, reject, or request changes on a submission |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup
From the repository root:

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server (runs on http://127.0.0.1:8000)
uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Vite automatically proxies `/api` calls to the FastAPI backend.

### 3. Running Automated Tests
Run the backend test suite:

```bash
python -m unittest discover -s backend -v
```

Build the production frontend bundle:

```bash
cd frontend && npm run build
```

---

## Evaluation Profiles

For rapid evaluation, the login page (`/login`) includes 1-click profiles with password `klarity`:

| Role | Profile | Email | Permissions |
|---|---|---|---|
| **Brand Owner** | Elena Vance | `judge.owner@klarity.local` | Full brand governance, settings, rules, tokens, and multi-brand switcher |
| **Reviewer** | Marcus Chen | `judge.reviewer@klarity.local` | Editorial review desk, compliance audit reports, and approval decisions |
| **Team Member** | Maya Iyer | `judge.member@klarity.local` | Creator Studio, live pre-flight checks, and draft submissions |

---

## Team

**Team Name:** localhost:5000

| Member |
|---|
| Kamegaonkar Kruthik |
| Ashwik Saxena |
| G N Sreekar |
| Maddi Abhinav |

---

## License

*Not yet decided*
