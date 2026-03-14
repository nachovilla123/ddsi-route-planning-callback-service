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
  @IsUrl({ require_tld: false })
  callbackUrl: string;
}
