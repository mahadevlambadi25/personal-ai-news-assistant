import { Router } from 'express';
import { SavedNewsController } from '../controllers/saved.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', SavedNewsController.getSaved);
router.get('/ids', SavedNewsController.getSavedIds);

export default router;
