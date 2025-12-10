import { vi, beforeEach, afterEach } from 'vitest';

// Mock the database module
vi.mock('../lib/db.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve([])),
            })),
          })),
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{}])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{}])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
    query: {
      users: {
        findFirst: vi.fn(() => Promise.resolve(null)),
      },
    },
  },
  sqlite: {},
}));

// Mock OpenAI module
vi.mock('../lib/openai.js', () => ({
  generateCompletion: vi.fn(() => Promise.resolve('Mocked AI response for testing')),
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
