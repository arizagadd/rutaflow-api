import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import * as crypto from 'crypto';

// Encryption/Decryption Key
const clave = "W3K_Ñjq*/";

// Decrypt Function
function desencriptar(value: string): number | string {
  value = String(value);

  if (!/^[a-z0-9]+$/.test(value)) {
      return value;
  }

  for (let i = 0; ; i++) {
      const hash = crypto.createHmac('sha256', clave).update(String(i)).digest('hex');
      if (hash.startsWith(value)) {
          return i;
      }
  }
}

export class CreateRouteByTemplateDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => desencriptar(value), { toClassOnly: true })
  routeTemplateId: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => desencriptar(value), { toClassOnly: true })
  clientId: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => desencriptar(value), { toClassOnly: true })
  driverId: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => desencriptar(value), { toClassOnly: true })
  vehicleId: number;
}

export class UpdateRouteDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => desencriptar(value), { toClassOnly: true })
  routeId: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => desencriptar(value), { toClassOnly: true })
  stopInitial: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => desencriptar(value), { toClassOnly: true })
  stopFinal: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    value
      .toString()
      .split(',')
      .map((v: string) => desencriptar(v))
  )
  stopWaypoints?: number[];
}

export class CreateRouteDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => desencriptar(value), { toClassOnly: true })
  stopInitial: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => desencriptar(value), { toClassOnly: true })
  stopFinal: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    value
      .toString()
      .split(',')
      .map((v: string) => desencriptar(v))
  )
  stopWaypoints?: number[];
}

export class RouteResponseDto {}
