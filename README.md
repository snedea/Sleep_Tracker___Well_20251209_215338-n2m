# Sleep Tracker & Wellness Diary

A personal wellness application that tracks sleep patterns and maintains a daily wellness diary with AI-powered insights. Built with a mobile-first approach for seamless morning and bedtime logging.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

Sleep Tracker & Wellness Diary helps you understand your sleep patterns and their correlation with daily wellness factors. The app provides:

- **Frictionless Logging**: Quick entry forms optimized for mobile use
- **AI-Powered Insights**: Personalized recommendations based on your patterns
- **Offline Support**: Works without internet, syncs automatically when online
- **Data Visualization**: Interactive charts showing trends over time

## Features

### Core Functionality

- **Sleep Logging**: Track bedtime, wake time, sleep quality (1-5 scale), interruptions, and notes
- **Wellness Diary**: Daily entries for mood, energy levels, activities, diet, and journal thoughts
- **History View**: Browse and edit past entries with filtering options
- **Dashboard**: At-a-glance summary of recent sleep and wellness metrics

### AI Insights

Powered by OpenAI GPT-4o-mini, the app generates three types of insights:

1. **Sleep Debt Calculator**: Tracks cumulative sleep deficit vs. recommended 8 hours
2. **Consistency Score**: Measures bedtime/wake time variance (lower variance = better consistency)
3. **Activity Correlation**: Identifies patterns like "You sleep 20% better on days with exercise"

Insights are generated daily at 6 AM with on-demand refresh (rate-limited to 1 per hour).

### Technical Features

- **Offline-First Architecture**: Core functionality works without network connectivity
- **Progressive Web App**: Add to homescreen for native-like experience
- **Secure Authentication**: JWT tokens with bcrypt password hashing
- **Rate Limiting**: API protection against abuse
- **Data Export**: Export your data in CSV/JSON formats

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, TanStack Query, Recharts |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | SQLite with Drizzle ORM |
| **AI** | OpenAI GPT-4o-mini |
| **Validation** | Zod (shared schemas) |
| **Offline** | IndexedDB via Dexie.js |
| **Testing** | Vitest, Playwright |

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **OpenAI API Key**: Required for AI insights feature

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Sleep_Tracker___Well_20251209_215338-n2m
```

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for all workspaces (client, server, shared).

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=./data/sleep-tracker.db

# JWT Authentication (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI API (Required for AI insights)
OPENAI_API_KEY=your-openai-api-key

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Initialize the Database

```bash
npm run db:migrate
```

### 5. Start Development Servers

```bash
npm run dev
```

This starts both:
- **Client**: http://localhost:5173
- **Server**: http://localhost:3001

## Project Structure

```
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/       # Data visualization (Recharts)
│   │   │   ├── forms/        # Login, Sleep, Diary forms
│   │   │   ├── insights/     # AI insight display
│   │   │   ├── layout/       # Header, BottomNav, AppShell
│   │   │   └── ui/           # Reusable UI primitives
│   │   ├── hooks/            # React Query hooks
│   │   ├── lib/              # API client, IndexedDB, utilities
│   │   ├── pages/            # Route components
│   │   └── types/            # TypeScript types
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── jobs/             # Scheduled tasks (insight generation)
│   │   ├── lib/              # Database, OpenAI client
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── models/           # Drizzle schema definitions
│   │   ├── routes/           # API endpoints
│   │   └── services/         # Business logic
│   └── drizzle.config.ts
│
├── shared/                    # Shared Zod validation schemas
│   └── schemas/
│       ├── sleepLog.ts
│       ├── diaryEntry.ts
│       └── user.ts
│
├── .env.example              # Environment template
├── package.json              # Root workspace config
└── README.md
```

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register a new user |
| `/auth/login` | POST | Login and receive JWT token |
| `/auth/me` | GET | Get current authenticated user |

**Register Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Login Response:**
```json
{
  "user": { "id": 1, "email": "user@example.com", "name": "John Doe" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Sleep Logs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sleep-logs` | GET | Get sleep logs (with date filtering) |
| `/api/sleep-logs` | POST | Create a new sleep log |
| `/api/sleep-logs/:id` | PUT | Update a sleep log |
| `/api/sleep-logs/:id` | DELETE | Delete a sleep log |

**Create Sleep Log:**
```json
{
  "date": "2024-01-15",
  "bedtime": "2024-01-14T23:30:00Z",
  "wakeTime": "2024-01-15T07:30:00Z",
  "quality": 4,
  "interruptions": 1,
  "notes": "Woke up once, fell back asleep quickly"
}
```

### Diary Entries

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/diary-entries` | GET | Get diary entries (with date filtering) |
| `/api/diary-entries` | POST | Create a new diary entry |
| `/api/diary-entries/:id` | PUT | Update a diary entry |
| `/api/diary-entries/:id` | DELETE | Delete a diary entry |

**Create Diary Entry:**
```json
{
  "date": "2024-01-15",
  "mood": 4,
  "energy": 3,
  "activities": ["exercise", "meditation", "reading"],
  "dietNotes": "Healthy breakfast, skipped lunch",
  "journalText": "Productive day at work..."
}
```

### AI Insights

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insights` | GET | Get cached AI insights |
| `/api/insights/generate` | POST | Manually trigger insight generation |

**Insights Response:**
```json
{
  "insights": [
    {
      "id": 1,
      "type": "sleep_debt",
      "title": "Sleep Debt Alert",
      "content": "You've accumulated 3.5 hours of sleep debt this week...",
      "generatedAt": "2024-01-15T06:00:00Z"
    }
  ],
  "generatedAt": "2024-01-15T06:00:00Z",
  "nextUpdate": "2024-01-16T06:00:00Z"
}
```

## Available Scripts

### Root Level

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run build` | Build all packages for production |
| `npm run test` | Run tests across all packages |
| `npm run lint` | Run ESLint across all packages |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run database migrations |

### Client

| Command | Description |
|---------|-------------|
| `npm run dev -w client` | Start Vite dev server |
| `npm run build -w client` | Build for production |
| `npm run test -w client` | Run client tests |
| `npm run preview -w client` | Preview production build |

### Server

| Command | Description |
|---------|-------------|
| `npm run dev -w server` | Start server with hot reload |
| `npm run build -w server` | Compile TypeScript |
| `npm run start -w server` | Start production server |
| `npm run test -w server` | Run server tests |
| `npm run db:studio -w server` | Open Drizzle Studio GUI |

## Testing

### Run All Tests

```bash
npm run test
```

### Run Tests with Coverage

```bash
# Client tests
npm run test:run -w client -- --coverage

# Server tests
npm run test:run -w server -- --coverage
```

### Test Strategy

- **Unit Tests** (Vitest): Services, middleware, hooks, utilities
- **Integration Tests** (Vitest + Supertest): API routes
- **E2E Tests** (Playwright): Critical user journeys

## Deployment

### Production Build

```bash
npm run build
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Use a strong, unique `JWT_SECRET`
3. Configure proper `DATABASE_URL` path
4. Set `CLIENT_URL` to your production domain

### Running in Production

```bash
npm run start
```

### Recommended: Use Process Manager

```bash
# Using PM2
pm2 start npm --name "sleep-tracker" -- run start
```

## Security Considerations

- **Passwords**: Hashed with bcrypt (cost factor 12)
- **JWT**: Short-lived access tokens (15min) with refresh token rotation
- **Rate Limiting**: Configurable request limits per window
- **CORS**: Whitelisted origins only
- **Helmet**: Security headers enabled
- **Input Validation**: Zod schemas on all inputs (client + server)
- **Data Isolation**: Users can only access their own data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Use conventional commits
- Run `npm run lint` before committing
- Keep the architecture decisions documented

## Roadmap

- [ ] PWA service worker for full offline support
- [ ] Data export (CSV/JSON)
- [ ] PostgreSQL migration support
- [ ] Additional insight types
- [ ] Social features (optional sharing)
- [ ] Native mobile app wrapper (Capacitor)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenAI](https://openai.com) for the GPT-4o-mini API
- [Recharts](https://recharts.org) for beautiful charts
- [Drizzle ORM](https://orm.drizzle.team) for type-safe database access
- [TanStack Query](https://tanstack.com/query) for server state management
