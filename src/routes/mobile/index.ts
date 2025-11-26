import { Router } from 'express';

import applicationFeatureRoutes from './application_feature.routes';
import authRoutes from './auth.routes';
import bookingRoutes from './booking.routes';
import cartRoutes from './cart.routes';
import categoryRoutes from './category.routes';
import countryCodeRoutes from './country-code.routes';
import eventRoutes from './event.routes';
import locationRoutes from './location.routes';
import paymentMethodRoutes from './payment-method.routes';
import sessionRoutes from './session.routes';
import transactionRoutes from './transaction.routes';
import userRoutes from './user.routes';
import walletRoutes from './wallet.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/country-codes', countryCodeRoutes);
router.use('/user', userRoutes);
router.use('/application-features', applicationFeatureRoutes);
router.use('/categories', categoryRoutes);
router.use('/locations', locationRoutes);
router.use('/events', eventRoutes);
router.use('/payment-methods', paymentMethodRoutes);
router.use('/cart', cartRoutes);
router.use('/wallet', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/bookings', bookingRoutes);
router.use('/sessions', sessionRoutes);

export default router;