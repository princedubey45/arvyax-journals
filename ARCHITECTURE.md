# ARCHITECTURE.md — ArvyaX Journal System

## System Overview

```
[React Frontend] ──HTTP──▶ [Express API] ──▶ [SQLite DB]
                                │
                                └──▶ [Anthropic Claude API]
```

---

## 1. How would you scale this to 100k users?

**Current state:** Single Node.js process + SQLite file (good for dev/demo).

**At 100k users:**

- **Database:** Replace SQLite with **PostgreSQL** (managed, e.g. AWS RDS or Supabase). SQLite is single-writer and not suitable for concurrent production load.
- **Backend:** Deploy multiple instances behind a **load balancer** (e.g. AWS ALB + ECS or Kubernetes). Node.js is stateless, so horizontal scaling is straightforward.
- **LLM calls:** Move emotion analysis to an **async job queue** (e.g. BullMQ + Redis). The user saves the entry instantly; analysis runs in the background and updates the record when done. This prevents slow LLM responses from blocking HTTP responses.
- **Frontend:** Serve via **CDN** (Cloudflare, Vercel, S3+CloudFront). Static assets should never hit the API server.
- **Rate limiting:** Move from in-process rate limiting to a **Redis-backed** rate limiter so limits are shared across all API instances.

---

## 2. How would you reduce LLM cost?

1. **Cache analysis results** — If two users write identical or near-identical text, reuse the result. Currently implemented as in-memory cache; at scale, use Redis with a TTL.
2. **Hash-based deduplication** — Store an MD5/SHA hash of the entry text in the DB. Before calling the LLM, check if that hash already has a result.
3. **Batch processing** — Instead of calling the LLM per entry, collect entries over a short window (e.g. 30 seconds) and send them in a single prompt requesting analysis of all entries. Reduces total API calls.
4. **Smaller model for simple inputs** — Use a cheaper/faster model (e.g. claude-haiku) for short entries (<50 words) and the full model only for longer, nuanced entries.
5. **Limit token usage** — Keep prompts short and structured. Request JSON-only output with a strict max_tokens cap (currently 300).

---

## 3. How would you cache repeated analysis?

**Current implementation:** In-memory Map in `llmService.js`. Works within a single process but resets on restart and doesn't scale across multiple instances.

**Production approach:**

```
Request ──▶ Hash text ──▶ Check Redis ──▶ (HIT) Return cached result
                                 │
                              (MISS)
                                 ▼
                          Call Anthropic API
                                 ▼
                          Store in Redis (TTL: 7 days)
                                 ▼
                          Return result
```

- Use `text.trim().toLowerCase()` → SHA-256 hash as cache key
- Store result as JSON string in Redis
- TTL of 7 days balances freshness with cost savings
- For a production DB: add a `text_hash` column to `journal_entries` and check it before calling the LLM

---

## 4. How would you protect sensitive journal data?

Journal entries are personal mental health data. Protection layers:

| Layer | Measure |
|-------|---------|
| **Transport** | HTTPS everywhere (TLS 1.2+). Never allow HTTP in production. |
| **Authentication** | Replace `userId` string with real auth — JWT tokens (e.g. via Auth0 or Supabase Auth). Every API request must carry a valid token. |
| **Authorization** | Server validates that the JWT subject matches the `userId` in the request. Users can never read each other's entries. |
| **Encryption at rest** | Enable storage-level encryption on the database (PostgreSQL supports transparent encryption; use encrypted EBS volumes on AWS). |
| **Field-level encryption** | For highest sensitivity, encrypt the `text` column in the app layer before writing to DB, and decrypt on read. Only the app (with the key) can read it — not even DB admins. |
| **Minimal data retention** | Allow users to delete their entries. Auto-delete entries older than N days if the user hasn't opted into long-term storage. |
| **LLM privacy** | Do not send raw user IDs or PII to the LLM — only the journal text. Consider on-premise or private LLM deployment for regulated environments. |
| **Audit logging** | Log all read/write access with timestamps for compliance. |

---

## Data Model

```sql
journal_entries
├── id          INTEGER PRIMARY KEY AUTOINCREMENT
├── user_id     TEXT NOT NULL          -- indexed
├── ambience    TEXT NOT NULL          -- forest | ocean | mountain
├── text        TEXT NOT NULL          -- raw journal entry
├── emotion     TEXT                   -- LLM result
├── keywords    TEXT                   -- JSON array, LLM result
├── summary     TEXT                   -- LLM result
└── created_at  DATETIME DEFAULT NOW
```
