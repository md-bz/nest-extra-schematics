<% if (identifier === 'email') { %>import { IsEmail } from 'class-validator';

export class RequestCodeDto {
  @IsEmail()
  email!: string;
}
<% } else { %>import { IsString } from 'class-validator';

export class RequestCodeDto {
  @IsString()
  <%= identifier %>!: string;
}
<% } %>
