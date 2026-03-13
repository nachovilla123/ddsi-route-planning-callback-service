import { RoutingStatus } from '../../entities/routing-status.enum';

export class PlanRouteResponseDto {
  requestId: string;
  status: RoutingStatus;
}
