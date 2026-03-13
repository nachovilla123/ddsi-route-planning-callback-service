import { IsNumber, IsString, Min, IsNotEmpty } from 'class-validator';

// truck DTO = camión DTO
export class TruckDto {
  //todo: contemplar el caso que nos mandan una lista de truck con id repetidos.
  @IsString()
  @IsNotEmpty()
  truckId: string;

  // capacidad_peso_kg = weight capacity in kg
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  WeightCapacityKg: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  VolumeCapacityM3: number;
}
