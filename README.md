# ArvyaX Journal System

AI-powered journal system for nature immersion sessions. Users write entries, get emotion analysis via LLM, and view mental wellness insights.

---

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Backend  | Node.js + Express       |
| Frontend | React                   |
| Database | SQLite (better-sqlite3) |
| LLM      | Anthropic Claude API    |

---

## Project Structure

```
arvyax-journal/
├── backend/
│   ├── routes/
│   │   └── journal.js       # All API routes
│   ├── services/
│   │   └── llmService.js    # Anthropic LLM integration + cache
│   ├── db.js                # SQLite setup
│   ├── server.js            # Express app
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.js           # Single-page React UI
    │   └── index.js
    ├── public/
    │   └── index.html
    └── package.json
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- Anthropic API key (get one at https://console.anthropic.com)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm start
```

Backend runs on **http://localhost:3001**

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on **http://localhost:3000**

---

## API Reference

### POST /api/journal
Create a journal entry.
```json
{ "userId": "123", "ambience": "forest", "text": "I felt calm today." }
```

### GET /api/journal/:userId
Get all entries for a user.

### POST /api/journal/analyze
Analyze emotion from any text.
```json
{ "text": "I felt calm today after listening to the rain." }
```
Response:
```json
{
  "emotion": "calm",
  "keywords": ["rain", "nature", "peace"],
  "summary": "User experienced relaxation during the forest session"
}
```

### GET /api/journal/insights/:userId
Get aggregated insights.
```json
{
  "totalEntries": 8,
  "topEmotion": "calm",
  "mostUsedAmbience": "forest",
  "recentKeywords": ["focus", "nature", "rain"]
}
```

### POST /api/journal/:entryId/analyze
Analyze a specific saved entry and store results.

---

## Bonus Features Implemented

- ✅ **In-memory LLM response caching** — identical texts skip the API call
- ✅ **Rate limiting** — 100 requests per 15 minutes per IP
