import { IsString, IsUrl } from 'class-validator';

export class RegisterGroupDto {
  // this should be something like: grupo_1
  @IsString()
  groupName: string;

  //? DOCS:  address to which the route generator will send the planned routes for this group
  @IsUrl()
  callbackUrl: string;
}
