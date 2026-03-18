import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoutingStatus } from '../../entities/routing-status.enum';

class StopDto {
  @ApiProperty({ example: 1 })
  stopNumber: number;

  @ApiProperty({ example: 'ENT-001' })
  deliveryCode: string;

  @ApiProperty({ example: '2025-09-21T09:25:00Z' })
  estimatedArrivalTime: string;
}

class RouteResultDto {
  @ApiProperty({ example: 'CAMION-CHICO' })
  truckId: string;

  @ApiProperty({ example: 'route_74ea598c-eeac-46b6-8166-e7ee784a8ac8' })
  assignedRouteId: string;

  @ApiProperty({ example: '2025-09-21T09:00:00Z' })
  estimatedStartTime: string;

  @ApiProperty({ example: '2025-09-21T13:30:00Z' })
  estimatedEndTime: string;

  @ApiProperty({ example: 26.4 })
  totalDistanceKm: number;

  @ApiProperty({ example: 270 })
  totalDurationMins: number;

  @ApiProperty({ type: [StopDto] })
  stops: StopDto[];
}

class UnassignedDeliveryDto {
  @ApiProperty({ example: 'ENT-003' })
  deliveryCode: string;

  @ApiProperty({ example: 'Capacity exceeded' })
  reason: string;
}

class PlanningResultDto {
  @ApiProperty({ type: [RouteResultDto] })
  routes: RouteResultDto[];

  @ApiProperty({ type: [UnassignedDeliveryDto] })
  unassignedDeliveries: UnassignedDeliveryDto[];
}

export class GetRouteStatusResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174093',
    description: 'UUID de la solicitud',
  })
  requestId: string;

  @ApiProperty({
    enum: RoutingStatus,
    example: RoutingStatus.COMPLETED,
    description: 'Estado actual de la solicitud',
  })
  status: RoutingStatus;

  @ApiProperty({ description: 'Fecha de creación de la solicitud' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de la última actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: PlanningResultDto,
    description:
      'Presente solo si el estado es COMPLETED. Contiene el resultado del ruteo.',
  })
  result?: PlanningResultDto;

  @ApiPropertyOptional({
    example: 'Error matemático al calcular la ruta',
    description: 'Presente solo si el estado es FAILED.',
  })
  error?: string;
}
