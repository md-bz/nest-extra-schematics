import { Create<%= singular(classify(name)) %>Input } from './create-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';<% if (type === 'graphql-code-first') { %>
import { InputType, Field, <% if ((isMongoose || (isTypeOrm && db === 'mongodb'))) { %>ID<% } else { %>Int<% } %>, PartialType } from '@nestjs/graphql';

@InputType()
export class Update<%= singular(classify(name)) %>Input extends PartialType(Create<%= singular(classify(name)) %>Input) {
  @Field(() => <% if ((isMongoose || (isTypeOrm && db === 'mongodb'))) { %>ID<% } else { %>Int<% } %>)
  id!: <% if ((isMongoose || (isTypeOrm && db === 'mongodb'))) { %>string<% } else { %>number<% } %>;
}<% } else { %>
import { PartialType } from '@nestjs/mapped-types';

export class Update<%= singular(classify(name)) %>Input extends PartialType(Create<%= singular(classify(name)) %>Input) {
  id!: <% if ((isMongoose || (isTypeOrm && db === 'mongodb'))) { %>string<% } else { %>number<% } %>;
}<% } %>
