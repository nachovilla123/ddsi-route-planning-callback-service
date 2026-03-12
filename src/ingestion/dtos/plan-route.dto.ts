import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryDto } from './delivery.dto';
import { TruckDto } from './truck.dto';
import { WarehouseDto } from './warehouse.dto';

export class PlanRouteDto {
  @IsUUID()
  requestId: string;

  // warehouse = deposito
  @ValidateNested()
  @Type(() => WarehouseDto)
  warehouse: WarehouseDto;

  // deliveries = entregas
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => DeliveryDto)
  deliveries: DeliveryDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TruckDto)
  trucks: TruckDto[];
}
