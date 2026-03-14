import { ApiProperty } from '@nestjs/swagger';

export class RegisterGroupResponseDto {
  @ApiProperty({ description: 'API key para autenticacion (Bearer token)' })
  apiKey: string;

  @ApiProperty({
    description: 'Secret para verificar la firma HMAC de los webhooks',
  })
  clientSecret: string;
}
