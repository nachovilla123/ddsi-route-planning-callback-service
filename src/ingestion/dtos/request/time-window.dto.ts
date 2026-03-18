import { IsDateString, IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class TimeWindowDto {
  @ApiProperty({
    example: '2025-09-21T09:00:00Z',
    description: 'Fecha y hora de inicio de la jornada (Formato ISO-8601 UTC)',
  })
  @IsDateString()
  @IsNotEmpty()
  start: string;

  @ApiProperty({
    example: '2025-09-21T18:00:00Z',
    description: 'Fecha y hora de fin de la jornada (Formato ISO-8601 UTC)',
  })
  @IsDateString()
  @IsNotEmpty()
  end: string;
}
