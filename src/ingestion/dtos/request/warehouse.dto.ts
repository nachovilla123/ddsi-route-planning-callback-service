import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
} from 'src/shared/decorators/coordinates-validator';

// warehouse DTO = deposito DTO
export class WarehouseDto {
  @ApiProperty({ example: -34.6037, description: 'Latitud del deposito' })
  @IsLatitude()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ example: -58.3816, description: 'Longitud del deposito' })
  @IsLongitude()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({
    example: 'Av. Corrientes 1234, CABA',
    description: 'Direccion del deposito',
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}
