# Personal AI News & Knowledge Assistant 📰🧠

A production-quality full-stack personal AI assistant that answers:
> *"What important things happened in the world today, and what should I know about them?"*

The system continuously fetches, normalizes, deduplicates, and classifies live real-world news across **10 comprehensive categories**, enriching every story with structured AI analysis:
- **What happened?** (Factual, simple overview)
- **Why does it matter?** (Implications and real-world significance)
- **Background** (Historical and structural context)
- **Key Facts** (Verified factual bullet points)
- **Educational Knowledge Lesson** (Core concept and beginner-friendly explanation)

The application includes an installable Progressive Web App (PWA) with responsive desktop and mobile dashboards, an interactive RAG conversational AI assistant, user bookmarking and preferences, and an integrated Meta WhatsApp Cloud API bot.

---

## 1. Project Overview

- **Objective**: Deliver daily world news in simple, accessible language with deep context and educational concepts.
- **Coverage**: Not limited to technology. Covers 10 distinct hubs:
  1. 🇮🇳 **India** (National public policy, DPI, state developments)
  2. 🌍 **World** (International summits, treaties, global affairs)
  3. 🏛️ **Politics** (Strictly neutral, non-partisan, attributed claims)
  4. 📈 **Business & Economy** (Macroeconomics, inflation, monetary policy, market trends)
  5. 🤖 **Technology & AI** (Frontier AI, semiconductors, software, security)
  6. 🚀 **Science & Space** (Astrophysics, NASA/ISRO missions, biology)
  7. 🌱 **Environment** (Climate research, clean energy transition, biodiversity)
  8. ⚠️ **Major Incidents** (Disaster management, safety advisories, emergency alerts)
  9. 🏆 **Sports** (Tournaments, championships, global athletics)
  10. 🧠 **Knowledge** (Educational primers derived from news events)
- **Political News Safety**: Strictly factual and neutral. Never gives voting instructions, never ranks politicians or political parties, and always cites sources and timestamps.

---

## 2. System Architecture

```
                          ┌─────────────────────────────────────┐
                          │       Live Real-World News          │
                          │   (RSS: BBC, The Hindu, Reuters,    │
                          │    TechCrunch + NewsAPI Provider)   │
                          └──────────────────┬──────────────────┘
                                             │
                                             ▼
                          ┌─────────────────────────────────────┐
                          │       News Ingestion Pipeline       │
                          │  • URL validation & sanitization    │
                          │  • SHA-256 Content Hashing          │
                          │  • Duplicate prevention check       │
                          │  • 10-Category Smart Classifier     │
                          │  • Freshness filtering (<14 days)   │
                          └──────────────────┬──────────────────┘
                                             │
                                             ▼
                          ┌─────────────────────────────────────┐
                          │             AI Engine               │
                          │  • Pluggable IAIService abstraction │
                          │  • OpenAI (GPT-4o-mini)             │
                          │  • LocalFallbackAIService (0-crash) │
                          │  • Neutrality & Safety Guardrails   │
                          └──────────────────┬──────────────────┘
                                             │
                                             ▼
                          ┌─────────────────────────────────────┐
                          │     MongoDB / Mongoose Datastore    │
                          │  (News, Summary, Users, SavedNews,  │
                          │   Preferences, Conversations)       │
                          └──────────────────┬──────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
        ┌─────────────────────────────┐             ┌─────────────────────────────┐
        │      Express REST API       │             │   Meta WhatsApp Cloud API   │
        │  • JWT & bcrypt Auth        │             │  • Hub Webhook Verification │
        │  • News, Categories, Search │             │  • Inbound Command Router   │
        │  • Knowledge & AI RAG Chat  │             │  • Natural Language Answers │
        │  • Helmet, CORS, Rate Limit │             │  • Structured Rich Digests  │
        └──────────────┬──────────────┘             └─────────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  React + Vite + Tailwind PWA│
        │  • Desktop Collapsible Nav  │
        │  • Mobile Bottom Navigation │
        │  • Expandable News Cards    │
        │  • Floating RAG AI Chat     │
        │  • Offline Service Worker   │
        └─────────────────────────────┘
```

---

## 3. Technologies Used

### Frontend
- **React 18** & **TypeScript** (Strict Mode)
- **Vite 6** (Blazing fast HMR and optimized asset bundling)
- **Tailwind CSS 3** (Custom responsive design, neutral color tokens, dark mode readiness)
- **React Router 6** (SPA client-side routing)
- **Lucide Icons** (Clean, consistent visual icons)
- **Service Worker & Web Manifest** (Installable PWA with offline caching strategies)

### Backend
- **Node.js** (v20+ / v24+) & **TypeScript**
- **Express.js** (Modular REST framework)
- **Mongoose 8** & **MongoDB** (With auto-fallback to `mongodb-memory-server` in development)
- **OpenAI API** (Behind pluggable `IAIService` abstraction)
- **RSS Parser** & **Axios** (Resilient multi-source feed collection)
- **JSON Web Tokens (JWT)** & **bcryptjs** (Secure authentication)
- **Helmet**, **CORS**, & **express-rate-limit** (Production-grade security headers & rate limiting)
- **Jest** & **Supertest** (Automated unit and integration testing)

---

## 4. Folder Structure

```
c:\Users\Reshma\Desktop\news mobile app\
├── backend/
│   ├── src/
│   │   ├── ai/                 # IAIService, OpenAIService, LocalFallbackAIService, ai.factory
│   │   ├── config/             # env.ts, database.ts (with zero-config in-memory fallback)
│   │   ├── controllers/        # Auth, News, Knowledge, Chat, Saved, Preferences, WhatsApp
│   │   ├── middleware/         # auth.middleware, errorHandler, rateLimit
│   │   ├── models/             # User, News, Summary, Conversation, SavedNews, Preferences
│   │   ├── news/               # INewsProvider, RSSProvider, NewsAPIProvider, news.collector, classifier
│   │   ├── routes/             # health, auth, news, categories, knowledge, chat, saved, preferences, whatsapp
│   │   ├── scripts/            # seed.ts (Development seed with [DEMO] articles & test user)
│   │   ├── services/           # auth.service, news.service, knowledge.service, chat.service, savedNews.service, preferences.service, aiNewsProcessor.service
│   │   ├── types/              # categories.ts, provider interfaces, DTOs
│   │   ├── utils/              # logger, contentHash (SHA-256), responseHelper
│   │   └── server.ts           # Express application entry & graceful shutdown
│   ├── tests/                  # 7 automated test suites (Health, Auth, Ingestion, API, AI, Chat, WhatsApp)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── public/                 # sw.js (PWA service worker), manifest.webmanifest, vite.svg
│   ├── src/
│   │   ├── components/         # NewsCard, NewsDetailModal, KnowledgeCard, CategoryPills, Sidebar, BottomNav, Header, ChatDrawer, InstallPrompt, Toast, SkeletonCard, EmptyState
│   │   ├── data/               # categoriesData.ts
│   │   ├── hooks/              # useAuth, useSavedNews, usePWAInstall
│   │   ├── layouts/            # MainLayout.tsx
│   │   ├── pages/              # DashboardPage, LatestNewsPage, CategoryPage, KnowledgePage, SavedPage, ChatPage, SettingsPage, LoginPage, RegisterPage
│   │   ├── services/           # api.ts (Axios client with token interceptors)
│   │   ├── types/              # index.ts
│   │   ├── utils/              # formatters.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── package.json                # Root orchestration scripts
├── .gitignore                  # Prevents secrets, logs, and node_modules from being committed
└── README.md                   # Master Documentation
```

---

## 5. Prerequisites

- **Node.js**: v18.0.0 or higher (v24.x tested)
- **npm**: v9.0.0 or higher
- Optional: MongoDB Atlas URI or local MongoDB server (if omitted, the development server automatically spins up an in-memory database).

---

## 6. Installation

Clone the repository and install all dependencies for both backend and frontend:

```bash
# From workspace root:
npm run install:all
```

Or install individually:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 7. Environment Variables

Create `.env` in `backend/` based on `backend/.env.example`:

```bash
# backend/.env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database (Leave blank for automatic embedded in-memory MongoDB in development)
# For production, set your Atlas connection string:
MONGODB_URI=

# Authentication
JWT_SECRET=super_secret_jwt_key_personal_news_assistant_2026_dev
JWT_EXPIRES_IN=7d

# External AI Provider (Optional: Local fallback runs if omitted)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# External News Provider (Optional: Configured RSS feeds run out of the box)
NEWS_API_KEY=

# Meta WhatsApp Cloud API (Optional: Webhook works for testing without live credentials)
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=news_assistant_verify_token_dev
WHATSAPP_API_VERSION=v20.0
```

---

## 8. Database Setup & Seed

### Zero-Configuration Local Development
If `MONGODB_URI` is left blank in development, the backend automatically launches an embedded **in-memory MongoDB instance** using `mongodb-memory-server`. No local MongoDB service or Docker container is required.

### Database Seed
To populate the database with 10 verified sample articles (one for each category), AI summaries, knowledge topics, and a demo account:

```bash
npm run seed --prefix backend
```

**Demo Account Credentials**:
- **Email**: `demo@newsexplorer.com`
- **Password**: `DemoUser2026!`

---

## 9. Running the Application

### Option A: Run Both Concurrently (Recommended)
From the workspace root:

```bash
npm run dev
```

- **Backend**: Runs on `http://localhost:5000`
- **Frontend**: Runs on `http://localhost:5173`

### Option B: Run Individually

```bash
# Terminal 1 (Backend)
cd backend
npm run dev

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

---

## 10. API Documentation

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service and database health check | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login and receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & preferences | Yes |
| `GET` | `/api/news` | Query paginated articles (`page`, `limit`, `search`, `category`, `sort`) | No |
| `GET` | `/api/news/:id` | Fetch full article details with AI summary and related news | No |
| `GET` | `/api/news/category/:category` | Fetch articles in specific category | No |
| `GET` | `/api/categories` | Get all 10 categories with active counts | No |
| `POST` | `/api/news/refresh` | Trigger news collector ingestion pipeline | No |
| `POST` | `/api/news/:id/save` | Bookmark article for current user | Yes |
| `DELETE` | `/api/news/:id/save` | Remove article from bookmarks | Yes |
| `GET` | `/api/saved` | Fetch saved articles for user | Yes |
| `GET` | `/api/saved/ids` | Fetch array of saved article IDs | Yes |
| `GET` | `/api/knowledge` | Fetch educational knowledge cards derived from news | No |
| `POST` | `/api/chat` | Conversational RAG assistant query | Optional |
| `GET` | `/api/chat/conversations` | Get past conversation history | Yes |
| `GET` | `/api/preferences` | Get user feed preferences and notifications | Yes |
| `PUT` | `/api/preferences` | Update user preferences | Yes |
| `GET` | `/api/whatsapp/webhook` | Meta Cloud API webhook verification challenge | No |
| `POST` | `/api/whatsapp/webhook` | Meta Cloud API inbound event receiver | No |

---

## 11. WhatsApp Integration Setup

1. **Meta Developer Portal**:
   - Go to [developers.facebook.com](https://developers.facebook.com) and create an app with the **WhatsApp** product.
   - Note your `Phone Number ID` and generate a `User / System User Access Token`.
2. **Configure Webhook**:
   - Webhook URL: `https://your-backend-domain.com/api/whatsapp/webhook`
   - Verify Token: Matches `WHATSAPP_VERIFY_TOKEN` in your `.env` (default: `news_assistant_verify_token_dev`).
   - Subscribe to the `messages` event field.
3. **Supported Commands**:
   - Send `today`: Returns today's formatted news digest with emojis, sections, and knowledge bite.
   - Send `india news`, `world news`, `technology`, `science`, `business`, etc.
   - Send `knowledge`: Returns an educational concept lesson.
   - Send `help`: Returns list of commands.
   - Natural language queries like *"What happened in India today?"* or *"Explain RAG"*.

---

## 12. PWA Installation

The application includes a complete Progressive Web App setup with:
- `manifest.webmanifest` defining standalone display, theme color (`#0284c7`), and icons.
- Service Worker (`sw.js`) implementing:
  - `CacheFirst` for static assets and styling bundles.
  - `NetworkFirst` for HTML navigation.
  - `StaleWhileRevalidate` for read-only news feeds.
- **Installing on Android Chrome**:
  1. Open the application in Google Chrome on your Android mobile device.
  2. Tap the **Install** button on the top banner or select **Add to Home screen** from the browser menu.
  3. The app will launch in standalone full-screen window with offline shell capabilities.

---

## 13. Testing Results

All 7 test suites covering 46 automated unit and integration tests pass cleanly:

```bash
npm test --prefix backend
```

```
Test Suites: 7 passed, 7 total
Tests:       46 passed, 46 total
Snapshots:   0 total
Time:        15.4s
```

Test Suites:
1. `health.test.ts` — Database connection manager & health checks
2. `auth.test.ts` — Registration, bcrypt hashing, JWT issuance, token expiration, profile queries
3. `newsIngestion.test.ts` — URL validation, text normalization, SHA-256 deduplication, category classifier
4. `newsApi.test.ts` — News pagination, search filters, category aggregation, detail lookups
5. `aiEngine.test.ts` — AI structured response parser, neutrality guardrails, news enrichment pipeline, knowledge API
6. `chatAndSaved.test.ts` — RAG news context retrieval, conversation history, article bookmarks, user preferences
7. `whatsapp.test.ts` — Meta webhook verification, command router, inbound payload parser

---

## 14. Deployment Guide

### Frontend Deployment (Vercel)
1. Push code to your Git repository.
2. In Vercel, import the `frontend/` directory as the root.
3. Set Framework Preset to **Vite**.
4. Set Environment Variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com` (your deployed backend URL)
5. Deploy.

### Backend Deployment (Render / Railway)
1. In Render, create a new **Web Service** pointing to the `backend/` directory.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Add Environment Variables in Render Dashboard:
   - `NODE_ENV=production`
   - `MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/personal_news` (MongoDB Atlas URI)
   - `JWT_SECRET=<secure_random_string>`
   - `CORS_ORIGIN=https://your-frontend.vercel.app`
   - `OPENAI_API_KEY=<your_openai_key>` (optional, fallback active if omitted)
   - `WHATSAPP_ACCESS_TOKEN=<your_whatsapp_token>` (optional)
   - `WHATSAPP_PHONE_NUMBER_ID=<your_whatsapp_phone_id>` (optional)
   - `WHATSAPP_VERIFY_TOKEN=<your_verify_token>`
5. Deploy.

---

## 15. Security & Best Practices

- **Helmet**: Secures HTTP response headers against cross-site scripting, clickjacking, and MIME sniffing.
- **CORS**: Strictly restricts origins in production to configured domains.
- **Rate Limiting**: Protects endpoints against brute-force and DDoS attempts using `express-rate-limit`.
- **Zero Plaintext Passwords**: Passwords hashed with `bcryptjs` using a salt work factor of 10.
- **Zero Hardcoded Secrets**: Secrets are loaded strictly via environment variables; `.env` is ignored by Git.
- **Structured Logging**: Automatic credential redaction prevents passwords, JWTs, and API tokens from leaking to logs.

---

## 16. External Credentials Status

The project is built to operate immediately out of the box. Where external paid or credentialed services are required in production:

| Integration | Status | Note |
| :--- | :--- | :--- |
| **RSS Feeds** | **ACTIVE & TESTED** | Fetches live news from public RSS feeds without any API keys |
| **MongoDB In-Memory** | **ACTIVE & TESTED** | Auto-launches for local dev & tests without external setup |
| **MongoDB Atlas** | **IMPLEMENTED — REQUIRES CREDENTIAL** | Provide `MONGODB_URI` in production `.env` |
| **OpenAI Service** | **IMPLEMENTED — REQUIRES CREDENTIAL** | Set `OPENAI_API_KEY`; LocalFallbackAIService active otherwise |
| **NewsAPI Provider** | **IMPLEMENTED — REQUIRES CREDENTIAL** | Set `NEWS_API_KEY`; RSS feeds active otherwise |
| **Meta WhatsApp Cloud API** | **IMPLEMENTED — REQUIRES CREDENTIAL** | Set `WHATSAPP_ACCESS_TOKEN` & `WHATSAPP_PHONE_NUMBER_ID`; Webhooks tested |
