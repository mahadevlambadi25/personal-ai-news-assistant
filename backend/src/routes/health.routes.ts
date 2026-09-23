import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';
import { sendSuccess } from '../utils/responseHelper';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const connected = isDatabaseConnected();
  return sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: connected ? 'connected' : 'disconnected',
  });
});

export default router;
