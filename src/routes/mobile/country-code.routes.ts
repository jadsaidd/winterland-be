import { Router } from 'express';

import { MobileCountryCodeController } from '../../controllers/mobile/country-code.controller';

const router = Router();
const countryCodeController = new MobileCountryCodeController();

router.get(
    '/',
    countryCodeController.getAllActiveCountryCodes
);

export default router;
