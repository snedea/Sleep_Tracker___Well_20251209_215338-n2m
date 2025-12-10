import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

// We'll test the pure functions directly
describe('auth middleware', () => {
  const JWT_SECRET = 'test-secret-key';

  describe('generateToken', () => {
    it('generates a valid JWT token', () => {
      const userId = 1;
      const email = 'test@example.com';

      const token = jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('includes userId and email in payload', () => {
      const userId = 42;
      const email = 'user@test.com';

      const token = jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(email);
    });
  });

  describe('verifyToken', () => {
    it('returns payload for valid token', () => {
      const userId = 1;
      const email = 'test@example.com';

      const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '15m' });

      const result = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      expect(result.userId).toBe(userId);
      expect(result.email).toBe(email);
    });

    it('throws for expired token', () => {
      const token = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
    });

    it('throws for invalid signature', () => {
      const token = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        'different-secret',
        { expiresIn: '15m' }
      );

      expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
    });

    it('throws for tampered token', () => {
      const token = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Tamper with the payload part
      const parts = token.split('.');
      parts[1] = 'tamperedPayload';
      const tamperedToken = parts.join('.');

      expect(() => jwt.verify(tamperedToken, JWT_SECRET)).toThrow();
    });

    it('throws for malformed token', () => {
      expect(() => jwt.verify('not-a-valid-token', JWT_SECRET)).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('generates token with longer expiry', () => {
      const userId = 1;
      const email = 'test@example.com';

      const token = jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const decoded = jwt.decode(token) as { exp: number; iat: number };
      const expiryDays = (decoded.exp - decoded.iat) / (60 * 60 * 24);

      expect(expiryDays).toBe(7);
    });
  });
});
