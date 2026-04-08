import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotifyClienteDto } from './dto/notify-cliente.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('conductor')
  async notifyConductor(
    @Body() body: { phone: string; routeName: string; date: string },
  ) {
    return this.notificationService.notifyConductor(
      String(body.phone ?? '').trim(),
      String(body.routeName ?? ''),
      String(body.date ?? ''),
    );
  }

  @Post('cliente')
  async notifyCliente(@Body() body: NotifyClienteDto) {
    const second = String(body.driverName ?? body.stopName ?? '').trim();
    return this.notificationService.notifyCliente(
      String(body.phone ?? '').trim(),
      String(body.clientName ?? ''),
      second,
    );
  }

  /** SMS clásico (Twilio Programmable SMS), no WhatsApp. Body: `{ phone, text }` o `body`. */
  @Post('sms')
  async sendSms(
    @Body() body: { phone?: string; text?: string; body?: string },
  ) {
    const phone = String(body.phone ?? '').trim();
    const text = String(body.text ?? body.body ?? '').trim();
    if (!phone) {
      return { success: false, message: 'Falta phone.' };
    }
    if (!text) {
      return { success: false, message: 'Falta text o body.' };
    }
    return this.notificationService.sendSms(phone, text);
  }

  /**
   * Compatible con el panel (main.js): acepta `to` o `phone`, plantilla o texto libre.
   */
  @Post('send')
  async sendGeneric(
    @Body()
    body: {
      to?: string;
      phone?: string;
      text?: string;
      contentSid?: string;
      contentVariables?: any;
    },
  ) {
    const dest = String(body.to ?? body.phone ?? '').trim();
    if (!dest) {
      return { success: false, message: 'Falta teléfono (to o phone).' };
    }

    if (body.contentSid) {
      return this.notificationService.sendWhatsApp(
        dest,
        body.contentSid,
        body.contentVariables,
      );
    }

    if (body.text != null && String(body.text).trim() !== '') {
      return this.notificationService.sendWhatsAppText(dest, String(body.text));
    }

    return {
      success: false,
      message: 'Falta contentSid (plantilla) o text (mensaje libre).',
    };
  }
}
