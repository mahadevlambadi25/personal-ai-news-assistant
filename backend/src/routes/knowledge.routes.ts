import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledge.controller';

const router = Router();

router.get('/', KnowledgeController.getKnowledge);

export default router;
