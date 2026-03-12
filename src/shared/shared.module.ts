import { Global, Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { ApiKeyGuard } from './guards/api-key.guard';

@Global()
@Module({
  imports: [GroupsModule],
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class SharedModule {}
