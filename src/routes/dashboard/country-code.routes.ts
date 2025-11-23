import { Router } from 'express';

import { DashboardCountryCodeController } from '../../controllers/dashboard/country-code.controller';
import { MobileCountryCodeController } from '../../controllers/mobile/country-code.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { countryCodeIdParamSchema, createCountryCodeSchema, toggleActiveSchema, updateCountryCodeSchema } from '../../schemas/country-code.schema';

const router = Router();
const countryCodeController = new DashboardCountryCodeController();
const mobileCountryCodeController = new MobileCountryCodeController();

router.get(
    '/all',
    mobileCountryCodeController.getAllActiveCountryCodes
);

router.post(
    '/',
    authMiddleware,
    permissionMiddleware(['country-codes:create']),
    validate(createCountryCodeSchema),
    countryCodeController.createCountryCode
);

router.get(
    '/',
    authMiddleware,
    permissionMiddleware(['country-codes:read']),
    countryCodeController.getAllCountryCodes
);

router.get(
    '/:id',
    authMiddleware,
    permissionMiddleware(['country-codes:read']),
    validate(countryCodeIdParamSchema, 'params'),
    countryCodeController.getCountryCodeById
);

router.put(
    '/:id',
    authMiddleware,
    permissionMiddleware(['country-codes:update']),
    validate(countryCodeIdParamSchema, 'params'),
    validate(updateCountryCodeSchema),
    countryCodeController.updateCountryCode
);

router.patch(
    '/:id/toggle-active',
    authMiddleware,
    permissionMiddleware(['country-codes:update']),
    validate(countryCodeIdParamSchema, 'params'),
    validate(toggleActiveSchema),
    countryCodeController.toggleActive
);

router.delete(
    '/:id',
    authMiddleware,
    permissionMiddleware(['country-codes:delete']),
    validate(countryCodeIdParamSchema, 'params'),
    countryCodeController.deleteCountryCode
);

export default router;
