import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../lib/db.js';
import { users } from '../models/schema.js';
import { eq } from 'drizzle-orm';
import { validateBody } from '../middleware/validation.js';
import { authenticate, generateToken, generateRefreshToken } from '../middleware/auth.js';
import { asyncHandler, ConflictError, UnauthorizedError } from '../middleware/errorHandler.js';
import { registerSchema, loginSchema } from '@sleep-tracker/shared';

const router = Router();

// POST /auth/register - Register a new user
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      throw ConflictError('A user with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const now = new Date().toISOString();
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      });

    // Generate tokens
    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    res.status(201).json({
      user,
      token,
      refreshToken,
    });
  })
);

// POST /auth/login - Login user
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      throw UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    });
  })
);

// GET /auth/me - Get current user
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

// POST /auth/refresh - Refresh access token
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw UnauthorizedError('Refresh token required');
    }

    // Verify refresh token (using same verify function since structure is the same)
    const { verifyToken } = await import('../middleware/auth.js');
    const payload = verifyToken(refreshToken);

    if (!payload) {
      throw UnauthorizedError('Invalid or expired refresh token');
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      throw UnauthorizedError('User not found');
    }

    // Generate new tokens
    const newToken = generateToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id, user.email);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  })
);

// PUT /auth/profile - Update user profile
router.put(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Get current user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw UnauthorizedError('User not found');
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        throw UnauthorizedError('Current password required to change password');
      }
      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        throw UnauthorizedError('Current password is incorrect');
      }
    }

    // Build update object
    const updates: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (newPassword) {
      updates.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      });

    res.json({ user: updatedUser });
  })
);

// DELETE /auth/account - Delete user account
router.delete(
  '/account',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // Delete user (cascade will handle related data)
    await db.delete(users).where(eq(users.id, userId));

    res.json({ message: 'Account deleted successfully' });
  })
);

export default router;
