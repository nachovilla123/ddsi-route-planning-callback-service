import { IsString, IsNotEmpty } from 'class-validator';
import { IsLatitude, IsLongitude } from 'src/shared/decorators/coordinates-validator';
// warehouse DTO = depósito DTO
export class WarehouseDto {

  @IsLatitude()
  @IsNotEmpty()
  latitude: number;

  @IsLongitude()
  @IsNotEmpty()
  longitude: number;

  // dirección del depósito
  @IsString()
  @IsNotEmpty()
  address: string;
}
