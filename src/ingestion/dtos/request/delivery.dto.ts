import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { IsLatitude, IsLongitude } from 'src/shared/decorators/coordinates-validator';

// delivery DTO = entrega DTO
export class DeliveryDto {
  //todo: contemplar el caso que nos mandan una lista de deliveries con codigos repetidos.
  @IsString()
  @IsNotEmpty()
  deliveryCode: string;

  @IsLatitude()
  @IsNotEmpty()
  latitude: number;

  @IsLongitude()
  @IsNotEmpty()
  longitude: number;

  // Peso en kg = weight in kg
  @IsNumber()
  @IsNotEmpty()
  WeightKg: number;

  // Volumen en m3 = volume in m3
  @IsNumber()
  @IsNotEmpty()
  VolumeM3: number;
}
