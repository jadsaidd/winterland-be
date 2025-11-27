import { Router } from 'express';

import applicationFeatureRoutes from './application_feature.routes';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import countryCodeRoutes from './country-code.routes';
import eventRoutes from './event.routes';
import locationRoutes from './location.routes';
import paymentMethodRoutes from './payment-method.routes';
import permissionRoutes from './permission.routes';
import roleRoutes from './role.routes';
import scheduleRoutes from './schedule.routes';
import scheduleWorkerRoutes from './schedule-worker.routes';
import supportTicketRoutes from './support-ticket.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/users', userRoutes);
router.use('/country-codes', countryCodeRoutes);
router.use('/application-features', applicationFeatureRoutes);
router.use('/categories', categoryRoutes);
router.use('/locations', locationRoutes);
router.use('/events', eventRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/schedule-workers', scheduleWorkerRoutes);
router.use("/payment-methods", paymentMethodRoutes);
router.use('/support-tickets', supportTicketRoutes);

export default router;