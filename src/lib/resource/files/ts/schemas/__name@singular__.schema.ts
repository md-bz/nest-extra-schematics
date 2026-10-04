<% if (isDrizzle) { %><%= schemaImport %>
export const <%= plural(lowercased(name)) %> = <%= tableFn %>('<%= underscore(lowercased(name)) %>', {
  id: <%= idColumn %>,
<%= drizzleBody %>});

export type <%= singular(classify(name)) %> = typeof <%= plural(lowercased(name)) %>.$inferSelect;
export type New<%= singular(classify(name)) %> = typeof <%= plural(lowercased(name)) %>.$inferInsert;
<% } else { %><% if (type === 'graphql-code-first') { %>import { <%= graphqlDecorators %> } from '@nestjs/graphql';
<% } %>import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type <%= singular(classify(name)) %>Document = HydratedDocument<<%= singular(classify(name)) %>>;

<% if (type === 'graphql-code-first') { %>@ObjectType()
<% } %>@Schema()
export class <%= singular(classify(name)) %> {
<% if (type === 'graphql-code-first') { %>  @Field(() => ID)
  id!: string;

<% } %><%= mongooseBody %>}

export const <%= singular(classify(name)) %>Schema = SchemaFactory.createForClass(<%= singular(classify(name)) %>);<% } %>
