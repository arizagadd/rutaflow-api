import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import * as crypto from 'crypto';

// Encryption/Decryption Key
const clave = "esternocleidomastoideoooo";

// Decrypt Function
function desencriptar(txt: string): number | string {
  const protectedValues = [null, "null", "Sin empresa"];
  if (protectedValues.includes(txt)) return txt;

  for (let i = 0; ; i++) {
    const potentialValue = String(i);
    const hash = crypto.createHmac('sha256', clave).update(potentialValue).digest('hex');
    if (hash.startsWith(txt)) {
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
