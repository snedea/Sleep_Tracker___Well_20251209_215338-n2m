# Scout Report: Sleep Tracker & Wellness Diary

## What We're Building

A personal wellness application that tracks sleep patterns and maintains a daily wellness diary. The core differentiator is AI-powered insights - analyzing sleep and wellness data to surface patterns, correlations, and actionable recommendations. Users log sleep times, quality, and wellness notes; the system learns from this data to provide personalized feedback.

This is a greenfield project with no existing code. We're building from scratch.

## Requirements

- **Sleep Tracking**: Log bedtime, wake time, sleep quality (1-5 scale), interruptions
- **Wellness Diary**: Daily journal entries for mood, energy, activities, diet notes
- **Data Visualization**: Charts showing sleep trends, patterns over time
- **AI Insights**: Pattern recognition, correlations (e.g., "you sleep better on days you exercise"), personalized recommendations
- **User Authentication**: Personal data requires secure login
- **Data Persistence**: Historical data storage for trend analysis
- **Responsive UI**: Mobile-friendly for bedtime/morning logging

## Stack

- **Frontend**: React with TypeScript, Tailwind CSS for rapid styling
- **Backend**: Node.js/Express REST API
- **Database**: SQLite for simplicity (can migrate to PostgreSQL later)
- **AI/Insights**: OpenAI API for natural language insights and pattern analysis
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Auth**: JWT-based authentication

## Architecture

1. **Monorepo structure** - Single repo with `/client` and `/server` directories for simplicity
2. **RESTful API** - Standard CRUD endpoints for sleep logs and diary entries
3. **AI as a service layer** - Dedicated `/api/insights` endpoint that aggregates data and calls OpenAI
4. **Local-first approach** - App works offline, syncs when connected
5. **Progressive enhancement** - Core logging works without AI, insights are additive

## Key Features Breakdown

| Feature | Priority | Complexity |
|---------|----------|------------|
| Sleep logging form | P0 | Low |
| Diary entry form | P0 | Low |
| User auth | P0 | Medium |
| Data persistence | P0 | Low |
| Sleep charts | P1 | Medium |
| AI insights generation | P1 | High |
| Trend analysis | P1 | Medium |
| Export data | P2 | Low |

## Risks

- **AI API costs**: Mitigate with caching, rate limiting, and batch processing insights daily rather than real-time
- **Data privacy**: Sleep/wellness data is sensitive - encrypt at rest, clear data retention policy
- **Scope creep**: AI features can expand infinitely - stick to 3 core insight types initially
- **Mobile UX**: Morning logging needs to be fast and frictionless - prioritize UX testing

## Open Questions for Architect Phase

1. Should AI insights be generated on-demand or batch-processed nightly?
2. What specific insight types to implement first? (Suggestions: sleep debt, consistency score, correlation detection)
3. PWA vs native wrapper for mobile experience?

## File Structure (Proposed)

```
/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   └── middleware/
│   └── package.json
└── README.md
```

## Next Steps

1. Architect: Define API contracts, database schema, component hierarchy
2. Builder: Implement core logging functionality first (sleep + diary)
3. Test: Cover auth and data persistence thoroughly
4. Iterate: Add AI insights once core is stable
