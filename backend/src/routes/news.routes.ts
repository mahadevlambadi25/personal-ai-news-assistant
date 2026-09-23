import { Router } from 'express';
import { NewsController } from '../controllers/news.controller';
import { SavedNewsController } from '../controllers/saved.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', NewsController.getNews);
router.post('/refresh', NewsController.refreshNews);
router.get('/category/:category', NewsController.getNewsByCategory);
router.get('/:id', NewsController.getNewsById);

// Save / Unsave article endpoints
router.post('/:id/save', authenticateToken, SavedNewsController.save);
router.delete('/:id/save', authenticateToken, SavedNewsController.unsave);

export default router;
