import { Body, Controller, HttpCode, Post, Patch,  UseGuards, } from '@nestjs/common';
import { GroupsService } from '../services/groups.service';
import { RegisterGroupDto } from '../dtos/register-group.dto';
import { RegisterGroupResponseDto } from '../dtos/register-group-response.dto';
import { UpdateCallbackDto } from '../dtos/update-callback.dto';
import { UpdateCallbackResponseDto } from '../dtos/update-callback-response.dto';
import { ApiKeyGuard } from '../../shared/guards/api-key.guard';
import { CurrentGroup } from '../../shared/decorators/current-group.decorator';
import { StudentGroup } from '../entities/student-group.entity';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('register')
  @HttpCode(201)
  register(@Body() dto: RegisterGroupDto): Promise<RegisterGroupResponseDto> {
    return this.groupsService.createGroup(dto);
  }

  @Patch('callback')
  @UseGuards(ApiKeyGuard)
  updateCallback(
    @Body() dto: UpdateCallbackDto,
    @CurrentGroup() group: StudentGroup,
  ): Promise<UpdateCallbackResponseDto> {
    return this.groupsService.updateCallbackUrl(group, dto.callbackUrl);
  }
}
