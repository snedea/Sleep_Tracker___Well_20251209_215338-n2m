import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { asyncHandler, NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import { diaryService } from '../services/diaryService.js';
import {
  createDiaryEntrySchema,
  updateDiaryEntrySchema,
  diaryEntryQuerySchema,
} from '@sleep-tracker/shared';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/diary-entries - Get all diary entries for authenticated user
router.get(
  '/',
  validateQuery(diaryEntryQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const query = req.query as unknown as z.infer<typeof diaryEntryQuerySchema>;

    const entries = await diaryService.getByUserId(userId, query);

    res.json({ entries });
  })
);

// GET /api/diary-entries/stats - Get wellness statistics
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

    const stats = await diaryService.getStats(userId, startDate, endDate);

    if (!stats) {
      res.json({ stats: null, message: 'No diary data found for the specified date range' });
      return;
    }

    res.json({ stats });
  })
);

// GET /api/diary-entries/:id - Get a single diary entry
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw NotFoundError('Diary entry');
    }

    const entry = await diaryService.getById(id, userId);

    if (!entry) {
      throw NotFoundError('Diary entry');
    }

    res.json({ entry });
  })
);

// POST /api/diary-entries - Create a new diary entry
router.post(
  '/',
  validateBody(createDiaryEntrySchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const input = req.body;

    // Check if an entry already exists for this date
    const existing = await diaryService.getByDate(userId, input.date);
    if (existing) {
      throw ConflictError('A diary entry already exists for this date');
    }

    const entry = await diaryService.create(userId, input);

    res.status(201).json({ entry });
  })
);

// PUT /api/diary-entries/:id - Update a diary entry
router.put(
  '/:id',
  validateBody(updateDiaryEntrySchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw NotFoundError('Diary entry');
    }

    const entry = await diaryService.update(id, userId, req.body);

    if (!entry) {
      throw NotFoundError('Diary entry');
    }

    res.json({ entry });
  })
);

// DELETE /api/diary-entries/:id - Delete a diary entry
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw NotFoundError('Diary entry');
    }

    const deleted = await diaryService.delete(id, userId);

    if (!deleted) {
      throw NotFoundError('Diary entry');
    }

    res.json({ success: true });
  })
);

export default router;
