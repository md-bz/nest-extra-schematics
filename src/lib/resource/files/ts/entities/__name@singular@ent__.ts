<% if (isMikroOrm) { %><% if (db === 'mongodb') { %>import { ObjectId } from 'mongodb';
<% } %>import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class <%= singular(classify(name)) %> {
<% if (db === 'mongodb') { %>  @PrimaryKey()
  _id!: ObjectId;
<% } else { %>  @PrimaryKey()
  id!: number;
<% } %>
<%= entityBody %>}<% } else if (isSequelize) { %>import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class <%= singular(classify(name)) %> extends Model<<%= singular(classify(name)) %>> {
<%= entityBody %>}<% } else if (isTypeOrm && db !== 'mongodb') { %>import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class <%= singular(classify(name)) %> {
  @PrimaryGeneratedColumn()
  id!: number;

<%= entityBody %>}<% } else if (isTypeOrm) { %>import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity()
export class <%= singular(classify(name)) %> {
  @ObjectIdColumn()
  id!: ObjectId;

<%= entityBody %>}<% } else if (type === 'graphql-code-first') { %>import { <%= graphqlDecorators %> } from '@nestjs/graphql';

@ObjectType()
export class <%= singular(classify(name)) %> {
<%= graphqlBody %>}<% } else { %>export class <%= singular(classify(name)) %> {}<% } %>
