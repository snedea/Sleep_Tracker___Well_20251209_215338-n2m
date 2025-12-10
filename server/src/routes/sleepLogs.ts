import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { asyncHandler, NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import { sleepService } from '../services/sleepService.js';
import {
  createSleepLogSchema,
  updateSleepLogSchema,
  sleepLogQuerySchema,
} from '@sleep-tracker/shared';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/sleep-logs - Get all sleep logs for authenticated user
router.get(
  '/',
  validateQuery(sleepLogQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const query = req.query as z.infer<typeof sleepLogQuerySchema>;

    const logs = await sleepService.getByUserId(userId, query);

    res.json({ logs });
  })
);

// GET /api/sleep-logs/stats - Get sleep statistics
router.get(
  '/stats',
  validateQuery(
    z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
  ),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };

    const stats = await sleepService.getStats(userId, startDate, endDate);

    if (!stats) {
      res.json({ stats: null, message: 'No sleep data found for the specified date range' });
      return;
    }

    res.json({ stats });
  })
);

// GET /api/sleep-logs/:id - Get a single sleep log
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw NotFoundError('Sleep log');
    }

    const log = await sleepService.getById(id, userId);

    if (!log) {
      throw NotFoundError('Sleep log');
    }

    res.json({ log });
  })
);

// POST /api/sleep-logs - Create a new sleep log
router.post(
  '/',
  validateBody(createSleepLogSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const input = req.body;

    // Check if a log already exists for this date
    const existing = await sleepService.getByDate(userId, input.date);
    if (existing) {
      throw ConflictError('A sleep log already exists for this date');
    }

    const log = await sleepService.create(userId, input);

    res.status(201).json({ log });
  })
);

// PUT /api/sleep-logs/:id - Update a sleep log
router.put(
  '/:id',
  validateBody(updateSleepLogSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw NotFoundError('Sleep log');
    }

    const log = await sleepService.update(id, userId, req.body);

    if (!log) {
      throw NotFoundError('Sleep log');
    }

    res.json({ log });
  })
);

// DELETE /api/sleep-logs/:id - Delete a sleep log
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw NotFoundError('Sleep log');
    }

    const deleted = await sleepService.delete(id, userId);

    if (!deleted) {
      throw NotFoundError('Sleep log');
    }

    res.json({ success: true });
  })
);

export default router;
