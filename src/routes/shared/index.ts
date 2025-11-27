import { Router } from 'express';

import prisma from '../../utils/prisma.client';
import healthRoutes from './health.routes';
import supportTicketRoutes from './support-ticket.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/support-tickets', supportTicketRoutes);

// Returns active verifications - Used for testing purposes
router.get('/verifications', async (req, res) => {
    try {
        const { userId } = req.query;

        const verifications = await prisma.verification.findMany({
            where: {
                active: true,
                ...(userId && { userId: userId as string }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        phoneNumber: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({
            success: true,
            count: verifications.length,
            data: verifications,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error fetching verifications: ${(error as Error).message}`,
        });
    }
});

export default router;