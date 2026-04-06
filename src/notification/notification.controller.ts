import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('conductor')
  async notifyConductor(
    @Body() body: { phone: string; routeName: string; date: string },
  ) {
    return this.notificationService.notifyConductor(
      body.phone,
      body.routeName,
      body.date,
    );
  }

  @Post('cliente')
  async notifyCliente(
    @Body() body: { phone: string; clientName: string; stopName: string },
  ) {
    return this.notificationService.notifyCliente(
      body.phone,
      body.clientName,
      body.stopName,
    );
  }

  @Post('send')
  async sendGeneric(
    @Body() body: { to: string; contentSid: string; contentVariables: any },
  ) {
    return this.notificationService.sendWhatsApp(
      body.to,
      body.contentSid,
      body.contentVariables,
    );
  }
}
