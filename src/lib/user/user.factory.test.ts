import { HostTree } from '@angular-devkit/schematics';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import type { UserOptions } from './user.schema.js';
import { resolveOutputPaths } from './user.factory.js';

describe('User Factory', () => {
  const runner: SchematicTestRunner = new SchematicTestRunner(
    '.',
    path.join(process.cwd(), 'src/collection.json'),
  );

  it('should generate a users mongoose resource', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      db: 'mongodb',
      orm: 'mongoose',
    });
    expect(tree.files).toEqual([
      '/users/users.controller.spec.ts',
      '/users/users.controller.ts',
      '/users/users.module.ts',
      '/users/users.service.spec.ts',
      '/users/users.service.ts',
      '/users/dto/create-user.dto.ts',
      '/users/dto/update-user.dto.ts',
      '/users/dto/change-password.dto.ts',
      '/users/schemas/user.schema.ts',
    ]);
    expect(tree.readContent('/users/users.module.ts')).toContain(
      'MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])',
    );
    expect(tree.readContent('/users/users.module.ts')).toContain(
      'exports: [UsersService]',
    );
  });

  it('should generate a user schema with argon2 password hashing', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      db: 'mongodb',
      orm: 'mongoose',
    });
    const schema = tree.readContent('/users/schemas/user.schema.ts');
    expect(schema).toContain('@Prop({ required: true, unique: true })');
    expect(schema).toContain('@Prop({ required: true, select: false })');
    expect(schema).toContain('username!: string;');
    expect(schema).toContain('firstName!: string;');
    expect(schema).toContain('lastName!: string;');
    expect(schema).toContain('phoneNumber!: string;');
    expect(schema).toContain("UserSchema.pre('save'");
    expect(schema).toContain('argon2.hash(this.password)');
    expect(schema).toContain("isModified('password')");
  });

  it('should generate user dtos with email and password', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      db: 'mongodb',
      orm: 'mongoose',
    });
    const createDto = tree.readContent('/users/dto/create-user.dto.ts');
    expect(createDto).toContain('username!: string;');
    expect(createDto).toContain('email!: string;');
    expect(createDto).toContain('password!: string;');
    expect(createDto).toContain('firstName!: string;');
    expect(createDto).toContain('lastName!: string;');
    expect(createDto).toContain('phoneNumber!: string;');
    expect(createDto).toContain('@IsEmail()');
    expect(createDto).toContain('@IsStrongPassword()');
    const updateDto = tree.readContent('/users/dto/update-user.dto.ts');
    expect(updateDto).toContain('OmitType(');
    expect(updateDto).toContain('PartialType(CreateUserDto)');
    expect(updateDto).toContain("['password']");
    expect(updateDto).not.toContain('password!: string');
  });

  it('should generate a change password route with current password check', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      db: 'mongodb',
      orm: 'mongoose',
    });
    const changeDto = tree.readContent('/users/dto/change-password.dto.ts');
    expect(changeDto).toContain('currentPassword!: string;');
    expect(changeDto).toContain('@IsStrongPassword()');
    const controller = tree.readContent('/users/users.controller.ts');
    expect(controller).toContain("@Patch(':id/password')");
    expect(controller).toContain('changePassword');
    const service = tree.readContent('/users/users.service.ts');
    expect(service).toContain('async changePassword(id: string');
    expect(service).toContain("select('+password')");
    expect(service).toContain('argon2.verify(');
    expect(service).toContain('UnauthorizedException');
    expect((service.match(/new ConflictException/g) ?? []).length).toBe(2);
  });

  it('should expose email/username finders for auth login', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      db: 'mongodb',
      orm: 'mongoose',
    });
    const service = tree.readContent('/users/users.service.ts');
    expect(service).toContain('findByEmail(email: string)');
    expect(service).toContain('findByUsername(username: string)');
    expect(service).toContain("select('+password')");
  });

  it('should generate a typeorm user resource with entity instead of schema', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      db: 'mongodb',
      orm: 'typeorm',
    });
    expect(tree.exists('/users/entities/user.entity.ts')).toBe(true);
    expect(tree.exists('/users/schemas/user.schema.ts')).toBe(false);
    const entity = tree.readContent('/users/entities/user.entity.ts');
    expect(entity).toContain('@ObjectIdColumn()');
    expect(entity).toContain('id!: ObjectId;');
    expect(entity).toContain('Index, ObjectIdColumn');
    expect(entity).toContain('username!: string;');
    expect((entity.match(/@Index\(\{ unique: true \}\)/g) ?? []).length).toBe(
      2,
    );
    expect(entity).not.toContain('@Column({ unique: true })');
    expect(entity).toContain('@Column({ select: false })');
    expect(entity).toContain('password!: string;');
    expect(entity).toContain('@BeforeInsert()');
    expect(entity).toContain('argon2.hash(this.password)');
    const module = tree.readContent('/users/users.module.ts');
    expect(module).toContain('TypeOrmModule.forFeature([User])');
    expect(module).toContain('exports: [UsersService]');
    expect(module).not.toContain('MongooseModule');
    const service = tree.readContent('/users/users.service.ts');
    expect(service).toContain(
      '@InjectRepository(User) private userRepository: MongoRepository<User>',
    );
    expect(service).not.toContain('findOneBy(');
    expect(service).toContain('where: { id: new ObjectId(id) }');
    expect(service).toContain(
      'this.userRepository.find({ select: publicSelect })',
    );
    expect((service.match(/select: publicSelect/g) ?? []).length).toBe(2);
    expect(
      (service.match(/\.\.\.publicSelect, password: true/g) ?? []).length,
    ).toBe(3);
    expect((service.match(/projection: \{ password: 0 \}/g) ?? []).length).toBe(
      2,
    );
    expect(service).toContain(
      'this.userRepository.save(this.userRepository.create(createUserDto))',
    );
    expect(service).toContain('findByEmail(email: string)');
    expect(service).toContain('password: true');
    expect(service).toContain('argon2.hash(changePasswordDto.password)');
    expect(service).toContain('findOneAndUpdate(');
    expect(service).toContain('{ $set: updateUserDto }');
    expect(service).toContain(
      'findOneAndDelete({ _id: new ObjectId(id) }, { projection: { password: 0 } })',
    );
    expect(service).toContain(
      'throw new NotFoundException(`User with ID ${id} not found`);',
    );
    expect(service).not.toContain('findByIdAndUpdate');
    expect((service.match(/new ConflictException/g) ?? []).length).toBe(2);
    expect(tree.readContent('/users/dto/update-user.dto.ts')).toContain(
      'OmitType(',
    );
    const controller = tree.readContent('/users/users.controller.ts');
    expect(controller).toContain("@Patch(':id/password')");
    expect(controller).toContain('changePassword');
  });

  it('should generate a sqlite user resource with numeric ids', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      db: 'sqlite',
      orm: 'typeorm',
    });
    expect(tree.exists('/users/entities/user.entity.ts')).toBe(true);
    expect(tree.exists('/users/schemas/user.schema.ts')).toBe(false);
    const entity = tree.readContent('/users/entities/user.entity.ts');
    expect(entity).toContain('@PrimaryGeneratedColumn()');
    expect(entity).toContain('id!: number;');
    expect(entity).toContain('@Column({ unique: true })');
    expect(entity).not.toContain('@Index(');
    expect(entity).toContain('@BeforeInsert()');
    expect(entity).toContain('argon2.hash(this.password)');
    expect(entity).not.toContain('mongodb');
    const service = tree.readContent('/users/users.service.ts');
    expect(service).toContain(
      '@InjectRepository(User) private userRepository: Repository<User>',
    );
    expect(service).toContain('findOneBy({ id })');
    expect(service).toContain(
      'this.userRepository.save(this.userRepository.create(createUserDto))',
    );
    expect(service).toContain('.preload({ id, ...updateUserDto })');
    expect(service).toContain('async findOne(id: number)');
    expect(service).toContain('async changePassword(id: number,');
    expect(service).toContain('argon2.hash(changePasswordDto.password)');
    expect(service).not.toContain('ObjectId');
    expect(service).not.toContain('MongoRepository');
    expect((service.match(/new ConflictException/g) ?? []).length).toBe(2);
    const controller = tree.readContent('/users/users.controller.ts');
    expect(controller).toContain('findOne(+id)');
    expect(controller).toContain('changePassword(+id,');
  });

  it('should not add a password route off the rest mongoose path', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      type: 'microservice',
      db: 'mongodb',
      orm: 'mongoose',
    });
    const controller = tree.readContent('/users/users.controller.ts');
    const service = tree.readContent('/users/users.service.ts');
    expect(controller).not.toContain('changePassword');
    expect(service).not.toContain('changePassword');
    expect(tree.exists('/users/dto/change-password.dto.ts')).toBe(false);
    expect(tree.readContent('/users/users.module.ts')).not.toContain(
      'exports:',
    );
    expect(tree.readContent('/users/dto/update-user.dto.ts')).toContain(
      'OmitType(',
    );
  });

  it('should honor an explicit name', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      name: 'admins',
      db: 'mongodb',
      orm: 'mongoose',
    });
    expect(tree.exists('/admins/schemas/admin.schema.ts')).toBe(true);
    expect(tree.exists('/admins/entities/admin.entity.ts')).toBe(false);
    expect(tree.readContent('/admins/schemas/admin.schema.ts')).toContain(
      'argon2.hash(this.password)',
    );
    expect(tree.readContent('/admins/schemas/admin.schema.ts')).toContain(
      'export class Admin',
    );
  });

  it('should not stamp the user schema without mongoose', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      db: 'none',
      orm: 'none',
    });
    expect(tree.exists('/users/entities/user.entity.ts')).toBe(true);
    expect(tree.exists('/users/schemas/user.schema.ts')).toBe(false);
    expect(tree.readContent('/users/entities/user.entity.ts')).not.toContain(
      'ObjectIdColumn',
    );
    expect(tree.exists('/users/dto/change-password.dto.ts')).toBe(false);
    expect(tree.readContent('/users/dto/update-user.dto.ts')).not.toContain(
      'OmitType',
    );
  });

  it('should not generate a schema without crud', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      crud: false,
    });
    expect(tree.exists('/users/schemas/user.schema.ts')).toBe(false);
  });

  it('should reject the unsupported "fields" option', async () => {
    await expect(
      runner.runSchematic('user', {
        // ponytail: UserOptions omits "fields", but a stray flag still arrives
        // at runtime and would be silently dropped
        fields: 'nickname:string',
      } as unknown as UserOptions),
    ).rejects.toThrow(/does not support the "fields" option/);
  });

  it('should reject "db" without "orm", like resource does', async () => {
    await expect(
      runner.runSchematic('user', { db: 'postgres' }),
    ).rejects.toThrow(/Option "db" requires "orm" as well/);
  });

  it('should reject "orm" without "db", like resource does', async () => {
    await expect(
      runner.runSchematic('user', { orm: 'typeorm' }),
    ).rejects.toThrow(/Option "orm" requires "db" as well/);
  });

  it('should ignore an empty "fields" option', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      fields: '',
      db: 'mongodb',
      orm: 'mongoose',
    } as unknown as UserOptions);
    expect(tree.exists('/users/schemas/user.schema.ts')).toBe(true);
  });

  it('should pre-empt the nested resource "fields" prompt', async () => {
    // the nested schematic shares the prompt provider, so an unset "fields"
    // would still ask the user. Prompts do not run in tests, so assert the
    // value the nested call receives instead: with no spec it must resolve to
    // the placeholder body, never a field list.
    const tree: UnitTestTree = await runner.runSchematic('user', {
      orm: 'typeorm',
      db: 'postgres',
    });
    const entity = tree.readContent('/users/entities/user.entity.ts');
    expect(entity).toContain('username!: string;');
    expect(entity).not.toContain('exampleField');
  });

  it('should generate a drizzle user without hooks', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      db: 'postgres',
      orm: 'drizzle',
    });
    expect(tree.exists('/users/schemas/user.schema.ts')).toBe(true);
    expect(tree.exists('/users/entities/user.entity.ts')).toBe(false);
    const schema = tree.readContent('/users/schemas/user.schema.ts');
    expect(schema).toContain("export const users = pgTable('users', {");
    expect(schema).toContain("password: text('password').notNull()");
    expect(schema).not.toContain('@BeforeInsert()');
    const service = tree.readContent('/users/users.service.ts');
    expect(service).toContain(
      '@InjectDrizzle() private readonly db: NodePgDatabase',
    );
    expect(service).toContain(
      'password: await argon2.hash(createUserDto.password)',
    );
    expect(service).toContain('async changePassword(id: number,');
    expect(service).toContain('argon2.hash(changePasswordDto.password)');
    expect(service).toContain(
      'async findByEmail(email: string): Promise<User | null>',
    );
    expect(service).not.toContain('this.userRepository');
    expect((service.match(/new ConflictException/g) ?? []).length).toBe(2);
    expect(service).toContain('e?.cause?.code');
    expect(service).toContain('select(publicUserColumns)');
    expect(service).not.toContain('password: users.password');
    expect(tree.readContent('drizzle.config.ts')).toContain(
      './users/schemas/user.schema.ts',
    );
    const module = tree.readContent('/users/users.module.ts');
    expect(module).not.toContain('forFeature');
    expect(module).not.toContain('MongooseModule');
    expect(tree.readContent('/users/dto/update-user.dto.ts')).toContain(
      "['password']",
    );
    const controller = tree.readContent('/users/users.controller.ts');
    expect(controller).toContain('findOne(+id)');
    expect(controller).toContain('changePassword(+id,');
  });

  it('should use $returningId for a mysql drizzle user', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      orm: 'drizzle',
      db: 'mysql',
    });
    expect(tree.readContent('/users/schemas/user.schema.ts')).toContain(
      "mysqlTable('users', {",
    );
    expect(tree.readContent('/users/users.service.ts')).toContain(
      '$returningId()',
    );
  });

  it('should generate a mikroorm user with a hidden password and no hooks', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      db: 'postgres',
      orm: 'mikroorm',
    });
    expect(tree.exists('/users/entities/user.entity.ts')).toBe(true);
    expect(tree.exists('/users/schemas/user.schema.ts')).toBe(false);
    const entity = tree.readContent('/users/entities/user.entity.ts');
    expect(entity).toContain(
      "import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';",
    );
    expect(entity).toContain('@PrimaryKey()');
    expect(entity).toContain('id!: number;');
    expect(
      (entity.match(/@Property\(\{ unique: true \}\)/g) ?? []).length,
    ).toBe(2);
    expect(entity).toContain('@Property({ hidden: true })');
    expect(entity).toContain('password!: string;');
    expect(entity).not.toContain('argon2');
    expect(entity).not.toContain('@BeforeInsert');
    const service = tree.readContent('/users/users.service.ts');
    expect(service).toContain(
      "import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';",
    );
    expect(service).toContain(
      'password: await argon2.hash(createUserDto.password)',
    );
    expect(service).toContain('async changePassword(id: number,');
    expect(service).toContain('argon2.verify(');
    expect(service).toContain('UnauthorizedException');
    expect(service).toContain('findByEmail(email: string)');
    expect(service).toContain('this.em.assign(user, updateUserDto);');
    expect(service).toContain('await this.em.flush();');
    expect((service.match(/new ConflictException/g) ?? []).length).toBe(2);
    const module = tree.readContent('/users/users.module.ts');
    expect(module).toContain('MikroOrmModule.forFeature([User])');
    expect(module).toContain('exports: [UsersService]');
    expect(module).not.toContain('MongooseModule');
    const controller = tree.readContent('/users/users.controller.ts');
    expect(controller).toContain('findOne(+id)');
    expect(controller).toContain('changePassword(+id,');
    expect(tree.readContent('/users/dto/update-user.dto.ts')).toContain(
      "['password']",
    );
    expect(tree.readContent('mikro-orm.config.ts')).toContain(
      "from '@mikro-orm/postgresql';",
    );
  });

  it('should generate a mongodb mikroorm user with an ObjectId _id', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      orm: 'mikroorm',
      db: 'mongodb',
    });
    const entity = tree.readContent('/users/entities/user.entity.ts');
    expect(entity).toContain('_id!: ObjectId;');
    expect(entity).toContain("import { ObjectId } from 'mongodb';");
    expect(entity).not.toContain('id!: string;');
    const service = tree.readContent('/users/users.service.ts');
    expect(service).toContain("from '@mikro-orm/mongodb'");
    expect(service).toContain('findOne(id: string)');
    expect(service).toContain('findOne({ _id: new ObjectId(id) })');
    const controller = tree.readContent('/users/users.controller.ts');
    expect(controller).toContain('return this.usersService.findOne(id);');
    expect(controller).not.toContain('+id');
    expect(tree.readContent('/mikro-orm.config.ts')).toContain(
      "from '@mikro-orm/mongodb';",
    );
  });
});

describe('resolveOutputPaths', () => {
  const runner: SchematicTestRunner = new SchematicTestRunner(
    '.',
    path.join(process.cwd(), 'src/collection.json'),
  );

  it('should match real resource output without root markers', async () => {
    const tree = await runner.runSchematic('resource', {
      name: 'users',
      db: 'mongodb',
      orm: 'mongoose',
    });
    const output = resolveOutputPaths(tree, { name: 'users' });
    expect(output.dir).toEqual('/users');
    for (const file of [
      output.schemaPath,
      output.createDtoPath,
      output.updateDtoPath,
    ]) {
      expect(tree.exists(file)).toBe(true);
    }
  });

  it('should match real resource output with root markers', async () => {
    const host = new HostTree();
    // ponytail: pre-seeded so dep rules find everything and no install task fires mid-test
    host.create(
      'package.json',
      JSON.stringify({
        name: 'app',
        dependencies: {
          '@nestjs/mapped-types': '*',
          '@nestjs/mongoose': '*',
          mongoose: '*',
          argon2: '*',
          'class-validator': '*',
        },
      }),
    );
    const tree = await runner.runSchematic(
      'resource',
      { name: 'users', db: 'mongodb', orm: 'mongoose' },
      new UnitTestTree(host),
    );
    const output = resolveOutputPaths(tree, { name: 'users' });
    expect(output.dir).toEqual('src/users');
    for (const file of [
      output.schemaPath,
      output.createDtoPath,
      output.updateDtoPath,
    ]) {
      expect(tree.exists(file)).toBe(true);
    }
  });

  it('should honor flat, path and sourceRoot', () => {
    const tree = new UnitTestTree(new HostTree());
    expect(resolveOutputPaths(tree, { name: 'users' }).dir).toEqual('/users');
    expect(resolveOutputPaths(tree, { name: 'users', flat: true }).dir).toEqual(
      '/',
    );
    expect(
      resolveOutputPaths(tree, { name: 'users', path: 'admin' }).dir,
    ).toEqual('/admin/users');

    const marked = new UnitTestTree(new HostTree());
    marked.create('package.json', JSON.stringify({ name: 'app' }));
    expect(
      resolveOutputPaths(marked, { name: 'users', sourceRoot: 'libs' }).dir,
    ).toEqual('libs/users');
  });
});
