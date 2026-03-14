import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../shared/guards/api-key.guard';
import { CurrentGroup } from '../../shared/decorators/current-group.decorator';
import { IngestionService } from '../services/ingestion.service';
import { PlanRouteDto } from '../dtos/request/plan-route.dto';
import { PlanRouteResponseDto } from '../dtos/response/plan-route-response.dto';
import { StudentGroup } from '../../groups/entities/student-group.entity';

@ApiTags('Plan Route')
@ApiBearerAuth()
@Controller('plan-route')
@UseGuards(ApiKeyGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @HttpCode(202)
  @ApiOperation({ summary: 'Solicitar planificacion de rutas' })
  @ApiResponse({
    status: 202,
    description: 'Solicitud aceptada para procesamiento',
    type: PlanRouteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de solicitud invalidos' })
  @ApiResponse({ status: 401, description: 'API key invalida o ausente' })
  planRoute(
    @Body() dto: PlanRouteDto,
    @CurrentGroup() group: StudentGroup,
  ): Promise<PlanRouteResponseDto> {
    return this.ingestionService.saveRoutingRequest(dto, group.id);
  }

  // TODO:
  // @Get(":id")
  // @HttpCode(200)
  // getPlannedRoute()
}
