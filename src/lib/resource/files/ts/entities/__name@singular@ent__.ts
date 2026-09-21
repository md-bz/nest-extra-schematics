<% if (isTypeOrm && db !== 'mongodb') { %>import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
