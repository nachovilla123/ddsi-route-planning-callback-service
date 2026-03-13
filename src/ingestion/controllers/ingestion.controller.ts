import {
  Body,
  Controller,
  HttpCode,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../../shared/guards/api-key.guard';
import { CurrentGroup } from '../../shared/decorators/current-group.decorator';
import { IngestionService } from '../services/ingestion.service';
import { PlanRouteDto } from '../dtos/plan-route.dto';
import { PlanRouteResponseDto } from '../dtos/plan-route-response.dto';
import { UpdateCallbackDto } from '../dtos/update-callback.dto';
import { UpdateCallbackResponseDto } from '../dtos/update-callback-response.dto';
import { StudentGroup } from '../../groups/entities/student-group.entity';

@Controller()
@UseGuards(ApiKeyGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('plan-route')
  @HttpCode(202)
  planRoute(
    @Body() dto: PlanRouteDto,
    @CurrentGroup() group: StudentGroup,
  ): Promise<PlanRouteResponseDto> {
    return this.ingestionService.saveRoutingRequest(dto, group.id);
  }

  @Put('callback')
  updateCallback(
    @Body() dto: UpdateCallbackDto,
    @CurrentGroup() group: StudentGroup,
  ): Promise<UpdateCallbackResponseDto> {
    return this.ingestionService.updateCallbackUrl(group, dto.callbackUrl);
  }
}
