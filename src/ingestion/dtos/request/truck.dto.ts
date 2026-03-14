import { IsNumber, IsString, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// truck DTO = camion DTO
export class TruckDto {
  @ApiProperty({
    example: 'TRUCK-01',
    description: 'Identificador unico del camion',
  })
  @IsString()
  @IsNotEmpty()
  truckId: string;

  @ApiProperty({
    example: 1000,
    description: 'Capacidad de peso en kg',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  WeightCapacityKg: number;

  @ApiProperty({
    example: 10,
    description: 'Capacidad de volumen en m3',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  VolumeCapacityM3: number;
}
