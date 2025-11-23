import { Router } from 'express';

import dashboardRoutes from './dashboard';
import mobileRoutes from './mobile';
import sharedRoutes from './shared';

const router = Router();

// Shared routes (health, etc.) - accessible by all clients
router.use('/', sharedRoutes);

// Mobile app routes
router.use('/mobile', mobileRoutes);

// Dashboard routes
router.use('/dashboard', dashboardRoutes);

export default router;