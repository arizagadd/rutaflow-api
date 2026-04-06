import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class NotificationService {
  private client: twilio.Twilio;

    constructor() {
      this.client = new twilio.Twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
    }

  /**
   * Formatea número mexicano a formato internacional
   * 3311493852 → +523311493852
   */
  private formatMexicanPhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    if (cleaned.length === 10) {
      return `+52${cleaned}`;
    }
    
    if (cleaned.length === 12 && cleaned.startsWith('52')) {
      return `+${cleaned}`;
    }

    return cleaned;
  }

  async sendWhatsApp(to: string, contentSid: string, contentVariables: any) {
    const formattedPhone = this.formatMexicanPhone(to);
    const toWhatsApp = `whatsapp:${formattedPhone}`;

    // Si contentVariables es un string, intentar parsearlo
    let variables = contentVariables;
    if (typeof contentVariables === 'string') {
      try {
        variables = JSON.parse(contentVariables);
      } catch (e) {
        variables = { "1": contentVariables }; // Fallback
      }
    }

    try {
      const message = await this.client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: toWhatsApp,
        contentSid: contentSid,
        contentVariables: JSON.stringify(variables),
      });
      return { success: true, sid: message.sid };
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyConductor(phone: string, routeName: string, date: string) {
    // Template: Assignment of Route
    const contentSid = 'HXb3f55276067d464b8d8e457478e122be';
    const contentVariables = {
      '1': routeName,
      '2': date || new Date().toISOString().split('T')[0],
    };
    return this.sendWhatsApp(phone, contentSid, contentVariables);
  }

  async notifyCliente(phone: string, clientName: string, stopName: string) {
    // Template: Order delivered/update
    // El usuario proporcionó HXe896350388914baab3086eb293b5993b en su prompt final
    const contentSid = 'HXe896350388914baab3086eb293b5993b';
    const contentVariables = {
      '1': clientName,
      '2': stopName,
    };
    return this.sendWhatsApp(phone, contentSid, contentVariables);
  }
}
