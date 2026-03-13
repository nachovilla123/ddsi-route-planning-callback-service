import { IsNumber, IsString } from 'class-validator';

// delivery DTO = entrega DTO
export class DeliveryDto {
  @IsString()
  deliveryCode: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  // Peso en kg = weight in kg
  @IsNumber()
  WeightKg: number;

  // Volumen en m3 = volume in m3
  @IsNumber()
  VolumeM3: number;
}
