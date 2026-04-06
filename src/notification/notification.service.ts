import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class NotificationService {
  private client: twilio.Twilio | null = null;

  private getClient(): twilio.Twilio | null {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      return null;
    }
    if (!this.client) {
      this.client = new twilio.Twilio(sid, token);
    }
    return this.client;
  }

  private getFromWhatsApp(): string | null {
    const raw = process.env.TWILIO_WHATSAPP_FROM;
    if (!raw) return null;
    if (raw.toLowerCase().startsWith('whatsapp:')) {
      return raw;
    }
    return `whatsapp:${raw.replace(/^\+/, '')}`;
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
    const client = this.getClient();
    const from = this.getFromWhatsApp();
    if (!client || !from) {
      return {
        success: false,
        message:
          'Twilio no configurado: defina TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM.',
        error: 'twilio_not_configured',
      };
    }

    const formattedPhone = this.formatMexicanPhone(to);
    const toWhatsApp = `whatsapp:${formattedPhone}`;

    let variables = contentVariables;
    if (typeof contentVariables === 'string') {
      try {
        variables = JSON.parse(contentVariables);
      } catch {
        variables = { '1': contentVariables };
      }
    }

    try {
      console.log(
        `Attempting to send WhatsApp message to ${toWhatsApp} using template ${contentSid}`,
      );
      console.log(`Content Variables: ${JSON.stringify(variables)}`);

      const message = await client.messages.create({
        from,
        to: toWhatsApp,
        contentSid,
        contentVariables: JSON.stringify(variables),
      });

      console.log(`WhatsApp message sent successfully. SID: ${message.sid}`);
      return { success: true, sid: message.sid, message: 'Enviado' };
    } catch (error: any) {
      console.error('Error sending WhatsApp message via Twilio:');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Full Error:', JSON.stringify(error, null, 2));
      const msg = error.message || 'Error de Twilio';
      return { success: false, error: msg, message: msg };
    }
  }

  /** Mensaje de texto libre (mismo contrato que send.php sin plantilla). */
  async sendWhatsAppText(to: string, body: string) {
    const client = this.getClient();
    const from = this.getFromWhatsApp();
    if (!client || !from) {
      return {
        success: false,
        message:
          'Twilio no configurado: defina TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM.',
        error: 'twilio_not_configured',
      };
    }

    const formattedPhone = this.formatMexicanPhone(to);
    const toWhatsApp = `whatsapp:${formattedPhone}`;

    try {
      const message = await client.messages.create({
        from,
        to: toWhatsApp,
        body: body || '',
      });
      return {
        success: true,
        sid: message.sid,
        message: 'Notificación enviada correctamente.',
      };
    } catch (error: any) {
      const msg = error.message || 'Error de Twilio';
      return { success: false, error: msg, message: msg };
    }
  }

  async notifyConductor(phone: string, routeName: string, date: string) {
    const contentSid =
      process.env.TWILIO_TEMPLATE_ROUTE_ASSIGN ||
      'HXb3f55276067d464b8d8e457478e122be';
    const contentVariables = {
      '1': routeName,
      '2': date || new Date().toISOString().split('T')[0],
    };
    return this.sendWhatsApp(phone, contentSid, contentVariables);
  }

  async notifyCliente(phone: string, clientName: string, stopName: string) {
    const contentSid =
      process.env.TWILIO_TEMPLATE_CLIENT_NOTIFY ||
      'HXe896350388914baab3086eb293b5993b';
    const contentVariables = {
      '1': clientName,
      '2': stopName,
    };
    return this.sendWhatsApp(phone, contentSid, contentVariables);
  }
}
