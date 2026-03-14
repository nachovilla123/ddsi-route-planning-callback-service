import { ApiProperty } from '@nestjs/swagger';

export class UpdateCallbackResponseDto {
  @ApiProperty({ description: 'URL de callback actualizada' })
  callbackUrl: string;
}
