import { Router } from 'express';
import { NewsController } from '../controllers/news.controller';

const router = Router();

router.get('/', NewsController.getCategories);

export default router;
