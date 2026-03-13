import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutingRequest } from '../entities/routing-request.entity';
import { PlanRouteDto } from '../dtos/request/plan-route.dto';
import { PlanRouteResponseDto } from '../dtos/response/plan-route-response.dto';
import { UpdateCallbackResponseDto } from '../dtos/response/update-callback-response.dto';
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
    groupId: string,
  ): Promise<PlanRouteResponseDto> {
    const existing = await this.requestsRepo.findOneBy({ id: dto.requestId });
    if (existing) {
      return { requestId: existing.id, status: existing.status };
    }

    const request = this.requestsRepo.create({
      id: dto.requestId,
      groupId: groupId,
      payload: {
        warehouse: dto.warehouse,
        deliveries: dto.deliveries,
        trucks: dto.trucks,
      },
      status: RoutingStatus.PENDING,
    });
    const saved = await this.requestsRepo.save(request);

    return { requestId: saved.id, status: saved.status };
  }

  //? DOCS: esto permite actualizar la callback del webhook, se utilizan los guards para buscar el grupo.
  async updateCallbackUrl(
    group: StudentGroup,
    callbackUrl: string,
  ): Promise<UpdateCallbackResponseDto> {
    await this.groupsRepo.update({ id: group.id }, { callbackUrl });

    return { callbackUrl };
  }
}
