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
<% } else { %><% if (type === 'graphql-code-first') { %>import { ObjectType, Field, <% if (db === 'mongodb') { %>ID<% } else { %>Int<% } %> } from '@nestjs/graphql';
<% } %>import * as argon2 from 'argon2';
<% if (db === 'mongodb') { %>import { ObjectId } from 'mongodb';
<% } %>import { BeforeInsert, Column, Entity, <% if (db === 'mongodb') { %>ObjectIdColumn<% } else { %>PrimaryGeneratedColumn<% } %> } from 'typeorm';

<% if (type === 'graphql-code-first') { %>@ObjectType()
<% } %>@Entity()
export class <%= singular(classify(name)) %> {
<% if (type === 'graphql-code-first') { %>  @Field(() => <% if (db === 'mongodb') { %>ID<% } else { %>Int<% } %>)
<% } %>  @<% if (db === 'mongodb') { %>ObjectIdColumn()
  id!: ObjectId;<% } else { %>PrimaryGeneratedColumn()
  id!: number;<% } %>

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Column({ unique: true })
  username!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Column({ unique: true })
  email!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Column()
  firstName!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Column()
  lastName!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Column()
  phoneNumber!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %>  @Column({ select: false })
  password!: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await argon2.hash(this.password);
  }
}
<% } %>
