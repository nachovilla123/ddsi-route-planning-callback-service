import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutingRequest } from '../entities/routing-request.entity';
import { PlanRouteDto } from '../dtos/plan-route.dto';
import { PlanRouteResponseDto } from '../dtos/plan-route-response.dto';
import { UpdateCallbackResponseDto } from '../dtos/update-callback-response.dto';
import { StudentGroup } from '../../groups/entities/student-group.entity';
import { RoutingStatus } from '../entities/routing-status.enum';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(RoutingRequest)
    private readonly requestsRepo: Repository<RoutingRequest>,
    @InjectRepository(StudentGroup)
    private readonly groupsRepo: Repository<StudentGroup>,
  ) {}

  async saveRoutingRequest(
    dto: PlanRouteDto,
    apiKey: string,
  ): Promise<PlanRouteResponseDto> {
    const existing = await this.requestsRepo.findOneBy({ id: dto.requestId });
    if (existing) {
      throw new ConflictException(`requestId ${dto.requestId} already exists`);
    }

    const request = this.requestsRepo.create({
      id: dto.requestId,
      apiKey,
      payload: dto as unknown as Record<string, unknown>,
      status: RoutingStatus.PENDING,
    });
    const saved = await this.requestsRepo.save(request);

    return { requestId: saved.id, status: saved.status };
  }

  async updateCallbackUrl(
    apiKey: string,
    callbackUrl: string,
  ): Promise<UpdateCallbackResponseDto> {
    await this.groupsRepo.update({ id: apiKey }, { callbackUrl });
    return { callbackUrl };
  }
}
