# Klarity

> *Every piece of content. One clear brand identity.*

<p align="left">
  <a href="https://python.org"><img src="https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white" alt="Python 3.12" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black" alt="React 18" /></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="https://sqlite.org"><img src="https://img.shields.io/badge/SQLite-Local-003B57?style=flat&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="https://render.com"><img src="https://img.shields.io/badge/Render-Deployed-46E3B7?style=flat&logo=render&logoColor=white" alt="Render" /></a>
  <a href="https://github.com/Eventspotter/Klarity"><img src="https://img.shields.io/badge/Tests-11%20Passed-brightgreen?style=flat&logo=pytest&logoColor=white" alt="Tests" /></a>
  <a href="https://github.com/Eventspotter/Klarity"><img src="https://img.shields.io/badge/Security-BotShield%20%2B%20PBKDF2-blueviolet?style=flat&logo=auth0&logoColor=white" alt="Security" /></a>
</p>

**Klarity** is an AI-powered brand consistency and governance platform that ensures organizational content stays on-brand, accurate, and compliant across all channels before publication.

---

## 🔍The Problem

Modern organizations publish content across distributed teams, external agencies, and AI generators. Without centralized governance, messaging diverges, visual standards slip, and unverified claims create brand and compliance risks.

| S.No | Challenge | Impact |
|---|---|---|
| 1 | **Inconsistent Messaging** | Fragmented voice, tone, and terminology across marketing channels |
| 2 | **Factual Inaccuracies** | Outdated product details, unverified claims, and compliance exposure |
| 3 | **Visual Non-Compliance** | Incorrect color palettes, typography, and logo usage |
| 4 | **Fragmented Review Loops** | Disjointed feedback across chat apps and email with no audit trail |
| 5 | **Governance Blind Spots** | No visibility into recurring errors or gaps in brand documentation |

---

## 💡The Solution

Klarity acts as an intelligent brand control center. Content is validated in real time against approved guidelines, verified facts, and design tokens. Rather than just rejecting drafts, Klarity flags specific deviations, links to supporting guidelines, and provides contextual corrections that preserve the author's intent.

### Core Workflow

1. **Knowledge Ingestion** — Centralize brand guidelines, tone rules, approved terminology, verified facts, and design tokens.
2. **Pre-flight & Audit** — Analyze drafts using heuristic rules and AI validation to detect tone drift, prohibited terms, and factual mismatches.
3. **Actionable Feedback** — Generate an evidence-backed audit report with a compliance score (0–100), severity breakdown, and suggested fixes.
4. **Structured Governance** — Route submissions through an editorial review lifecycle with role-specific approval authority.

---

## ✨Key Differentiators

- **Evidence-Based Validation** — Every flagged issue cites a specific approved guideline or authoritative source.
- **Context-Aware Corrections** — Targeted suggestions resolve specific issues rather than generic content rewriting.
- **Unified Brand Intelligence** — Single source of truth for guidelines, factual constraints, and reusable assets.
- **Human-in-the-Loop Governance** — Final review and sign-off authority remains strictly with authorized personnel.
- **Continuous Brand Health Insights** — Pinpoints recurring mistakes and areas where brand documentation requires clarification.

---

## 🚀Implemented Features

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

## ⚙️Tech Stack

| Layer | Stack | Details |
|---|---|---|
| **Frontend Framework** | [![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev) [![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev) [![React Router](https://img.shields.io/badge/React_Router-v6-CA4245?style=flat&logo=react-router&logoColor=white)](https://reactrouter.com) | Modular single-page application built with custom hooks and context state |
| **Styling & Motion** | [![CSS3](https://img.shields.io/badge/CSS3-Design_Tokens-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS) [![Motion](https://img.shields.io/badge/Motion-Framer-0055FF?style=flat&logo=framer&logoColor=white)](https://motion.dev) [![GSAP](https://img.shields.io/badge/GSAP-3.15-88CE02?style=flat&logo=greensock&logoColor=white)](https://greensock.com) | System design variables, responsive fluid layouts, and micro-interactions |
| **UI Components** | [![Lucide](https://img.shields.io/badge/Lucide-Icons-F56565?style=flat&logo=feather&logoColor=white)](https://lucide.dev) [![React Day Picker](https://img.shields.io/badge/React_Day_Picker-v10-blue?style=flat)](https://daypicker.dev) | Accessible iconography and custom calendar date selection |
| **Backend & API** | [![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://python.org) [![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com) [![Pydantic](https://img.shields.io/badge/Pydantic-v2-E92063?style=flat&logo=pydantic&logoColor=white)](https://docs.pydantic.dev) [![Uvicorn](https://img.shields.io/badge/Uvicorn-ASGI-499848?style=flat&logo=python&logoColor=white)](https://www.uvicorn.org) | Asynchronous REST API with Pydantic v2 schemas and request validation |
| **Database & ORM** | [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org) [![SQLite](https://img.shields.io/badge/SQLite-Local-003B57?style=flat&logo=sqlite&logoColor=white)](https://sqlite.org) [![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org) | PostgreSQL for production on Render; SQLite for zero-config local development |
| **Security & Auth** | [![PBKDF2](https://img.shields.io/badge/PBKDF2-SHA256-555555?style=flat&logo=lock&logoColor=white)](https://en.wikipedia.org/wiki/PBKDF2) [![Cookies](https://img.shields.io/badge/Cookies-HTTP--Only-blue?style=flat&logo=cookie&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) [![BotShield](https://img.shields.io/badge/BotShield-Active-success?style=flat&logo=guard&logoColor=white)](https://github.com/Eventspotter/Klarity) | Salted password hashing, revocable server-side sessions, CORS, and BotShield |
| **Deployment & CI/CD** | [![Render](https://img.shields.io/badge/Render-Hosted-46E3B7?style=flat&logo=render&logoColor=white)](https://render.com) [![Webhooks](https://img.shields.io/badge/Webhooks-Continuous_Deploy-2088FF?style=flat&logo=github-actions&logoColor=white)](https://render.com) | Cloud API hosting and static frontend delivery with automated webhook CI/CD |

---

## 🏗️Architecture

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

## 🔌API Overview

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

## 🧑‍⚖️Evaluation Profiles

For rapid evaluation, the login page (`/login`) includes 1-click profiles with password `klarity`:

| Role | Profile | Email | Permissions |
|---|---|---|---|
| **Brand Owner** | Elena Vance | `judge.owner@klarity.local` | Full brand governance, settings, rules, tokens, and multi-brand switcher |
| **Reviewer** | Marcus Chen | `judge.reviewer@klarity.local` | Editorial review desk, compliance audit reports, and approval decisions |
| **Team Member** | Maya Iyer | `judge.member@klarity.local` | Creator Studio, live pre-flight checks, and draft submissions |

---

## 👥Team

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
