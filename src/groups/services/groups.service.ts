import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentGroup } from '../entities/student-group.entity';
import { RegisterGroupDto } from '../dtos/register-group.dto';
import { RegisterGroupResponseDto } from '../dtos/register-group-response.dto';
import * as crypto from 'crypto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(StudentGroup)
    private readonly studentGroupRepository: Repository<StudentGroup>,
  ) {}

  async createGroup(dto: RegisterGroupDto): Promise<RegisterGroupResponseDto> {
    const clientSecret = crypto.randomBytes(32).toString('hex');

    const apiKey = crypto.randomUUID();

    const group = this.studentGroupRepository.create({
      groupName: dto.groupName,
      callbackUrl: dto.callbackUrl,
      apiKey,
    });

    const savedGroup = await this.studentGroupRepository.save(group);

    //todo: mover para que el controller arme el dto response.
    return { apiKey: savedGroup.apiKey, clientSecret };
  }

  async findByApiKey(apiKey: string): Promise<StudentGroup | null> {
    return this.studentGroupRepository.findOneBy({ apiKey });
  }
}
