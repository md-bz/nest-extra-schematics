<% if (isDrizzle) { %><% if (db === 'postgres') { %>import { integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
<% } else if (db === 'sqlite') { %>import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
<% } else { %>import { int, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';
<% } %>
export const <%= plural(lowercased(name)) %> = <% if (db === 'postgres') { %>pgTable<% } else if (db === 'sqlite') { %>sqliteTable<% } else { %>mysqlTable<% } %>('<%= underscore(lowercased(name)) %>', {
  id: <% if (db === 'postgres') { %>integer('id').primaryKey().generatedAlwaysAsIdentity()<% } else if (db === 'sqlite') { %>integer('id').primaryKey({ autoIncrement: true })<% } else { %>int('id').autoincrement().primaryKey()<% } %>,
  username: <% if (db === 'sqlite') { %>text('username')<% } else { %>varchar('username', { length: 255 })<% } %>.notNull().unique(),
  email: <% if (db === 'sqlite') { %>text('email')<% } else { %>varchar('email', { length: 255 })<% } %>.notNull().unique(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  phoneNumber: text('phoneNumber').notNull(),
  password: text('password').notNull(),
});

export type <%= singular(classify(name)) %> = typeof <%= plural(lowercased(name)) %>.$inferSelect;
export type New<%= singular(classify(name)) %> = typeof <%= plural(lowercased(name)) %>.$inferInsert;
<% } else { %><% if (type === 'graphql-code-first') { %>import { ObjectType, Field, ID } from '@nestjs/graphql';
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
});<% } %>
