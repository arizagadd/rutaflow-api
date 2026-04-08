import { IsOptional, IsString } from 'class-validator';

export class NotifyClienteDto {
  @IsString()
  phone: string;

  @IsString()
  clientName: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  stopName?: string;
}
