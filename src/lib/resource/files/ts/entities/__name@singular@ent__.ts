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
<% } else if (isTypeOrm && db !== 'mongodb') { %>import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class <%= singular(classify(name)) %> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  exampleField!: string;
}<% } else if (isTypeOrm) { %>import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity()
export class <%= singular(classify(name)) %> {
  @ObjectIdColumn()
  id!: ObjectId;

  @Column()
  exampleField!: string;
}<% } else if (type === 'graphql-code-first') { %>import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class <%= singular(classify(name)) %> {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField!: number;
}<% } else { %>export class <%= singular(classify(name)) %> {}<% } %>
