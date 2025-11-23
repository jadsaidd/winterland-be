import { Router } from 'express';

import { MobileApplicationFeatureController } from '../../controllers/mobile/application_feature.controller';

const router = Router();
const controller = new MobileApplicationFeatureController();

// Get all active application features (no pagination)
router.get(
    '/',
    controller.getActiveFeatures
);

export default router;
