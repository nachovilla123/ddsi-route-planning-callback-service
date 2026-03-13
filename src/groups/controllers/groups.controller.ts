import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { GroupsService } from '../services/groups.service';
import { RegisterGroupDto } from '../dtos/register-group.dto';
import { RegisterGroupResponseDto } from '../dtos/register-group-response.dto';

@Controller()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('register')
  @HttpCode(201)
  register(@Body() dto: RegisterGroupDto): Promise<RegisterGroupResponseDto> {
    return this.groupsService.createGroup(dto);
  }
}
