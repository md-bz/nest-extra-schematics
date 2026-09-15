import { HostTree } from '@angular-devkit/schematics';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { resolveOutputPaths } from './user.factory.js';

describe('User Factory', () => {
  const runner: SchematicTestRunner = new SchematicTestRunner(
    '.',
    path.join(process.cwd(), 'src/collection.json'),
  );

  it('should generate a users mongoose resource by default', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {});
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
  });

  it('should generate a user schema with argon2 password hashing', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {});
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
    const tree: UnitTestTree = await runner.runSchematic('user', {});
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
    const tree: UnitTestTree = await runner.runSchematic('user', {});
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
  });

  it('should not add a password route off the rest mongoose path', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      type: 'microservice',
    });
    const controller = tree.readContent('/users/users.controller.ts');
    const service = tree.readContent('/users/users.service.ts');
    expect(controller).not.toContain('changePassword');
    expect(service).not.toContain('changePassword');
    expect(tree.exists('/users/dto/change-password.dto.ts')).toBe(false);
    expect(tree.readContent('/users/dto/update-user.dto.ts')).toContain(
      'OmitType(',
    );
  });

  it('should honor an explicit name', async () => {
    const tree: UnitTestTree = await runner.runSchematic('user', {
      name: 'admins',
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
