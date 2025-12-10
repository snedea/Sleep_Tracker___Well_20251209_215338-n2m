# Test Report: Sleep Tracker & Wellness Diary

**Date:** 2025-12-09
**Iteration:** 2
**Status:** FAILED

---

## Test Plan

### Scope
This report covers the testing analysis for the Sleep Tracker & Wellness Diary application - a personal wellness application that tracks sleep patterns and maintains a daily wellness diary with AI-powered insights. The scope includes:
- Server-side TypeScript compilation and API functionality
- Client-side React components, hooks, and pages
- Shared schema validation
- Integration between client and server

### Components Under Test
| Component | Test Focus | Priority |
|-----------|------------|----------|
| `server/middleware/auth.ts` | JWT authentication | Critical |
| `server/routes/sleepLogs.ts` | Sleep log CRUD operations | High |
| `server/routes/diaryEntries.ts` | Diary entry CRUD operations | High |
| `server/services/aiService.ts` | OpenAI integration | Medium |
| `client/hooks/useSleepLogs.ts` | Sleep data queries/mutations | High |
| `client/hooks/useDiaryEntries.ts` | Diary data queries/mutations | High |
| `client/pages/*` | UI pages and forms | Medium |
| `shared/schemas/*` | Zod validation schemas | High |

### Test Commands
```bash
# Run all tests
npm test

# Run server tests
npm run test:server

# Run client tests
npm run test:client

# TypeScript type checking
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```

---

## Coverage Summary

| Category | Tests | Status |
|----------|-------|--------|
| Happy Path | 0 | ❌ No tests exist |
| Edge Cases | 0 | ❌ No tests exist |
| Error Paths | 0 | ❌ No tests exist |
| Integration | 0 | ❌ No tests exist |
| State Mutations | 0 | ❌ No tests exist |

**Overall:** 0/0 tests passing (0% coverage)

---

## Pre-Test Failures: TypeScript Compilation

### CRITICAL: Build Fails - TypeScript Errors

The project cannot compile due to TypeScript errors. These must be fixed before any runtime testing can occur.

**Server:** 13 TypeScript errors
**Client:** 16 TypeScript errors

---

## Failures

### Failure 1: JWT Token Generation Type Mismatch
**File:** `server/src/middleware/auth.ts:31,40`
**Category:** Build Error (Blocks All Tests)

**Error:**
```
error TS2769: No overload matches this call.
  Type 'string' is not assignable to type 'number | StringValue | undefined'.
```

**Root Cause:**
The `jwt.sign()` function expects `expiresIn` to be a number (seconds) or a specific string format from the `jsonwebtoken` types. The code passes `process.env.JWT_EXPIRES_IN || '15m'` but the environment variable returns a string type that doesn't match the expected union type.

The issue is in lines 31-35 and 40-44:
```typescript
return jwt.sign(
  { userId, email } as JwtPayload,
  JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }  // Type error here
);
```

**Suggested Fix:**
Cast the options object or use a const assertion:
```typescript
import type { SignOptions } from 'jsonwebtoken';

export function generateToken(userId: number, email: string): string {
  const options: SignOptions = { expiresIn: process.env.JWT_EXPIRES_IN || '15m' };
  return jwt.sign({ userId, email } as JwtPayload, JWT_SECRET, options);
}

export function generateRefreshToken(userId: number, email: string): string {
  const options: SignOptions = { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' };
  return jwt.sign({ userId, email } as JwtPayload, JWT_SECRET, options);
}
```

---

### Failure 2: Missing `offset` Property in Query Types
**Files:**
- `server/src/routes/sleepLogs.ts:24`
- `server/src/routes/diaryEntries.ts:24`
- `server/src/services/diaryService.ts:153`
- `client/src/hooks/useSleepLogs.ts:20,106`
- `client/src/hooks/useDiaryEntries.ts:20,106`
- `client/src/pages/Dashboard.tsx:16,21`
- `client/src/pages/History.tsx:23,24`
- `client/src/pages/SleepLog.tsx:15`
- `client/src/pages/Diary.tsx:15`
**Category:** Build Error (Blocks All Tests)

**Error:**
```
error TS2741: Property 'offset' is missing in type '{ startDate: string; limit: number; }'
but required in type '{ offset: number; limit: number; startDate?: string; endDate?: string; }'.
```

**Root Cause:**
The `SleepLogQuery` and `DiaryEntryQuery` Zod schemas use `.default(0)` for the offset field, but the inferred TypeScript type still requires the field to be explicitly provided. The Zod `.default()` only applies at parse time, not at the type level.

Schema definition in `shared/schemas/sleepLog.ts`:
```typescript
export const sleepLogQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),  // Required in type, has default at parse
});
```

**Suggested Fix:**
Option 1 - Make offset optional in the TypeScript type:
```typescript
export const sleepLogQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
```

Option 2 - Update all call sites to include `offset: 0`:
```typescript
// In useSleepLogs.ts
const defaultQuery: SleepLogQuery = {
  startDate: getDaysAgo(30),
  limit: 30,
  offset: 0,  // Add this
};
```

---

### Failure 3: Wrong Input Prop Name
**File:** `client/src/pages/Register.tsx:90`
**Category:** Build Error

**Error:**
```
error TS2322: Type '{ ... hint: string; }' is not assignable to type 'InputProps'.
Property 'hint' does not exist on type 'InputProps'.
```

**Root Cause:**
The `Input` component defines `helperText` prop, but `Register.tsx` uses `hint` prop which doesn't exist.

Line 90 in Register.tsx:
```tsx
<Input
  label="Password"
  ...
  hint="At least 8 characters"  // Wrong prop name
/>
```

Input component interface (in `client/src/components/ui/Input.tsx`):
```typescript
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;  // This is the correct prop name
}
```

**Suggested Fix:**
```tsx
// In Register.tsx, change line 90 from:
hint="At least 8 characters"
// To:
helperText="At least 8 characters"
```

---

### Failure 4: Vite ImportMeta.env Type Error
**File:** `client/src/lib/api.ts:7`
**Category:** Build Error

**Error:**
```
error TS2339: Property 'env' does not exist on type 'ImportMeta'.
```

**Root Cause:**
The TypeScript configuration for the client doesn't include Vite's type definitions for `import.meta.env`.

**Suggested Fix:**
Add Vite client types. Create or update `client/src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />
```

Or add to `client/tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

---

### Failure 5: useOfflineSync ID Type Error
**File:** `client/src/hooks/useOfflineSync.ts:102`
**Category:** Build Error

**Error:**
```
error TS2353: Object literal may only specify known properties, and 'id' does not exist
in type 'Omit<PendingMutation, "id">'.
```

**Root Cause:**
The code attempts to include an `id` property in an object that is explicitly typed to omit the `id` field.

**Suggested Fix:**
Remove the `id` property from the object literal, as it will be auto-generated by the database/store, or update the type to allow `id`.

---

### Failure 6: Unused Imports/Variables (Strict Mode Errors)
**Files:** Multiple
**Category:** Build Warning (Treated as Error with strict config)

**Errors:**
```
TS6133: 'task' is declared but its value is never read. (insightGenerator.ts:55)
TS6133: 'migrate' is declared but its value is never read. (migrate.ts:1)
TS6133: 'db' is declared but its value is never read. (migrate.ts:2)
TS6133: 'schema' is declared but its value is never read. (migrate.ts:3)
TS6133: 'res' is declared but its value is never read. (auth.ts:106, errorHandler.ts:85)
TS6133: 'next' is declared but its value is never read. (errorHandler.ts:51)
TS6133: 'openai' is declared but its value is never read. (aiService.ts:1)
TS6196: 'InsightType' is declared but never used. (insightService.ts:5)
TS6196: 'DiaryEntry' is declared but never used. (useDiaryEntries.ts:5)
TS6196: 'SleepLog' is declared but never used. (useSleepLogs.ts:5)
```

**Root Cause:**
Multiple files have unused imports or variables that strict TypeScript configuration flags as errors.

**Suggested Fix:**
Remove unused imports or prefix with underscore:
```typescript
// Instead of:
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
// Use (if needed for side effects):
import { migrate as _migrate } from 'drizzle-orm/better-sqlite3/migrator';
// Or remove entirely if not needed
```

For unused function parameters, use underscore prefix:
```typescript
// Instead of:
export function optionalAuth(req: Request, res: Response, next: NextFunction)
// Use:
export function optionalAuth(req: Request, _res: Response, next: NextFunction)
```

---

### Failure 7: ParsedQs Type Conversion Warning
**Files:** `server/src/routes/sleepLogs.ts:24`, `server/src/routes/diaryEntries.ts:24`
**Category:** Build Error

**Error:**
```
error TS2352: Conversion of type 'ParsedQs' to type '{ offset: number; limit: number; ... }'
may be a mistake because neither type sufficiently overlaps with the other.
```

**Root Cause:**
Express's `req.query` is typed as `ParsedQs`, which doesn't directly overlap with the Zod-validated query schema types.

**Suggested Fix:**
Use double assertion through `unknown`:
```typescript
const query = req.query as unknown as SleepLogQuery;
```

---

## Uncovered Paths

### Missing Test Files
The project has **ZERO test files**. The architecture spec defined the following tests that should exist but don't:

| Expected Test File | Purpose | Risk |
|--------------------|---------|------|
| `server/src/services/sleepService.test.ts` | Duration calculation, validation | High |
| `server/src/services/insightService.test.ts` | Insight type selection, data aggregation | High |
| `server/src/services/aiService.test.ts` | Prompt formatting, response parsing (mock OpenAI) | Medium |
| `server/src/middleware/auth.test.ts` | JWT verification, user extraction | Critical |
| `server/src/middleware/validation.test.ts` | Zod schema enforcement | High |
| `client/src/hooks/useSleepLogs.test.ts` | Query/mutation behavior | High |
| `client/src/hooks/useAuth.test.ts` | Token management | High |
| `client/src/lib/utils.test.ts` | Date formatting, calculations | Medium |

### Coverage Gaps by Category

#### Happy Path (Not Covered)
- User registration with valid credentials
- User login with valid credentials
- Sleep log CRUD operations with valid data
- Diary entry CRUD operations with valid data
- Insight generation with sufficient data (7+ days)
- Charts rendering with valid sleep/diary data

#### Edge Cases (Not Covered)
- Empty email/password during registration
- Password at exactly 8 characters (boundary)
- Invalid date formats (not YYYY-MM-DD)
- Sleep quality at boundaries (1 and 5)
- Wake time exactly at bedtime
- Maximum interruptions (20)
- Unicode/emoji characters in journal text
- Notes at exactly 1000 characters

#### Error Paths (Not Covered)
- Database connection failures
- OpenAI API unavailable/timeout
- Invalid JWT token handling
- Expired JWT token handling
- Network timeout during offline sync
- Duplicate user registration attempt
- Rate limiting behavior (100 req/15min)
- Malformed JSON in request body

#### Integration Boundaries (Not Covered)
- Client → Server API contract validation
- Auth token flow across all protected routes
- Zod schema consistency between client/server
- React Query cache invalidation on mutations
- Offline sync → Server reconciliation

#### State Mutations (Not Covered)
- Concurrent sleep log creation for same date (should fail with conflict)
- Race conditions in insight generation
- Offline mutation queue ordering
- Token refresh during active API request
- Optimistic updates rollback on failure

---

## Chaos Scenarios (Proposed)

| Scenario | Expected Behavior | Priority |
|----------|-------------------|----------|
| Database dies mid-transaction | Rollback, return 500, no partial state | High |
| OpenAI returns 503 | Graceful degradation, show stale insights or message | Medium |
| JWT secret rotation | Existing tokens invalidated, force re-login | High |
| Client goes offline during form submit | Queue mutation locally, sync on reconnect | Medium |
| Two browser tabs create sleep log for same date | Second request fails with 409 Conflict | Medium |
| Server restart during insight generation job | Job resumes or skips user on next run | Low |

---

## Adversarial Analysis

### Security Concerns

1. **JWT Secret Fallback**: `server/src/middleware/auth.ts:27`:
   ```typescript
   const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
   ```
   **Risk:** If `JWT_SECRET` is not set, all tokens use a predictable hardcoded secret.
   **Recommendation:** Fail startup if `JWT_SECRET` is missing in production.

2. **No Rate Limiting on Auth Routes**: While general rate limiting exists, auth endpoints may need stricter limits.
   **Risk:** Brute force password attacks.
   **Recommendation:** Add specific rate limiting for `/auth/login` (e.g., 5 attempts/minute).

3. **No Input Sanitization for User Content**: The `notes` and `journalText` fields are only length-validated.
   **Risk:** Stored XSS if rendered without escaping.
   **Recommendation:** Sanitize HTML/scripts or ensure React escapes all user content.

---

## Recommendations

### Immediate (Block Release)
- [ ] **Fix TypeScript Errors (29 total)**:
  - [ ] Fix JWT `expiresIn` type casting in `auth.ts`
  - [ ] Add `offset` property to all query calls OR make it optional in schema
  - [ ] Change `hint` to `helperText` in `Register.tsx`
  - [ ] Add Vite types to client tsconfig
  - [ ] Remove unused imports/variables across all files
  - [ ] Fix `useOfflineSync.ts` id property error
  - [ ] Fix ParsedQs type conversions in routes

- [ ] **Add shared package build script**: Root `package.json` references `npm run build -w shared` but shared package has no build script

### Before Production
- [ ] Create unit tests for all services (`sleepService`, `diaryService`, `insightService`, `aiService`)
- [ ] Create middleware tests (`auth`, `validation`)
- [ ] Create hook tests (`useSleepLogs`, `useDiaryEntries`, `useAuth`)
- [ ] Create integration tests for all API routes with supertest
- [ ] Add E2E tests with Playwright for critical user journeys:
  - New user registration and first sleep log
  - Returning user login and view history
  - Complete morning routine: log sleep + diary entry
  - View insights page

### Future
- [ ] Implement chaos testing for resilience
- [ ] Add load testing to verify rate limiting and performance
- [ ] Security audit for auth bypass vulnerabilities
- [ ] Add performance benchmarks (<500ms API response, <3s page load)

---

## Conclusion

**Status:** FAILED — Project cannot compile due to 29 TypeScript errors (13 server + 16 client)

The Sleep Tracker & Wellness Diary application has critical issues preventing build and testing:

1. **TypeScript Compilation Fails**:
   - Server: 13 errors (JWT types, query params, unused imports)
   - Client: 16 errors (offset missing, wrong prop names, missing Vite types)

2. **Zero Test Coverage**:
   - No test files exist despite Vitest being configured
   - Architecture specifies comprehensive testing but none implemented

3. **Type Mismatches**:
   - Query parameter types don't match between schema definitions and usage
   - Zod `.default()` doesn't make fields optional at TypeScript level

4. **Missing Package Configuration**:
   - Shared package lacks build script referenced by root package.json

**Next Steps:**
1. Architect reviews failures and creates fix plan for TypeScript errors
2. Builder implements all TypeScript fixes
3. Builder creates test files as specified in architecture
4. Test Agent re-runs test suite after fixes are applied
