import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Allows both guest querying and authenticated querying
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateToken(req, res, () => ChatController.ask(req, res, next));
  }
  return ChatController.ask(req, res, next);
});

router.get('/conversations', authenticateToken, ChatController.getHistory);

export default router;
