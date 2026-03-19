import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterGroupDto {
  @ApiProperty({ example: 'grupo_1', description: 'Nombre del grupo' })
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @ApiProperty({
    example: 'http://localhost:3001/webhook',
    description: 'URL a la que se enviaran las rutas planificadas',
  })
  @IsNotEmpty()
  @IsUrl(
    { require_protocol: true, protocols: ['https'] },
    { message: 'La URL de callback debe ser válida y utilizar HTTPS.' },
  )
  callbackUrl: string;
}
