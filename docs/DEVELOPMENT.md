# Development Guide

This guide provides detailed information for developers working on the Sleep Tracker & Wellness Diary project.

## Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** for version control
- **VSCode** (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)

### Initial Setup

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd Sleep_Tracker___Well_20251209_215338-n2m
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

3. **Initialize database:**
   ```bash
   npm run db:migrate
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

---

## Project Architecture

### Monorepo Structure

The project uses npm workspaces to manage three packages:

```
├── client/    # React frontend
├── server/    # Express backend
└── shared/    # Shared code (Zod schemas)
```

### Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | React 18 | Ecosystem maturity, hooks, concurrent features |
| Bundler | Vite | Fast HMR, excellent DX, native ESM |
| Styling | Tailwind CSS | Rapid iteration, consistent design system |
| Backend | Express | Simplicity, middleware ecosystem |
| Database | SQLite | Zero config, portable, sufficient for single-user |
| ORM | Drizzle | Type-safe, lightweight, excellent DX |
| Validation | Zod | TypeScript-first, composable schemas |
| State | TanStack Query | Caching, background sync, optimistic updates |

---

## Development Workflow

### Running the Dev Environment

```bash
# Start both client and server with hot reload
npm run dev

# Start only client (port 5173)
npm run dev:client

# Start only server (port 3001)
npm run dev:server
```

### Database Management

```bash
# Generate migration from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Open Drizzle Studio GUI
npm run db:studio -w server
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Run tests
npm run test

# Run tests with coverage
npm run test -- --coverage
```

---

## Client Development

### Directory Structure

```
client/src/
├── components/       # Reusable components
│   ├── ui/          # Primitives (Button, Input, Card)
│   ├── forms/       # Form components
│   ├── charts/      # Data visualizations
│   ├── insights/    # AI insight components
│   └── layout/      # Layout components
├── pages/           # Route components
├── hooks/           # Custom hooks (React Query wrappers)
├── lib/             # Utilities, API client, IndexedDB
└── types/           # TypeScript definitions
```

### Component Patterns

**UI Components** follow this pattern:

```tsx
// client/src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-lg font-medium transition-colors',
          // variant styles
          // size styles
          className
        )}
        {...props}
      />
    );
  }
);
```

### React Query Hooks

Custom hooks wrap React Query for type-safe data fetching:

```tsx
// client/src/hooks/useSleepLogs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SleepLog, CreateSleepLogInput } from '@/types';

export function useSleepLogs(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['sleep-logs', filters],
    queryFn: () => api.get<{ logs: SleepLog[] }>('/api/sleep-logs', { params: filters }),
  });
}

export function useCreateSleepLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSleepLogInput) =>
      api.post<{ log: SleepLog }>('/api/sleep-logs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-logs'] });
    },
  });
}
```

### Offline Support

The app uses Dexie.js for IndexedDB storage:

```tsx
// client/src/lib/db.ts
import Dexie from 'dexie';

class WellnessDB extends Dexie {
  sleepLogs!: Dexie.Table<SleepLog, number>;
  diaryEntries!: Dexie.Table<DiaryEntry, number>;
  pendingMutations!: Dexie.Table<PendingMutation, number>;

  constructor() {
    super('WellnessDB');
    this.version(1).stores({
      sleepLogs: '++id, date, syncedAt',
      diaryEntries: '++id, date, syncedAt',
      pendingMutations: '++id, type, createdAt',
    });
  }
}

export const db = new WellnessDB();
```

---

## Server Development

### Directory Structure

```
server/src/
├── routes/          # Express route handlers
├── services/        # Business logic
├── middleware/      # Auth, validation, error handling
├── models/          # Drizzle schema definitions
├── jobs/            # Scheduled tasks
└── lib/             # Database, OpenAI client setup
```

### Route Pattern

```typescript
// server/src/routes/sleepLogs.ts
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sleepService } from '../services/sleepService';
import { createSleepLogSchema } from 'shared/schemas';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const logs = await sleepService.getLogs(req.user.id, { startDate, endDate, limit });
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(createSleepLogSchema), async (req, res, next) => {
  try {
    const log = await sleepService.createLog(req.user.id, req.body);
    res.status(201).json({ log });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Service Pattern

```typescript
// server/src/services/sleepService.ts
import { db } from '../lib/db';
import { sleepLogs } from '../models/schema';
import { eq, and, between } from 'drizzle-orm';
import type { CreateSleepLogInput, SleepLog } from 'shared/schemas';

export const sleepService = {
  async getLogs(userId: number, filters: GetLogsFilters): Promise<SleepLog[]> {
    const conditions = [eq(sleepLogs.userId, userId)];

    if (filters.startDate && filters.endDate) {
      conditions.push(between(sleepLogs.date, filters.startDate, filters.endDate));
    }

    return db.select()
      .from(sleepLogs)
      .where(and(...conditions))
      .limit(filters.limit ?? 30)
      .orderBy(sleepLogs.date);
  },

  async createLog(userId: number, data: CreateSleepLogInput): Promise<SleepLog> {
    const durationMinutes = calculateDuration(data.bedtime, data.wakeTime);

    const [log] = await db.insert(sleepLogs)
      .values({ ...data, userId, durationMinutes })
      .returning();

    return log;
  },
};
```

### Middleware

**Authentication Middleware:**

```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = payload as AuthUser;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });
  }
}
```

**Validation Middleware:**

```typescript
// server/src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          details: result.error.flatten().fieldErrors,
        },
      });
    }

    req.body = result.data;
    next();
  };
}
```

---

## Shared Schemas

Zod schemas are shared between client and server for consistent validation:

```typescript
// shared/schemas/sleepLog.ts
import { z } from 'zod';

export const sleepLogSchema = z.object({
  id: z.number(),
  userId: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bedtime: z.string().datetime(),
  wakeTime: z.string().datetime(),
  durationMinutes: z.number(),
  quality: z.number().int().min(1).max(5),
  interruptions: z.number().int().min(0),
  notes: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createSleepLogSchema = sleepLogSchema.omit({
  id: true,
  userId: true,
  durationMinutes: true,
  createdAt: true,
  updatedAt: true,
});

export type SleepLog = z.infer<typeof sleepLogSchema>;
export type CreateSleepLogInput = z.infer<typeof createSleepLogSchema>;
```

---

## Testing

### Unit Tests (Vitest)

```typescript
// server/src/services/__tests__/sleepService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { sleepService } from '../sleepService';

describe('sleepService', () => {
  beforeEach(async () => {
    // Reset test database
  });

  describe('calculateDuration', () => {
    it('calculates duration correctly for same-day sleep', () => {
      const duration = sleepService.calculateDuration(
        '2024-01-15T23:00:00Z',
        '2024-01-16T07:00:00Z'
      );
      expect(duration).toBe(480); // 8 hours in minutes
    });
  });
});
```

### Integration Tests

```typescript
// server/src/routes/__tests__/sleepLogs.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';

describe('GET /api/sleep-logs', () => {
  let authToken: string;

  beforeAll(async () => {
    // Create test user and get token
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/sleep-logs');
    expect(res.status).toBe(401);
  });

  it('returns sleep logs for authenticated user', async () => {
    const res = await request(app)
      .get('/api/sleep-logs')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(Array.isArray(res.body.logs)).toBe(true);
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/sleep-logging.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sleep Logging', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('can create a new sleep log', async ({ page }) => {
    await page.goto('/sleep-log');

    // Fill form
    await page.fill('[name="date"]', '2024-01-15');
    await page.fill('[name="bedtime"]', '23:30');
    await page.fill('[name="wakeTime"]', '07:30');
    await page.click('[data-quality="4"]');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.getByText('Sleep log saved')).toBeVisible();
  });
});
```

---

## Debugging

### Server Debugging

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/server/src/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

### Client Debugging

Use React DevTools and TanStack Query DevTools (included in dev mode).

### Database Inspection

```bash
# Open Drizzle Studio
npm run db:studio -w server

# Or use SQLite CLI
sqlite3 ./data/sleep-tracker.db ".tables"
```

---

## Performance Considerations

### Client Optimization

- Use React.memo for expensive components
- Implement virtualization for long lists
- Lazy load pages with React.lazy
- Optimize images with proper sizing

### Server Optimization

- Add database indexes for common queries
- Implement response caching where appropriate
- Use connection pooling for production

### Bundle Analysis

```bash
# Analyze client bundle
npm run build:client -- --analyze
```
