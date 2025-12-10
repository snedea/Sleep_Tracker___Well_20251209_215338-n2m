import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import { asyncHandler, BadRequestError } from '../middleware/errorHandler.js';
import { insightService } from '../services/insightService.js';
import { insightQuerySchema } from '@sleep-tracker/shared';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/insights - Get insights for authenticated user
router.get(
  '/',
  validateQuery(insightQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const query = req.query as z.infer<typeof insightQuerySchema>;

    const response = await insightService.getInsightsResponse(userId, query);

    res.json(response);
  })
);

// POST /api/insights/generate - Manually trigger insight generation
router.post(
  '/generate',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // Check rate limiting
    const canGenerate = await insightService.canGenerateInsights(userId);
    if (!canGenerate) {
      throw BadRequestError('Please wait before generating new insights. You can generate new insights once per hour.');
    }

    // Generate insights
    const insightCount = await insightService.generateForUser(userId);

    if (insightCount === 0) {
      res.json({
        success: true,
        insightCount: 0,
        message: 'Not enough data to generate insights. Please log at least 3 days of sleep data.',
      });
      return;
    }

    res.json({
      success: true,
      insightCount,
      message: `Successfully generated ${insightCount} insight${insightCount !== 1 ? 's' : ''}`,
    });
  })
);

// GET /api/insights/status - Check insight generation status
router.get(
  '/status',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const canGenerate = await insightService.canGenerateInsights(userId);
    const lastGenerated = await insightService.getLastGeneratedAt(userId);

    let nextAvailable: string | null = null;
    if (lastGenerated && !canGenerate) {
      const cooldownMs = parseInt(process.env.INSIGHT_REFRESH_COOLDOWN_MS || '3600000');
      const lastTime = new Date(lastGenerated);
      nextAvailable = new Date(lastTime.getTime() + cooldownMs).toISOString();
    }

    res.json({
      canGenerate,
      lastGenerated,
      nextAvailable,
    });
  })
);

export default router;
