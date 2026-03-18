import {
  Body,
  Controller,
  HttpCode,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GroupsService } from '../services/groups.service';
import { RegisterGroupDto } from '../dtos/register-group.dto';
import { RegisterGroupResponseDto } from '../dtos/register-group-response.dto';
import { UpdateCallbackDto } from '../dtos/update-callback.dto';
import { UpdateCallbackResponseDto } from '../dtos/update-callback-response.dto';
import { ApiKeyGuard } from '../../shared/guards/api-key.guard';
import { CurrentGroup } from '../../shared/decorators/current-group.decorator';
import { StudentGroup } from '../entities/student-group.entity';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  //ttl = 3600000 ms = 1 hora, limit = 5 registros por hora para evitar abusos
  @HttpCode(201)
  @ApiOperation({ summary: 'Registrar un nuevo grupo' })
  @ApiResponse({
    status: 201,
    description: 'Grupo registrado exitosamente',
    type: RegisterGroupResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de registro invalidos' })
  register(@Body() dto: RegisterGroupDto): Promise<RegisterGroupResponseDto> {
    return this.groupsService.createGroup(dto);
  }

  @Patch('callback')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar la URL de callback del grupo' })
  @ApiResponse({
    status: 200,
    description: 'Callback actualizado',
    type: UpdateCallbackResponseDto,
  })
  @ApiResponse({ status: 401, description: 'API key invalida o ausente' })
  updateCallback(
    @Body() dto: UpdateCallbackDto,
    @CurrentGroup() group: StudentGroup,
  ): Promise<UpdateCallbackResponseDto> {
    return this.groupsService.updateCallbackUrl(group, dto.callbackUrl);
  }
}
