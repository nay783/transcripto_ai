# Transcripto AI — Full-Stack AI Transcription & Synthesis SaaS

**Every word matters.**

Transcripto AI is a full-stack Next.js (App Router + TypeScript) SaaS application that converts spoken audio recordings (**MP3**, **M4A**, **WAV**) into accurate transcripts, executive AI summaries, and actionable insights. It integrates through secure server-side route handlers with an **n8n** workflow backend orchestrating **AssemblyAI** speech recognition, **OpenAI** synthesis, and **Supabase** job storage.

---

## 1. Architecture & Security Design

- **Frontend Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, shadcn/ui-based accessible primitives (Radix UI), Lucide React icons, and `Space Grotesk` typography.
- **Colour Palette:**
  - Main background: `#090C0A`
  - Secondary background: `#111812`
  - Elevated surfaces: `#172019`
  - Accent green: `#B8FF65`
  - Main text: `#F5F8F4`
  - Muted text: `#A6B4A7`
  - Borders: `#273329`
- **Zero-Knowledge Browser Security:**
  - All n8n webhook secrets (`X-Webhook-Secret`) and Supabase credentials remain strictly on the server (`src/lib/env.ts`).
  - No `NEXT_PUBLIC_` secret variables are used.
  - Job authorization tokens (`access_token`) returned by the submission webhook are bound to an HMAC-SHA256 signed `HttpOnly`, `SameSite=Lax` cookie (`transcripto_job_session`) scoped to `/api/transcriptions` and never placed in URLs, query parameters, or browser persistent storage.
- **Abuse & Upload Protection:**
  - Dual-layer audio validation: file extension, MIME type, size limit (`MAX_AUDIO_UPLOAD_MB`), and binary magic-byte header verification (`RIFF/WAVE`, `ftyp`, `ID3`/MPEG sync) to reject disguised executables.
  - Sliding-window rate limiting on both `POST /api/transcriptions` and `GET /api/transcriptions/[jobId]`.
- **Browser-Side Document Export:**
  - Native client-side generation for **TXT**, **DOCX** (`docx`), and paginated **PDF** (`jspdf`) documents using the latest user-edited transcript.

---

## 2. Environment Configuration

Copy `.env.example` to `.env` (or `.env.local`) in the project root and populate the server-only values:

```bash
cp .env.example .env
```

### Required Environment Variables

| Variable | Description |
| :--- | :--- |
| `N8N_SUBMIT_WEBHOOK_URL` | `POST` webhook URL for submitting audio (`https://n8n.ncai.club/webhook/transcripto-submit`) |
| `N8N_RESULT_WEBHOOK_URL` | Exact `GET` webhook URL configured on your n8n instance for polling transcription results |
| `N8N_WEBHOOK_SECRET` | Server-side secret sent in the `X-Webhook-Secret` header |

### Optional / Supabase Server Variables

| Variable | Description |
| :--- | :--- |
| `SUPABASE_URL` | Supabase project URL for server-side `transcription_jobs` verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key (never exposed to client) |
| `SUPABASE_ANON_KEY` | Optional scoped key |
| `MAX_AUDIO_UPLOAD_MB` | Upload size limit in MB (default: `50`) |
| `SESSION_COOKIE_SECRET` | HMAC secret for signing the `HttpOnly` job session cookie |

---

## 3. Local Development & Verification

### Install Dependencies

```bash
npm install
```

### Run TypeScript Check & Unit Tests

```bash
npm run typecheck
npm test
```

### Build for Production

```bash
npm run build
```

### Start Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page and embedded workspace, or [http://localhost:3000/workspace](http://localhost:3000/workspace) for the dedicated studio view.
