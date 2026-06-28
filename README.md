# ResumeIQ — AI Resume Screening SaaS

Full-stack SaaS for companies to screen CVs against custom hiring criteria using Claude AI.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + React Router |
| Backend | Node.js + Express (ESM) |
| Database | SQLite via better-sqlite3 |
| Auth | JWT + bcrypt |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| CV parsing | pdf-parse + multer |

## Project structure

```
resumeiq/
├── backend/
│   ├── server.js       # Express API (all routes)
│   ├── db.js           # SQLite schema + connection
│   ├── auth.js         # JWT sign/verify middleware
│   ├── .env.example    # Copy to .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx             # Router + auth guard
    │   ├── main.jsx            # Entry point
    │   ├── index.css           # Global styles / CSS vars
    │   ├── lib/api.js          # All API calls
    │   ├── hooks/useAuth.jsx   # Auth context
    │   ├── components/
    │   │   ├── Layout.jsx      # Sidebar layout
    │   │   └── UI.jsx          # Shared components
    │   └── pages/
    │       ├── Auth.jsx        # Login + Register
    │       ├── Dashboard.jsx   # Stats + recent applicants
    │       ├── Jobs.jsx        # Job postings list
    │       ├── JobDetail.jsx   # Criteria + upload + applicants
    │       └── Settings.jsx    # Account settings
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Setup

### 1. Backend

```bash
cd backend
npm install

# Create .env
cp .env.example .env
# Edit .env and set:
#   ANTHROPIC_API_KEY=sk-ant-...
#   JWT_SECRET=any-random-string

npm run dev
# API runs on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

Open http://localhost:5173 → Register an account → Create a job → Add criteria → Upload CVs.

## API endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Register new company account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Jobs
| Method | Path | Description |
|---|---|---|
| GET | /api/jobs | List all job postings |
| POST | /api/jobs | Create job posting |
| PUT | /api/jobs/:id | Update job posting |
| DELETE | /api/jobs/:id | Delete job + all applicants |

### Criteria
| Method | Path | Description |
|---|---|---|
| GET | /api/jobs/:jobId/criteria | Get criteria for job |
| POST | /api/jobs/:jobId/criteria | Add criterion |
| DELETE | /api/criteria/:id | Remove criterion |

### Applicants
| Method | Path | Description |
|---|---|---|
| GET | /api/jobs/:jobId/applicants | List applicants (filter: tier, status, search) |
| GET | /api/applicants/:id | Get applicant + full analysis |
| POST | /api/jobs/:jobId/upload | Upload CV (PDF or text) → AI analysis |
| PATCH | /api/applicants/:id/status | Update status (shortlisted/reviewed/rejected) |
| DELETE | /api/applicants/:id | Delete applicant |

### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | /api/dashboard | Stats + recent applicants |

## AI scoring logic

Each CV is sent to Claude with all criteria in this format:
```
1. [REQUIRED][Skills] 5+ years React experience
2. [PREFERRED][Experience] CI/CD knowledge
3. [BONUS][Certifications] AWS certification
```

Claude returns structured JSON:
- `score` (0–100, weighted by priority tier)
- `tier` (strong ≥75 / partial ≥50 / weak)
- `criteria_results` — pass/partial/fail + reason per criterion
- `strengths` — up to 3 key strengths
- `gaps` — up to 3 key gaps
- `summary` — hiring manager verdict

## Deployment

### Backend (Render / Railway)
- Set env vars: `ANTHROPIC_API_KEY`, `JWT_SECRET`
- Build: `npm install`
- Start: `node server.js`
- SQLite file persists at `resumeiq.db` (use a persistent disk on Render)

### Frontend (Vercel / Netlify)
- Set `VITE_API_URL` if backend isn't on same domain
- Update `vite.config.js` proxy or `api.js` BASE url
- Build: `npm run build`
- Output: `dist/`
