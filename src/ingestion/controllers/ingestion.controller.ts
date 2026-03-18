import {
  Body,
  Controller,
  HttpCode,
  Post,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../shared/guards/api-key.guard';
import { CurrentGroup } from '../../shared/decorators/current-group.decorator';
import { IngestionService } from '../services/ingestion.service';
import { PlanRouteDto } from '../dtos/request/plan-route.request.dto';
import { PlanRouteResponseDto } from '../dtos/response/plan-route.response.dto';
import { GetRouteStatusResponseDto } from '../dtos/response/get-route.response.dto';
import { StudentGroup } from '../../groups/entities/student-group.entity';
import { Throttle } from '@nestjs/throttler';
import { ingestionApiDocs } from '../utils/docs/ingestion-api-docs';

const { planRoute: planRouteDocs, getPlannedRoute: getPlannedRouteDocs } =
  ingestionApiDocs;

@ApiTags('Plan Route')
@ApiBearerAuth()
@Controller('plan-route')
@UseGuards(ApiKeyGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(202)
  @ApiOperation({
    summary: planRouteDocs.summary,
    description: planRouteDocs.description,
  })
  @ApiResponse({
    status: 202,
    description: planRouteDocs.responses.accepted,
    type: PlanRouteResponseDto,
  })
  @ApiResponse({ status: 400, description: planRouteDocs.responses.badRequest })
  @ApiResponse({
    status: 401,
    description: planRouteDocs.responses.unauthorized,
  })
  planRoute(
    @Body() dto: PlanRouteDto,
    @CurrentGroup() group: StudentGroup,
  ): Promise<PlanRouteResponseDto> {
    return this.ingestionService.saveRoutingRequest(dto, group.id);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: getPlannedRouteDocs.summary })
  @ApiParam({
    name: 'id',
    description: getPlannedRouteDocs.paramDescription,
  })
  @ApiResponse({
    status: 200,
    description: getPlannedRouteDocs.responses.ok,
    type: GetRouteStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: getPlannedRouteDocs.responses.notFound,
  })
  @ApiResponse({
    status: 401,
    description: getPlannedRouteDocs.responses.unauthorized,
  })
  getPlannedRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentGroup() group: StudentGroup,
  ): Promise<GetRouteStatusResponseDto> {
    return this.ingestionService.getRoutingStatus(id, group.id);
  }
}
