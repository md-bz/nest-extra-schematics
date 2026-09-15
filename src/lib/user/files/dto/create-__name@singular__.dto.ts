import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class Create<%= singular(classify(name)) %>Dto {
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phoneNumber!: string;

  @IsStrongPassword()
  password!: string;
}
