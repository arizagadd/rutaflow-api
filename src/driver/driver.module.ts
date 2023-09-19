import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';

@Module({
  providers: [DriverService]
})
export class DriverModule {}
