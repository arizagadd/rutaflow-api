import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import * as crypto from "crypto";

// Encryption/Decryption Key
const clave = "1312_3-1@23-da**sd-123-da-sd-123";

// Generate key (raw binary output like PHP)
const key = crypto.createHash("sha256").update(clave).digest(); // Raw binary
// Generate IV (hex string, sliced to 16 characters, then converted to raw binary)
const iv = crypto.createHash("sha256").update(clave).digest("hex").substring(0, 16);

// Decrypt Function
function desencriptar(txt: string): number | null {
  try {

    // Validate input: must be a valid hex string
    if (!/^[0-9a-fA-F]+$/.test(txt) || txt.length % 2 !== 0) {
      console.error("Invalid hex input");
      return null;
    }

    // Convert hex string to binary buffer
    const encryptedBuffer = Buffer.from(txt, "hex"); // Convert hex string to binary

    // Initialize decipher with the correct method, key, and IV
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    decipher.setAutoPadding(true); // PKCS#7 padding enabled by default

    // Decrypt the data
    let decrypted = decipher.update(encryptedBuffer, undefined, "utf8");
    decrypted += decipher.final("utf8"); // Finalize decryption with "utf8" encoding
    
    // Convert the decrypted string to a number
    const result = Number(decrypted.trim()); // Remove any padding or spaces

    return result;
  } catch (error) {
    console.error("Decryption failed:", error.message);
    return null;
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
