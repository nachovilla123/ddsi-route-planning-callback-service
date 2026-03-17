import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsUUID,
  ValidateNested,
  ArrayUnique,
  IsDefined,
  IsNotEmptyObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryDto } from './delivery.dto';
import { TruckDto } from './truck.dto';
import { WarehouseDto } from './warehouse.dto';
import { TimeWindowDto } from './time-window.dto';

export class PlanRouteDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID unico de la solicitud',
  })
  @IsUUID()
  requestId: string;

  @ApiProperty({
    description: 'Jornada operativa (ventana horaria)',
    type: TimeWindowDto,
  })
  @ValidateNested()
  @IsDefined({ message: 'El objeto timeWindow es obligatorio' })
  @IsNotEmptyObject({}, { message: 'El timeWindow no puede estar vacío' })
  @Type(() => TimeWindowDto)
  timeWindow: TimeWindowDto;

  @ApiProperty({
    description: 'Datos del deposito de origen',
    type: WarehouseDto,
  })
  @ValidateNested()
  @Type(() => WarehouseDto)
  warehouse: WarehouseDto;

  @ApiProperty({
    description: 'Lista de entregas a planificar (1-100)',
    type: [DeliveryDto],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @ArrayUnique((delivery: DeliveryDto) => delivery.deliveryCode, {
    message: 'Delivery codes must be unique within the delivery list',
  })
  @Type(() => DeliveryDto)
  deliveries: DeliveryDto[];

  @ApiProperty({
    description: 'Lista de camiones disponibles',
    type: [TruckDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @ArrayUnique((truck: TruckDto) => truck.truckId, {
    message: 'truckIds must be unique within the truck list',
  })
  @Type(() => TruckDto)
  trucks: TruckDto[];
}
