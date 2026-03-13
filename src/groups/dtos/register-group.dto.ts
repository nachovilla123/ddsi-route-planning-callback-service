import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class RegisterGroupDto {
  // this should be something like: grupo_1
  @IsString()
  @IsNotEmpty()
  groupName: string;

  //? DOCS:  address to which the route generator will send the planned routes for this group
  @IsUrl({ require_tld: false })
  callbackUrl: string;
}
