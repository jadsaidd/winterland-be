import { Router } from 'express';

import { config } from '../../config';
import prisma from '../../utils/prisma.client';

const router = Router();

router.get('/health', async (_req, res) => {
    const start = Date.now();

    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            responseTimeMs: Date.now() - start,
            environment: config.NODE_ENV,
            dependencies: {
                database: 'ok',
            },
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: `Database connection error: ${(error as Error).message}`,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            responseTimeMs: Date.now() - start,
            environment: config.NODE_ENV,
            dependencies: {
                database: 'down',
            },
        });
    }
});

export default router;