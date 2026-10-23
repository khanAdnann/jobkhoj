# JobKhoj: Configurable Ollama AI Integration Architecture & Guide

This document explains the architecture, security boundaries, local setup, and production deployment for the **JobKhoj AI Career Assistant** running with a local or self-hosted Ollama model.

---

## 1. System Architecture Overview

```text
[ JobKhoj React SPA (Vite + Tailwind) ]
               │
               │ HTTP / JSON (CORS, sliding-window rate limited)
               ▼
   [ JobKhoj Node.js Backend API (:8080) ]
   ├── Middleware: Security Headers, Rate Limiter, Body Parser (Max 10MB)
   ├── SSRF Prevention: Whitelist checks on Ollama host
   ├── PII Redaction: Automatic masking of emails/phones
   ├── Domain Services:
   │    ├── jobSearchService  ──> Verified Job Database (Supabase / Seed)
   │    ├── resumeService     ──> Document text extraction & STAR/XYZ rewrites
   │    ├── interviewService  ──> Multi-turn mock interview session manager
   │    └── ollamaService     ──> Configurable client + graceful offline fallback
   │
   ▼ POST /api/chat & GET /api/tags
[ Ollama Instance (Default: http://localhost:11434) ]
   └── Model (e.g., llama3.1, mistral, qwen2.5)
```

### Key Architectural Principles
1. **Configurable Provider Settings:** The backend reads `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`, `OLLAMA_TEMPERATURE`, and `OLLAMA_AUTH_TOKEN` from server environment variables. No model names or endpoints are hardcoded in application source code.
2. **Zero Client Secrets:** Private server configuration and AI endpoints are strictly kept on the backend. The Vite frontend never receives Ollama administrative credentials or internal network addresses.
3. **Verified Real Job Records:** The AI assistant is forbidden from hallucinating fake job IDs, nonexistent companies, salaries, or external application links. Job matches are retrieved deterministically from verified JobKhoj database records and explained by the model.
4. **Graceful Degradation:** If Ollama is offline, reloading, or the model is still being pulled, the system gracefully activates intelligent local fallbacks, rule-based STAR analysis, and curated interview question banks. The user's workflow is never blocked.
5. **Security & SSRF Hardening:** The backend strictly whitelists allowable Ollama hostnames (`localhost`, `127.0.0.1`, `host.docker.internal`, or explicitly configured hosts via `OLLAMA_ALLOWED_HOSTS`). User-supplied URLs are never fetched by the backend.

---

## 2. API Reference

All AI endpoints live under `/api/ai/*`:

| Method | Endpoint | Description | Key Request Fields |
|---|---|---|---|
| `GET` | `/api/ai/health` | Provider connectivity, model readiness & latency | None |
| `GET` | `/api/ai/models` | Lists models installed in the Ollama instance | None |
| `POST` | `/api/ai/chat` | Conversational career assistant & job search | `messages`, `message`, `userSkills` |
| `POST` | `/api/ai/resume/analyze` | Resume parsing, skill detection & XYZ rewrites | `text` or `fileBase64`, `fileType`, `targetJob` |
| `POST` | `/api/ai/jobs/match` | Deterministic + AI match against real jobs | `skills`, `yearsOfExperience`, `location` |
| `POST` | `/api/ai/interview/start` | Initiates 1-on-1 technical mock interview | `role`, `level`, `topic` |
| `POST` | `/api/ai/interview/answer` | Evaluates answer, gives feedback & next question | `sessionId`, `answer` |
| `POST` | `/api/ai/cover-letter` | Drafts tailored letter without hallucinated history | `candidateName`, `skills`, `jobTitle`, `companyName` |

---

## 3. Local Development Setup

### Step 1: Install Ollama
Download and install Ollama from [ollama.com](https://ollama.com/download):
- **macOS / Linux:** `curl -fsSL https://ollama.com/install.sh | sh`
- **Windows:** Download and run `OllamaSetup.exe`.

### Step 2: Pull a Compatible Model
Open your terminal and pull your preferred model (e.g., `llama3.1`, `mistral`, or `qwen2.5:7b`):
```bash
ollama pull llama3.1
```

### Step 3: Start Ollama Server
Verify the Ollama daemon is running:
```bash
ollama serve
```
*(By default, Ollama listens on `http://localhost:11434`)*

### Step 4: Configure Backend Environment Variables
In your JobKhoj root `.env` file, configure the Ollama settings:
```dotenv
# Server Port
PORT=8080

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
OLLAMA_TIMEOUT_MS=120000
OLLAMA_TEMPERATURE=0.7

# Optional: Bearer token if connecting to a secured remote Ollama server
# OLLAMA_AUTH_TOKEN=your-token-here
```

### Step 5: Start the Application

1. **Start the Backend Server:**
   ```bash
   npm run server
   ```
   *Logs will display the listening port, configured Ollama URL, and confirmation of model availability.*

2. **Start the Vite Frontend:**
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser. The floating JobKhoj AI assistant will appear in the lower-right corner.*

### Step 6: Verify Health & Chat Endpoints

Test backend health with curl or PowerShell:
```bash
curl http://localhost:8080/api/ai/health
```
Expected response:
```json
{
  "status": "ok",
  "provider": "ollama",
  "configuredModel": "llama3.1",
  "modelAvailable": true,
  "availableModels": ["llama3.1:latest"],
  "baseUrl": "http://localhost:11434",
  "latencyMs": 14
}
```

---

## 4. Production Deployment Architectures

Because JobKhoj frontend is deployed on Vercel as a static SPA, **`localhost:11434` on a developer's laptop is not accessible from Vercel's edge network**.

Choose one of the following production architectures:

### Option A: Self-Hosted Backend + Ollama on Private Cloud / VPC (Recommended)
- **Deployment:** Deploy the JobKhoj Node.js backend container (`server/`) to a container platform (AWS ECS, Google Cloud Run, DigitalOcean App Platform, or Render).
- **Ollama Host:** Run Ollama on a GPU-enabled VM (e.g., AWS EC2 `g4dn.xlarge` or GCP `g2-standard-4` with an NVIDIA L4/T4 GPU) inside the **same private Virtual Private Cloud (VPC)**.
- **Security:**
  - Restrict port 11434 to the backend VPC security group. Do not open port 11434 to the public internet.
  - Set `OLLAMA_BASE_URL=http://ollama-internal.vpc:11434` in the backend environment.
  - Set `CORS_ORIGINS=https://jobkhoj.vercel.app` on the backend.

### Option B: Remote Secured Ollama with Reverse Proxy & Authentication
- If Ollama is hosted on a separate managed server:
  - Place Ollama behind an Nginx or Caddy reverse proxy with TLS/HTTPS.
  - Enforce Bearer token authentication in the reverse proxy.
  - Configure the JobKhoj backend with:
    ```dotenv
    OLLAMA_BASE_URL=https://ai.yourdomain.com
    OLLAMA_AUTH_TOKEN=secret-bearer-token
    OLLAMA_ALLOWED_HOSTS=ai.yourdomain.com
    ```

### Option C: Managed OpenAI/vLLM-Compatible Provider Adapter
- The backend API endpoints (`/api/ai/*`) decouple the frontend from the model provider.
- Any server exposing the standard `/api/chat` or OpenAI-compatible format can be pointed to by updating `OLLAMA_BASE_URL`.

---

## 5. Security & Operational Hardening Checklist

1. **SSRF Prevention:** The backend checks target hostnames against `OLLAMA_ALLOWED_HOSTS`. Ordinary users can never cause the backend to fetch arbitrary intranet or internet IPs.
2. **PII Masking:** Candidate email addresses and telephone numbers are automatically redacted using regex sanitizers before being transmitted to LLM prompts.
3. **Rate Limiting:** A sliding-window in-memory limiter restricts clients to 60 requests/minute per IP (configurable via `RATE_LIMIT_MAX_REQUESTS`), returning HTTP 429 when exceeded.
4. **No Hallucinated Job Records:** The `jobSearchService` strictly passes verified database IDs and company records to Ollama, forbidding the model from creating fictional job listings.
5. **No File Execution:** Uploaded resume files (PDF/DOCX) are parsed solely as text streams in memory using `mammoth` and `pdf-lib`. No executable code is run from uploaded attachments.

---

## 6. Running Automated Tests

Run the full in-memory AI backend test suite:
```bash
node server/tests/runTests.js
node server/tests/mockOllamaTest.js
```
All tests run with 100% sandboxed execution, verifying:
- Health and model availability checks
- Rate limiter blocking (HTTP 429)
- Empty prompt & invalid payload rejections (HTTP 400)
- Real database job matching
- Document parsing and PII redaction
- Isolated multi-turn mock interview sessions
- Non-hallucinated cover letter drafting

