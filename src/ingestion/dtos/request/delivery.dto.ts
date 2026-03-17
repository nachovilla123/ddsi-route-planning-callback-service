import { IsNumber, IsString, IsNotEmpty, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
} from 'src/shared/decorators/coordinates-validator';

export class DeliveryDto {
  @ApiProperty({
    example: 'DEL-001',
    description: 'Codigo unico de la entrega',
  })
  @IsString()
  @IsNotEmpty()
  deliveryCode: string;

  @ApiProperty({
    example: -34.6037,
    description: 'Latitud del punto de entrega',
  })
  @IsLatitude()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    example: -58.3816,
    description: 'Longitud del punto de entrega',
  })
  @IsLongitude()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({
    example: 'Av. Libertador 5000, CABA',
    description: 'Direccion de entrega',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: 25.5,
    description: 'Peso en kg (debe ser mayor a 0)',
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive({
    message: 'El peso (WeightKg) debe ser un número positivo mayor a 0',
  })
  @IsNotEmpty()
  WeightKg: number;

  @ApiProperty({
    example: 0.5,
    description: 'Volumen en m3 (debe ser mayor a 0)',
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive({
    message: 'El volumen (VolumeM3) debe ser un número positivo mayor a 0',
  })
  @IsNotEmpty()
  VolumeM3: number;
}
