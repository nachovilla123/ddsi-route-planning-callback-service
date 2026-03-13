import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsUUID,
  ValidateNested,
  ArrayUnique,
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
  @ArrayUnique((delivery: DeliveryDto) => delivery.deliveryCode, {
    message: 'Delivery codes must be unique within the delivery list',
  })
  @Type(() => DeliveryDto)
  deliveries: DeliveryDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @ArrayUnique((truck: TruckDto) => truck.truckId, {
    message: 'truckIds must be unique within the truck list',
  })
  @Type(() => TruckDto)
  trucks: TruckDto[];
}
