import { Router } from 'express';
import { PreferencesController } from '../controllers/preferences.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', PreferencesController.get);
router.put('/', PreferencesController.update);

export default router;
