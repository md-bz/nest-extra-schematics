<% if (type === 'graphql-code-first') { %>import { ObjectType, Field, ID } from '@nestjs/graphql';
<% } %>import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type <%= singular(classify(name)) %>Document = HydratedDocument<<%= singular(classify(name)) %>>;

<% if (type === 'graphql-code-first') { %>@ObjectType()
<% } %>@Schema()
export class <%= singular(classify(name)) %> {
<% if (type === 'graphql-code-first') { %>  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
<% } %>  @Prop()
  exampleField!: string;
}

export const <%= singular(classify(name)) %>Schema = SchemaFactory.createForClass(<%= singular(classify(name)) %>);
