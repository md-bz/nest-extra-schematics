<% if (isDrizzle) { %><% if (db === 'postgres') { %>import { integer, pgTable, text } from 'drizzle-orm/pg-core';
<% } else if (db === 'sqlite') { %>import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
<% } else { %>import { int, mysqlTable, text } from 'drizzle-orm/mysql-core';
<% } %>
export const <%= plural(lowercased(name)) %> = <% if (db === 'postgres') { %>pgTable<% } else if (db === 'sqlite') { %>sqliteTable<% } else { %>mysqlTable<% } %>('<%= underscore(lowercased(name)) %>', {
  id: <% if (db === 'postgres') { %>integer('id').primaryKey().generatedAlwaysAsIdentity()<% } else if (db === 'sqlite') { %>integer('id').primaryKey({ autoIncrement: true })<% } else { %>int('id').autoincrement().primaryKey()<% } %>,
  exampleField: text('exampleField').notNull(),
});

export type <%= singular(classify(name)) %> = typeof <%= plural(lowercased(name)) %>.$inferSelect;
export type New<%= singular(classify(name)) %> = typeof <%= plural(lowercased(name)) %>.$inferInsert;
<% } else { %><% if (type === 'graphql-code-first') { %>import { ObjectType, Field, ID } from '@nestjs/graphql';
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

export const <%= singular(classify(name)) %>Schema = SchemaFactory.createForClass(<%= singular(classify(name)) %>);<% } %>
