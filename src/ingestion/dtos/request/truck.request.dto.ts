import { IsNumber, IsString, IsNotEmpty, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TruckDto {
  @ApiProperty({
    example: 'CAMION-CHICO',
    description: 'Identificador unico del camion',
  })
  @IsString()
  @IsNotEmpty()
  truckId: string;

  @ApiProperty({
    example: 1000,
    description: 'Capacidad de peso en kg (debe ser mayor a 0)',
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive({
    message:
      'La capacidad de peso (WeightCapacityKg) del camión debe ser mayor a 0',
  })
  @IsNotEmpty()
  WeightCapacityKg: number;

  @ApiProperty({
    example: 10,
    description: 'Capacidad de volumen en m3 (debe ser mayor a 0)',
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive({
    message:
      'La capacidad de volumen (VolumeCapacityM3) del camión debe ser mayor a 0',
  })
  @IsNotEmpty()
  VolumeCapacityM3: number;
}
