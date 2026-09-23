import { Request, Response } from 'express';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

export class WhatsAppController {
  /**
   * GET /api/whatsapp/webhook — Meta hub verification endpoint
   */
  static verifyWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    const verifiedChallenge = WhatsAppService.verifyWebhook(mode, token, challenge);

    if (verifiedChallenge) {
      res.status(200).send(verifiedChallenge);
      return;
    }

    res.status(403).json({ error: 'Verification failed' });
  }

  /**
   * POST /api/whatsapp/webhook — Inbound event receiver
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    // Acknowledge receipt to Meta immediately within 3s as required by Meta webhook SLA
    res.status(200).send('EVENT_RECEIVED');

    // Process event asynchronously
    await WhatsAppService.handleWebhookPayload(req.body);
  }
}
