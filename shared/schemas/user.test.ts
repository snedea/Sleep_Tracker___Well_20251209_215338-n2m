import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from './user';

describe('user schemas', () => {
  describe('registerSchema', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
    };

    it('accepts valid input', () => {
      const result = registerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'Pass1',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without uppercase', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without lowercase', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'PASSWORD123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without number', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'PasswordABC',
      });
      expect(result.success).toBe(false);
    });

    it('rejects name shorter than 2 characters', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        name: 'A',
      });
      expect(result.success).toBe(false);
    });

    it('rejects name longer than 100 characters', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        name: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });
  });
});
