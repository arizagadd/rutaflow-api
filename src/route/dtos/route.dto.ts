import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import * as crypto from "crypto";

// Encryption/Decryption Key
const clave = "W3K_Ñjq*/";

// Decrypt Function
function desencriptar(value: string | number): number | string {
  value = String(value);

  // Si ya es un número entero puro (sin ceros a la izquierda que indiquen un hash hexadecimal),
  // lo retornamos directamente para evitar que lo confunda con un prefijo de hash corto.
  if (/^(0|[1-9]\d*)$/.test(value)) {
      return parseInt(value, 10);
  }

  if (!/^[a-z0-9]+$/.test(value)) {
      return value;
  }

  // Límite de seguridad para evitar bucles infinitos en producción
  for (let i = 0; i < 100000; i++) {
      const hash = crypto.createHmac('sha256', clave).update(String(i)).digest('hex');
      if (hash.startsWith(value)) {
          return i;
      }
  }
  return value; // Si no lo encuentra, lo devuelve intacto
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

export class GenerateTemplateDirectionsDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => desencriptar(value), { toClassOnly: true })
  routeTemplateId: number;
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

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false' || value === '0' || value === false) return false;
    if (value === 'true' || value === '1' || value === true) return true;
    return value;
  }, { toClassOnly: true })
  optimize?: boolean;
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
