<% if (type === 'graphql-code-first') { %>import { ObjectType, Field, ID } from '@nestjs/graphql';
<% } %>import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as argon2 from 'argon2';

export type <%= singular(classify(name)) %>Document = HydratedDocument<<%= singular(classify(name)) %>>;

<% if (type === 'graphql-code-first') { %>@ObjectType()
<% } %>@Schema({ timestamps: true })
export class <%= singular(classify(name)) %> {
<% if (type === 'graphql-code-first') { %>  @Field(() => ID)
  id!: string;

<% } %><% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Prop({ required: true, unique: true })
  username!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Prop({ required: true, unique: true })
  email!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Prop({ required: true })
  firstName!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Prop({ required: true })
  lastName!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Prop({ required: true })
  phoneNumber!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Prop({ required: true, select: false })
  password!: string;
}

export const <%= singular(classify(name)) %>Schema = SchemaFactory.createForClass(<%= singular(classify(name)) %>);

<%= singular(classify(name)) %>Schema.pre('save', async function ( this: <%= singular(classify(name)) %>Document) {
  if (this.isModified('password')) {
    this.password = await argon2.hash(this.password);
  }
});
