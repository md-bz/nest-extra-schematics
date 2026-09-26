<% if (isCode) { %><% if (identifier === 'email') { %>import { IsEmail, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @Length(6, 6)
  code!: string;
}
<% } else { %>import { IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  <%= identifier %>!: string;

  @Length(6, 6)
  code!: string;
}
<% } %><% } else { %><% if (identifier === 'email') { %>import { IsEmail, IsString } from 'class-validator';

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
<% } %><% } %>
