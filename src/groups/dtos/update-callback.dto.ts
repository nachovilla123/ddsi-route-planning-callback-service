import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCallbackDto {
  @ApiProperty({
    example: 'http://localhost:3001/webhook',
    description: 'Nueva URL de callback',
  })
  @IsUrl({ require_tld: false })
  callbackUrl: string;
}
