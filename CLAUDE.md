# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SmartBase - 小学识字学习工具

A Chinese character learning web app for elementary school students (grades 1-3), featuring textbook-based character management, learning mode, and spaced-repetition review.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+ / FastAPI / SQLAlchemy / SQLite |
| Frontend | React 19 / TypeScript / Vite 8 / TailwindCSS 4 / react-router-dom 7 |
| HTTP Client | Axios (frontend) |
| Pinyin | pypinyin (backend auto-lookup) |
| Auth | Simple password + bearer token (SHA-256 hash, in-memory token store) |

## Project Structure

```
SmartBase/
├── server/                          # Python backend (FastAPI)
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry, CORS, SPA static serving, router registration
│   │   ├── config.py                # DATABASE_URL, paths
│   │   ├── database.py              # SQLAlchemy engine, session, Base, init_db (migrations + default password)
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── volume.py            # Volume (册) - top-level textbook unit
│   │   │   ├── lesson.py            # Lesson (课) - belongs to Volume
│   │   │   ├── character.py         # Character (汉字) - belongs to Lesson, has char_type: new/mistake/mastered
│   │   │   ├── review_log.py        # ReviewLog - tracks known/unknown with consecutive counts
│   │   │   └── settings.py          # Settings key-value store (used for password)
│   │   ├── schemas/                 # Pydantic request/response models
│   │   │   ├── volume.py
│   │   │   ├── lesson.py
│   │   │   ├── character.py
│   │   │   └── review.py
│   │   ├── routers/                 # FastAPI APIRouter modules
│   │   │   ├── volumes.py           # CRUD /api/v1/volumes
│   │   │   ├── lessons.py           # CRUD /api/v1/volumes/{id}/lessons, /api/v1/lessons/{id}
│   │   │   ├── characters.py        # CRUD + batch add /api/v1/lessons/{id}/characters
│   │   │   ├── learning.py          # GET /api/v1/learning/volume/{id}
│   │   │   ├── review.py            # Spaced repetition: /api/v1/review/next, /result, /stats
│   │   │   ├── lookup.py            # POST /api/v1/lookup/character (auto pinyin + words)
│   │   │   └── auth.py              # POST /api/v1/auth/login, /verify, /change-password
│   │   └── services/                # Business logic
│   │       ├── review.py            # Weighted random spaced repetition algorithm
│   │       └── char_lookup.py       # Pinyin (pypinyin) + word lookup (online Baidu dict + offline fallback)
│   ├── data/                        # SQLite database (runtime, gitignored)
│   └── requirements.txt
├── web/                             # React frontend (Vite)
│   ├── src/
│   │   ├── main.tsx                 # React entry point
│   │   ├── App.tsx                  # BrowserRouter with routes: /, /manage, /learn/:volumeId, /review/:volumeId
│   │   ├── api/client.ts            # Axios instance with auth interceptor, all API functions
│   │   ├── types/index.ts           # TypeScript interfaces: Volume, Lesson, Character, ReviewChar, ReviewStats
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Volume selection, review modals (single volume + global)
│   │   │   ├── Manage.tsx           # Authenticated admin: volume/lesson/character CRUD with modals
│   │   │   ├── Learn.tsx            # Sequential character learning with known/unknown tracking
│   │   │   └── Review.tsx           # Spaced repetition review: smart mode + all mode
│   │   ├── components/
│   │   │   ├── Layout.tsx           # Nav bar + main content wrapper
│   │   │   ├── VolumeCard.tsx       # Volume card with study/review buttons
│   │   │   ├── VolumeLessonForm.tsx # Modal form for volume/lesson create/edit
│   │   │   ├── CharForm.tsx         # Modal form for character edit (with auto-lookup)
│   │   │   ├── BatchCharForm.tsx    # Modal for batch adding characters (up to 100)
│   │   │   └── CharacterCard.tsx    # Large character display with reveal pinyin/words buttons
│   │   └── index.css                # TailwindCSS + Google Fonts (Noto Serif SC, Noto Sans SC)
│   ├── vite.config.ts               # Proxy /api to localhost:8000, build output to server/static
│   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│   └── eslint.config.js
├── start-dev.sh                     # Dev mode: starts backend (uvicorn --reload) + frontend (vite) concurrently
├── start.sh                         # Production: builds frontend if needed, runs uvicorn serving built static
├── smartbase.service                # Systemd service file for production deployment
├── nginx.conf.example               # Nginx reverse proxy config with SSL
└── .env.example                     # Environment variable template (mostly reserved for future use)
```

## Commands

### Development (run both backend + frontend)
```bash
./start-dev.sh
# Or manually:
# Terminal 1 - Backend
cd server && source ../venv/bin/activate && uvicorn app.main:app --reload --port 8000
# Terminal 2 - Frontend
cd web && npm run dev
```

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs
- Vite proxies `/api` to `http://localhost:8000`

### Frontend
```bash
cd web
npm install          # Install dependencies
npm run dev          # Dev server (Vite, port 5173)
npm run build        # TypeScript check + Vite build → outputs to server/static/
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Backend
```bash
cd server
source ../venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Production
```bash
./start.sh           # Auto-builds frontend if server/static/ doesn't exist, then runs uvicorn
```

### Setup (first time)
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r server/requirements.txt
cd web && npm install
```

## Architecture Notes

### Data Model Hierarchy
- **Volume** (册) → **Lesson** (课) → **Character** (汉字)
- **ReviewLog** tracks each review attempt per character with `known` boolean and consecutive `known_count`/`unknown_count`
- **Settings** is a simple key-value store (currently only stores the admin password hash)

### Spaced Repetition Algorithm
Weight = W_result × W_time × W_new, where:
- New (never-reviewed) characters get a 5x boost (W_new=5)
- Unknown characters: weight grows exponentially `10 × 1.5^n` (cap 100)
- Known characters: weight decays `max(0.05, 1/1.8^n)`
- Time factor: `1 + ln(1+hours) × 0.3` (prevents forgetting)
- Selection uses weighted random sampling without replacement

### Auth System
- Single-user password auth (default: "admin", SHA-256 hashed, stored in Settings table)
- In-memory token store (tokens cleared on server restart)
- Bearer token in Authorization header, verified via axios interceptor on frontend
- Manage page (`/manage`) is password-protected; learning and review are public

### Frontend Patterns
- SPA with client-side routing (react-router-dom BrowserRouter)
- No global state management library — local component state with `useState`/`useEffect`
- API layer centralized in `src/api/client.ts` with typed functions
- Auth token stored in `localStorage` under key `smartbase_token`
- Manage page selection state persisted in `localStorage` under key `smartbase_manage_selection`
- TailwindCSS utility classes, custom fonts (Noto Serif SC for characters, Noto Sans SC for pinyin)
- Modals are inline components (not a portal/modal library)

### Backend Patterns
- FastAPI with dependency injection (`Depends(get_db)`)
- SQLAlchemy ORM with `DeclarativeBase` style
- Database auto-migration via raw ALTER TABLE in `init_db()` (simple, no Alembic)
- Pydantic v2 schemas with `from_attributes = True` for ORM serialization
- CORS allows all origins by default (configurable via `ALLOWED_ORIGINS` env var)
- Production: FastAPI serves both API and built frontend static files as SPA fallback

### Build Pipeline
- Frontend builds to `server/static/` (Vite `outDir` config)
- In production, `start.sh` checks for `server/static/` and runs `npm run build` if missing
- Single uvicorn process serves both API routes and static frontend files
- Nginx reverse proxy example provided for HTTPS deployment

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server bind host (start.sh) |
| `PORT` | `8000` | Server port (start.sh) |
| `WORKERS` | `1` | Uvicorn worker count (start.sh) |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins (comma-separated) |

## Conventions

- UI language is Chinese (Simplified) — all user-facing strings, error messages, and comments are in Chinese
- API prefix: all routes under `/api/v1/`
- API responses use Pydantic models; errors use `HTTPException` with Chinese detail messages
- Frontend uses functional components with hooks exclusively
- CSS: TailwindCSS utility classes, orange color theme (`bg-orange-500`, `text-orange-600`, etc.)
- Git commits use conventional style: `feat: description`
