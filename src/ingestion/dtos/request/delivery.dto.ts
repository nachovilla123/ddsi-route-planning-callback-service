import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
} from 'src/shared/decorators/coordinates-validator';

// delivery DTO = entrega DTO
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

  @ApiProperty({ example: 25.5, description: 'Peso en kg' })
  @IsNumber()
  @IsNotEmpty()
  WeightKg: number;

  @ApiProperty({ example: 0.5, description: 'Volumen en m3' })
  @IsNumber()
  @IsNotEmpty()
  VolumeM3: number;
}
