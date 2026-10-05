# High-Accuracy Kerala State Lottery Result Verification System

Production-grade, mobile-first Progressive Web App (PWA) for checking Kerala State Lottery tickets against official, published Directorate of Kerala State Lotteries gazette documents.

This system deals with financially valuable lottery outcomes. **Accuracy is the highest priority.** The application treats the official published result document as the sole source of truth and enforces strict cryptographic and draw-specific rules.

---

## 1. Core Principles

```
OFFICIAL RESULT
       ↓
SOURCE PDF/TXT
       ↓
IMPORT & HASHING (SHA-256)
       ↓
EXTRACTION & STRUCTURE DETECTION
       ↓
VALIDATION & HUMAN APPROVAL
       ↓
PUBLISHED DRAW (RLS Protected)
       ↓
USER TICKET CHECK
       ↓
EXACT DRAW-SPECIFIC MATCH
       ↓
AUDITED RESULT & ORIGINAL PDF
```

### Non-Negotiable System Guardrails
- **Never Guess:** Zero AI inference, zero digit interpolation, zero fuzzy guessing.
- **Draw-Specific Enforcement:** Every ticket check requires a specific draw. Never checks blindly across different dates or lotteries.
- **Dynamic Rules:** Weekly lotteries (e.g. 4-digit lower tiers) and Bumper lotteries (e.g. 5-digit rules, series-count differences) have their rules loaded dynamically from the draw/scheme configuration.
- **Source Provenance:** Every winning result displays its source document name, SHA-256 cryptographic hash, and links to the unaltered original PDF.
- **Strict RLS Security:** Public users have **SELECT ONLY** on `PUBLISHED` draws. Zero public write permissions.

---

## 2. Technology Stack

- **Framework:** Next.js (App Router, Turbopack) & React 19
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS with custom glassmorphism and Kerala emerald & gold palette
- **Database:** Supabase / PostgreSQL with complete Row Level Security (RLS) policies
- **PWA:** Service worker (`/sw.js`), Web App Manifest (`/manifest.json`), offline guardrails
- **Audio & Voice:** Pure Web Audio API synthesized celebration chime + Web Speech API (English & മലയാളം)
- **Testing:** Native Node.js Test Runner (`tsx --test`) covering 24 strict test cases

---

## 3. Database Architecture (Supabase SQL)

Full schema and migration available in [`supabase/migrations/20261001000000_init_lottery_schema.sql`](file:///Users/adarsh/KERALA%20LOTTRY%20RESULT%20/supabase/migrations/20261001000000_init_lottery_schema.sql).

### Key Tables
- `lotteries`: Master list of weekly and bumper lottery schemes (Karunya Plus, Win-Win, Thiruvonam Bumper, etc.).
- `lottery_scheme_versions`: Versioned prize rules, ticket prices, series codes, and gazette references.
- `source_files`: Uploaded PDF/TXT source files with mandatory unique SHA-256 hash.
- `draws`: Draw number, date, time, venue, status (`DRAFT`, `PROCESSING`, `NEEDS_VERIFICATION`, `VERIFIED`, `PUBLISHED`, `ARCHIVED`, `REJECTED`), and confidence score.
- `prize_categories`: Tier-specific rules (`EXACT_FULL_TICKET`, `EXACT_NUMBER_PER_SERIES`, `CONSOLATION`, `LAST_N_DIGITS`).
- `winning_entries`: Granular winning ticket entries with series, number, suffix, and source line numbers.
- `result_audit_log`: Audit trail for imports, approvals, corrections, and publications.

### Performance Indexes
```sql
CREATE INDEX idx_winning_draw_number ON winning_entries(draw_id, ticket_number);
CREATE INDEX idx_winning_draw_series_number ON winning_entries(draw_id, series, ticket_number);
CREATE INDEX idx_winning_suffix ON winning_entries(draw_id, matched_suffix);
CREATE INDEX idx_draw_date ON draws(draw_date);
CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_source_files_sha256 ON source_files(sha256);
```

---

## 4. Verification Matching Engine

Located at [`src/lib/engine/matcher.ts`](file:///Users/adarsh/KERALA%20LOTTRY%20RESULT%20/src/lib/engine/matcher.ts):
1. **Safety Gate:** Confirms `draw.status === 'PUBLISHED'`.
2. **Ticket Normalization:** Validates 6-digit number constraint and series format without silently changing digits.
3. **Exact Full Ticket:** Requires both series and 6 digits to match.
4. **One-Prize-Per-Series:** Matches exact winning number for each individual series.
5. **Consolation Prize:** Matches 1st prize digits for non-winning series in the draw.
6. **Last N Digits:** Dynamically slices `match_digits` (e.g. 4 for weeklies, 5 for bumpers) and matches suffix.
7. **Priority Resolution:** Sorts by official prize tier priority and highest amount. Never combines prizes arbitrarily.

---

## 5. Quick Start & Setup

### 1. Clone & Install
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Automated Tests
```bash
npm test
```
All 24 test suites test exact prizes, consolations, bumper last-5 digits, barcode payloads, and duplicate detection.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Daily Result Ingestion Workflow (Zero Code Changes)

To publish a new draw every day without editing application code:
1. Navigate to `/admin`.
2. Authenticate using `ADMIN_SECRET_KEY` (configured in `.env.local`).
3. Upload the official Kerala State Lotteries result PDF or paste the LOTIS gazette text.
4. The system calculates the SHA-256 hash (rejecting duplicates) and parses:
   - Lottery Name & Draw Number
   - Draw Date & Venue
   - Prize Categories & Amounts
   - Winning tickets and series list
   - Consolation tickets
   - Last 4/5 digit suffix rules
5. Review the **Admin Validation Screen** (Confidence score, duplicates count, warnings).
6. Click **APPROVE & PUBLISH**. The draw immediately becomes accessible to public users.

---

## 7. API Endpoints

- `GET /api/lotteries`: Active lottery list.
- `GET /api/results`: List of published draws (filterable by `lotteryId` and `date`).
- `GET /api/results/[id]`: Full draw details, prize categories, and winning entries.
- `GET /api/results/today`: Today's published draw or notification.
- `GET /api/check-ticket?drawId=...&series=...&number=...`: Rate-limited draw-specific ticket checker.
- `POST /api/admin/import`: Secure result ingestion endpoint (`x-admin-key` header required).
- `POST /api/admin/publish`: Admin publication endpoint (`x-admin-key` header required).
