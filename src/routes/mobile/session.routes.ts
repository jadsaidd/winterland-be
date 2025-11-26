import { Router } from 'express';

import { SessionController } from '../../controllers/mobile/session.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createSessionSchema } from '../../schemas/session.schema';

const router = Router();
const sessionController = new SessionController();

router.post(
    '/',
    authMiddleware,
    validate(createSessionSchema),
    sessionController.createSession
);

export default router;