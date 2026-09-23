import axios from 'axios';
import { env } from '../config/env';
import { Logger } from '../utils/logger';
import { WhatsAppRouter } from './whatsapp.router';

const logger = new Logger('WhatsAppService');

export class WhatsAppService {
  /**
   * Verifies incoming webhook challenge from Meta WhatsApp Cloud API.
   */
  static verifyWebhook(mode?: string, token?: string, challenge?: string): string | null {
    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      logger.info('WhatsApp webhook verified successfully.');
      return challenge || null;
    }
    logger.warn('WhatsApp webhook verification failed: Invalid verify token or mode.');
    return null;
  }

  /**
   * Processes inbound webhook event payload from Meta.
   */
  static async handleWebhookPayload(payload: any): Promise<{ handled: boolean; replyText?: string }> {
    try {
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (!message || message.type !== 'text') {
        // Not a user text message (could be a status update, delivery receipt, etc.)
        return { handled: false };
      }

      const senderNumber = message.from;
      const incomingText = message.text?.body;

      if (!senderNumber || !incomingText) {
        return { handled: false };
      }

      logger.info(`Received WhatsApp message from ${senderNumber}: "${incomingText}"`);

      // Dispatch through command and query router
      const reply = await WhatsAppRouter.handleIncomingMessage(senderNumber, incomingText);

      // Send response back to user
      await this.sendTextMessage(senderNumber, reply);

      return { handled: true, replyText: reply };
    } catch (err: any) {
      logger.error(`Error handling WhatsApp webhook payload: ${err.message}`);
      return { handled: false };
    }
  }

  /**
   * Sends text message to recipient via Meta WhatsApp Cloud API.
   * If credentials are not configured, logs clearly as IMPLEMENTED — REQUIRES CREDENTIAL.
   */
  static async sendTextMessage(to: string, messageText: string): Promise<boolean> {
    if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
      logger.info(
        `[IMPLEMENTED — REQUIRES CREDENTIAL] WhatsApp message prepared for ${to} (${messageText.length} chars). Set WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID in production.`
      );
      return true;
    }

    try {
      const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: {
            preview_url: true,
            body: messageText,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      logger.info(`Successfully dispatched WhatsApp message to ${to}`);
      return true;
    } catch (err: any) {
      logger.error(`Failed to send WhatsApp message via Meta Cloud API: ${err.response?.data?.error?.message || err.message}`);
      return false;
    }
  }
}
