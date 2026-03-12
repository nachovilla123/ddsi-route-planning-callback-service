import { IsNumber, IsString } from 'class-validator';

// warehouse DTO = depósito DTO
export class WarehouseDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  // dirección del depósito
  @IsString()
  address: string;
}
