import { <%= validatorImports %> } from 'class-validator';

export class Create<%= singular(classify(name)) %>Dto {
<%= dtoBody %>}
