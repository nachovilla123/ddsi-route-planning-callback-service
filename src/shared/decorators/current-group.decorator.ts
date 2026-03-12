import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { StudentGroup } from '../../groups/entities/student-group.entity';

// https://docs.nestjs.com/custom-decorators#param-decorators
export const CurrentGroup = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): StudentGroup => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { group: StudentGroup }>();
    return request.group;
  },
);
