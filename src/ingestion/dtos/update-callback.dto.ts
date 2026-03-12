import { IsUrl } from 'class-validator';

export class UpdateCallbackDto {
  @IsUrl()
  callbackUrl: string;
}
