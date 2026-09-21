import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Create<%= singular(classify(name)) %>Dto } from './create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';

export class Update<%= singular(classify(name)) %>Dto extends OmitType(
  PartialType(Create<%= singular(classify(name)) %>Dto),
  ['password'],
) {<% if ((type === 'microservice' || type === 'ws') && crud) { %>
  id!: <% if (isMongoose || (isTypeOrm && db === 'mongodb')) { %>string<% } else { %>number<% } %>;
<% }%>}
