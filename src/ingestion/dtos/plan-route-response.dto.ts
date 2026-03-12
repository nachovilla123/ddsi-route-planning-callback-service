import { RoutingStatus } from '../entities/routing-request.entity';

export class PlanRouteResponseDto {
  requestId: string;
  status: RoutingStatus;
}
