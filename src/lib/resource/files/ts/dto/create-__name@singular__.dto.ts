import { IsString } from 'class-validator';

export class Create<%= singular(classify(name)) %>Dto {
  @IsString()
  exampleField!: string;
}
