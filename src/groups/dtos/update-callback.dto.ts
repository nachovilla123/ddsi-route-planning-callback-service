import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCallbackDto {
  @ApiProperty({
    example: 'https://api.miproyecto.com/v1/webhook',
    description: 'Nueva URL de callback',
  })
  @IsNotEmpty()
  @IsUrl(
    { require_protocol: true, protocols: ['https'] },
    { message: 'La URL de callback debe ser válida y utilizar HTTPS.' },
  )
  callbackUrl: string;
}
