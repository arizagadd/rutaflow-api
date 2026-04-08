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

  /** Opcional: Messaging Service SID (MG…). Ver Twilio Content + Messaging Services. */
  private getMessagingServiceSid(): string | undefined {
    const mg = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
    return mg || undefined;
  }

  /**
   * México WhatsApp: por defecto +521 + 10 dígitos. WHATSAPP_MX_USE_LEGACY_52=1 → +52 + 10 (sin 1 móvil).
   */
  private formatMexicanPhone(phone: string): string {
    const legacy =
      process.env.WHATSAPP_MX_USE_LEGACY_52 === '1';
    let digits = phone.replace(/\D/g, '');

    if (legacy) {
      if (digits.length === 13 && digits.startsWith('521')) {
        digits = '52' + digits.slice(3);
      }
      if (digits.length === 10) {
        return `+52${digits}`;
      }
      if (digits.length === 12 && digits.startsWith('52')) {
        return `+${digits}`;
      }
      return `+${digits}`;
    }

    if (digits.length === 13 && digits.startsWith('521')) {
      return `+${digits}`;
    }
    if (digits.length === 12 && digits.startsWith('52')) {
      return `+521${digits.slice(2)}`;
    }
    if (digits.length === 10) {
      return `+521${digits.replace(/^0+/, '')}`;
    }
    return `+${digits}`;
  }

  /**
   * Twilio 21656: sin vacíos, sin saltos/tab ni >4 espacios seguidos, máx. 1600 chars.
   * @see https://www.twilio.com/docs/api/errors/21656
   */
  private sanitizeOneContentValue(value: unknown): string {
    let s =
      value == null
        ? ''
        : String(value)
            .replace(/\r\n|\r|\n|\t/g, ' ')
            .replace(/ {5,}/g, '    ')
            .trim();
    if (s.length > 1600) {
      s = s.slice(0, 1600);
    }
    return s.length > 0 ? s : '—';
  }

  private normalizeContentVariables(
    variables: Record<string, unknown>,
  ): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, val] of Object.entries(variables)) {
      out[key] = this.sanitizeOneContentValue(val);
    }
    return out;
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

    let variables: Record<string, unknown> = contentVariables;
    if (typeof contentVariables === 'string') {
      try {
        variables = JSON.parse(contentVariables) as Record<string, unknown>;
      } catch {
        variables = { '1': contentVariables };
      }
    }

    if (
      variables &&
      typeof variables === 'object' &&
      !Array.isArray(variables)
    ) {
      variables = this.normalizeContentVariables(variables);
    }

    try {
      console.log(
        `Attempting to send WhatsApp message to ${toWhatsApp} using template ${contentSid}`,
      );
      console.log(`Content Variables: ${JSON.stringify(variables)}`);

      const messagingServiceSid = this.getMessagingServiceSid();
      const message = await client.messages.create({
        from,
        to: toWhatsApp,
        contentSid,
        contentVariables: JSON.stringify(variables),
        ...(messagingServiceSid && { messagingServiceSid }),
      });

      console.log(`WhatsApp message sent successfully. SID: ${message.sid}`);
      return { success: true, sid: message.sid, message: 'Enviado' };
    } catch (error: any) {
      console.error('Error sending WhatsApp message via Twilio:');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Full Error:', JSON.stringify(error, null, 2));
      const code = error?.code;
      if (code === 21656 || code === '21656') {
        return {
          success: false,
          error: 'twilio_content_variables_invalid',
          message:
            'Twilio 21656: la plantilla no coincide con las variables enviadas. Si tu plantilla solo tiene {{1}}, define TWILIO_CLIENT_NOTIFY_VARS=1 en el servidor. Revisa en Twilio Console el Content (SID) y los placeholders aprobados.',
          twilioCode: 21656,
        };
      }
      const msg = error.message || 'Error de Twilio';
      return {
        success: false,
        error: msg,
        message: msg,
        ...(code != null && { twilioCode: code }),
      };
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
      const messagingServiceSid = this.getMessagingServiceSid();
      const message = await client.messages.create({
        from,
        to: toWhatsApp,
        body: body || '',
        ...(messagingServiceSid && { messagingServiceSid }),
      });
      return {
        success: true,
        sid: message.sid,
        message: 'Notificación enviada correctamente.',
      };
    } catch (error: any) {
      const code = error?.code;
      // WhatsApp: texto libre solo dentro de la ventana de 24 h tras el último mensaje del usuario.
      if (code === 63016 || code === '63016') {
        return {
          success: false,
          error: 'whatsapp_template_required',
          message:
            'WhatsApp no permite texto libre fuera de la ventana de 24 h. Usa plantilla aprobada: POST /api/notification/send con contentSid y contentVariables, o los endpoints /conductor y /cliente.',
          twilioCode: 63016,
        };
      }
      const msg = error.message || 'Error de Twilio';
      return {
        success: false,
        error: msg,
        message: msg,
        ...(code != null && { twilioCode: code }),
      };
    }
  }

  async notifyConductor(phone: string, routeName: string, _date: string) {
    const contentSid =
      process.env.TWILIO_TEMPLATE_ROUTE_ASSIGN ||
      process.env.TEMPLATE_NOTIFICACIONES_DE_RUTA ||
      'HXb3f55276067d464b8d8e457478e122be';
    // Plantilla notificaciones_de_ruta: solo {{1}} = nombre de ruta. Enviar {{2}} u otros rompe la entrega (Failed en consola Twilio).
    const contentVariables = { '1': routeName };
    return this.sendWhatsApp(phone, contentSid, contentVariables);
  }

  /**
   * Plantilla típica Rutaflow: corpcopy_va_en_camino — {{1}} cliente, {{2}} conductor.
   * Override: TWILIO_TEMPLATE_CLIENT_NOTIFY. Una sola variable: TWILIO_CLIENT_NOTIFY_VARS=1.
   */
  async notifyCliente(phone: string, clientName: string, secondPlaceholder: string) {
    const contentSid =
      process.env.TWILIO_TEMPLATE_CLIENT_NOTIFY ||
      'HX8634c5ceed46670f40c129c9d1623485';

    const singleVar =
      process.env.TWILIO_CLIENT_NOTIFY_VARS === '1' ||
      process.env.TWILIO_CLIENT_NOTIFY_SINGLE_VAR === '1' ||
      process.env.TWILIO_CLIENT_NOTIFY_SINGLE_VAR === 'true';

    const n1 = this.sanitizeOneContentValue(clientName);
    const n2 = this.sanitizeOneContentValue(secondPlaceholder);

    const contentVariables = singleVar
      ? {
          '1':
            n1 === '—' && n2 === '—'
              ? 'Actualización de entrega'
              : [n1, n2].filter((s) => s !== '—').join('. ') ||
                'Actualización de entrega',
        }
      : {
          '1': n1,
          '2': n2,
        };

    return this.sendWhatsApp(phone, contentSid, contentVariables);
  }
}
