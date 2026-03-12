import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyGuard } from './guards/api-key.guard';
import { StudentGroup } from '../groups/entities/student-group.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([StudentGroup])],
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class SharedModule {}
