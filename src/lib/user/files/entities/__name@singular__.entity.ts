<% if (isMikroOrm) { %><% if (db === 'mongodb') { %>import { ObjectId } from 'mongodb';
<% } %>import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class <%= singular(classify(name)) %> {
<% if (db === 'mongodb') { %>  @PrimaryKey()
  _id!: ObjectId;
<% } else { %>  @PrimaryKey()
  id!: number;
<% } %>

  @Property({ unique: true })
  username!: string;

  @Property({ unique: true })
  email!: string;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Property()
  phoneNumber!: string;

  @Property({ hidden: true })
  password!: string;
}<% } else if (isSequelize) { %>import * as argon2 from 'argon2';
import { BeforeCreate, Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  defaultScope: { attributes: { exclude: ['password'] } },
  scopes: { withPassword: { attributes: { include: ['password'] } } },
})
export class <%= singular(classify(name)) %> extends Model<<%= singular(classify(name)) %>> {
  @Column({ type: DataType.STRING(255), unique: true })
  username!: string;

  @Column({ type: DataType.STRING(255), unique: true })
  email!: string;

  @Column({ type: DataType.STRING(255) })
  firstName!: string;

  @Column({ type: DataType.STRING(255) })
  lastName!: string;

  @Column({ type: DataType.STRING(255) })
  phoneNumber!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  password!: string;

  @BeforeCreate
  static async hashPassword(<%= lowercased(singular(classify(name))) %>: <%= singular(classify(name)) %>, _options: unknown) {
    <%= lowercased(singular(classify(name))) %>.dataValues.password = await argon2.hash(<%= lowercased(singular(classify(name))) %>.dataValues.password);
  }
}<% } else { %><% if (type === 'graphql-code-first') { %>import { ObjectType, Field, <% if (db === 'mongodb') { %>ID<% } else { %>Int<% } %> } from '@nestjs/graphql';
<% } %>import * as argon2 from 'argon2';
<% if (db === 'mongodb') { %>import { ObjectId } from 'mongodb';
<% } %>import { BeforeInsert, Column, Entity, <% if (db === 'mongodb') { %>Index, ObjectIdColumn<% } else { %>PrimaryGeneratedColumn<% } %> } from 'typeorm';

<% if (type === 'graphql-code-first') { %>@ObjectType()
<% } %>@Entity()
export class <%= singular(classify(name)) %> {
<% if (type === 'graphql-code-first') { %>  @Field(() => <% if (db === 'mongodb') { %>ID<% } else { %>Int<% } %>)
<% } %>  @<% if (db === 'mongodb') { %>ObjectIdColumn()
  id!: ObjectId;<% } else { %>PrimaryGeneratedColumn()
  id!: number;<% } %>

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %><% if (db === 'mongodb') { %>  @Index({ unique: true })
  @Column()
<% } else { %>  @Column({ unique: true })
<% } %>  username!: string;

<% if (type === 'graphql-code-first') { %>  @Field()
<% } %><% if (db === 'mongodb') { %>  @Index({ unique: true })
  @Column()
<% } else { %>  @Column({ unique: true })
<% } %>  email!: string;

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
}<% } %>
