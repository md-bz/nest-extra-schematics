<% if (identifier === 'email') { %>import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
<% } else { %>import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  <%= identifier %>!: string;

  @IsString()
  password!: string;
}
<% } %>