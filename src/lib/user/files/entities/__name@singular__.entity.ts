<% if (type === 'graphql-code-first') { %>import { ObjectType, Field, ID } from '@nestjs/graphql';
<% } %>import * as argon2 from 'argon2';
import { ObjectId } from 'mongodb';
import { BeforeInsert, Column, Entity, ObjectIdColumn } from 'typeorm';

<% if (type === 'graphql-code-first') { %>@ObjectType()
<% } %>@Entity()
export class <%= singular(classify(name)) %> {
<% if (type === 'graphql-code-first') { %>  @Field(() => ID)
<% } %>  @ObjectIdColumn()
  id!: ObjectId;

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
