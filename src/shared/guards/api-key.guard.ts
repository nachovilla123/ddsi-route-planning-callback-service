import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { GroupsService } from '../../groups/services/groups.service';
import { StudentGroup } from '../../groups/entities/student-group.entity';
import { isUUID } from 'class-validator';

interface RequestWithGroup extends Request {
  group: StudentGroup;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly groupsService: GroupsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithGroup>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    //7 es el largo de "Bearer "
    const apiKey = authHeader.slice(7);

    if (!isUUID(apiKey)) {
      throw new UnauthorizedException('Invalid API key format');
    }

    const group = await this.groupsService.findByApiKey(apiKey);

    if (!group) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.group = group;
    return true;
  }
}
