import { ApiProperty } from '@nestjs/swagger';
import { RoutingStatus } from '../../entities/routing-status.enum';

export class PlanRouteResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID de la solicitud',
  })
  requestId: string;

  @ApiProperty({
    enum: RoutingStatus,
    example: RoutingStatus.PENDING,
    description: 'Estado de la solicitud',
  })
  status: RoutingStatus;
}
