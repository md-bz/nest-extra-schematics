import { HostTree, SchematicContext } from '@angular-devkit/schematics';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { addAuthDependencies, resolveOutputPaths } from './auth.factory.js';

describe('Auth Factory', () => {
  const runner: SchematicTestRunner = new SchematicTestRunner(
    '.',
    path.join(process.cwd(), 'src/collection.json'),
  );

  it('should generate a jwt auth module by default', async () => {
    const tree: UnitTestTree = await runner.runSchematic('auth', {});
    expect(tree.files).toEqual([
      '/auth/auth.controller.spec.ts',
      '/auth/auth.controller.ts',
      '/auth/auth.module.ts',
      '/auth/auth.service.spec.ts',
      '/auth/auth.service.ts',
      '/auth/dto/login.dto.ts',
      '/auth/guards/jwt-auth.guard.ts',
      '/auth/guards/local-auth.guard.ts',
      '/auth/strategies/jwt.strategy.ts',
      '/auth/strategies/local.strategy.ts',
    ]);
  });

  it('should generate passing specs with mocked dependencies', async () => {
    const tree: UnitTestTree = await runner.runSchematic('auth', {});
    const controllerSpec = tree.readContent('/auth/auth.controller.spec.ts');
    expect(controllerSpec).toContain(
      'providers: [{ provide: AuthService, useValue: {} }]',
    );
    const serviceSpec = tree.readContent('/auth/auth.service.spec.ts');
    expect(serviceSpec).toContain(
      '{ provide: UsersService, useValue: {} }',
    );
    expect(serviceSpec).toContain('{ provide: JwtService, useValue: {} }');
  });

  it('should skip specs when asked', async () => {
    const tree: UnitTestTree = await runner.runSchematic('auth', {
      spec: false,
    });
    expect(tree.exists('/auth/auth.controller.spec.ts')).toBe(false);
    expect(tree.exists('/auth/auth.service.spec.ts')).toBe(false);
    expect(tree.exists('/auth/auth.controller.ts')).toBe(true);
    expect(tree.exists('/auth/auth.service.ts')).toBe(true);
  });

  it('should wire passport, jwt and the users module', async () => {
    const tree: UnitTestTree = await runner.runSchematic('auth', {});
    const module = tree.readContent('/auth/auth.module.ts');
    expect(module).toContain(
      "import { UsersModule } from '../users/users.module'",
    );
    expect(module).toContain('PassportModule');
    expect(module).toContain('JwtModule.registerAsync');
    expect(module).toContain('ConfigService');
    expect(module).toContain("getOrThrow<string>('JWT_SECRET')");
    expect(module).toContain('JWT_EXPIRES_IN');
    expect(module).toContain(
      "import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';",
    );
    expect(module).toContain("as JwtSignOptions['expiresIn']");
    expect(module).toContain('AuthController');
    expect(module).toContain('providers: [AuthService, LocalStrategy, JwtStrategy]');
    expect(module).toContain("from './strategies/jwt.strategy'");
    expect(module).toContain("from './strategies/local.strategy'");
  });

  it('should validate users and sign tokens in the service', async () => {
    const tree: UnitTestTree = await runner.runSchematic('auth', {});
    const service = tree.readContent('/auth/auth.service.ts');
    expect(service).toContain(
      "import { UsersService } from '../users/users.service'",
    );
    expect(service).toContain('findByEmail(email)');
    expect(service).toContain('argon2.verify(user.password, password)');
    expect(service).toContain("throw new UnauthorizedException('Invalid credentials')");
    expect(service).toContain('return { userId: user.id, email: user.email }');
    expect(service).toContain('signAsync(payload)');
    expect(service).toContain('access_token');
  });

  it('should generate docs-shaped strategies, guards and routes', async () => {
    const tree: UnitTestTree = await runner.runSchematic('auth', {});
    const local = tree.readContent('/auth/strategies/local.strategy.ts');
    expect(local).toContain("extends PassportStrategy(Strategy)");
    expect(local).toContain("usernameField: 'email'");
    expect(local).toContain('validateUser(email, password)');
    expect(local).toContain("from '../auth.service'");
    const jwt = tree.readContent('/auth/strategies/jwt.strategy.ts');
    expect(jwt).toContain('ExtractJwt.fromAuthHeaderAsBearerToken()');
    expect(jwt).toContain("getOrThrow<string>('JWT_SECRET')");
    expect(jwt).toContain('return { userId: payload.sub, email: payload.email }');
    expect(tree.readContent('/auth/guards/local-auth.guard.ts')).toContain(
      "extends AuthGuard('local')",
    );
    expect(tree.readContent('/auth/guards/jwt-auth.guard.ts')).toContain(
      "extends AuthGuard('jwt')",
    );
    const controller = tree.readContent('/auth/auth.controller.ts');
    expect(controller).toContain('@UseGuards(LocalAuthGuard)');
    expect(controller).toContain("@Post('login')");
    expect(controller).toContain('@UseGuards(JwtAuthGuard)');
    expect(controller).toContain("@Get('profile')");
    expect(controller).toContain('return req.user;');
    expect(controller).toContain("from './guards/jwt-auth.guard'");
    expect(controller).toContain("from './guards/local-auth.guard'");
  });

  it('should accept email and password by default', async () => {
    const tree: UnitTestTree = await runner.runSchematic('auth', {});
    const dto = tree.readContent('/auth/dto/login.dto.ts');
    expect(dto).toContain('email!: string;');
    expect(dto).toContain('@IsEmail()');
    expect(dto).toContain('password!: string;');
    expect(dto).not.toContain('username');
  });

  it('should support username instead of email', async () => {
    const tree: UnitTestTree = await runner.runSchematic('auth', {
      usernameField: 'username',
    });
    const dto = tree.readContent('/auth/dto/login.dto.ts');
    expect(dto).toContain('username!: string;');
    expect(dto).not.toContain('@IsEmail()');
    expect(tree.readContent('/auth/strategies/local.strategy.ts')).toContain(
      "usernameField: 'username'",
    );
    expect(tree.readContent('/auth/strategies/local.strategy.ts')).toContain(
      'validateUser(username, password)',
    );
    const service = tree.readContent('/auth/auth.service.ts');
    expect(service).toContain('findByUsername(username)');
    expect(service).toContain(
      'return { userId: user.id, username: user.username }',
    );
    expect(tree.readContent('/auth/strategies/jwt.strategy.ts')).toContain(
      'return { userId: payload.sub, username: payload.username }',
    );
  });

  it('should leave custom identifiers for the developer to wire up', async () => {
    const tree: UnitTestTree = await runner.runSchematic('auth', {
      usernameField: 'employeeId',
    });
    const dto = tree.readContent('/auth/dto/login.dto.ts');
    expect(dto).toContain('employeeId!: string;');
    expect(dto).toContain('@IsString()');
    expect(dto).not.toContain('@IsEmail()');
    expect(tree.readContent('/auth/strategies/local.strategy.ts')).toContain(
      "usernameField: 'employeeId'",
    );
    const service = tree.readContent('/auth/auth.service.ts');
    expect(service).not.toContain('findByEmail(');
    expect(service).not.toContain('findByUsername(');
    expect(service).toContain('no lookup is plugged in');
    expect(service).toContain(
      'const user: { id: string; employeeId: string; password: string } | null = null;',
    );
    expect(service).toContain(
      'return { userId: user.id, employeeId: user.employeeId }',
    );
    expect(tree.readContent('/auth/strategies/jwt.strategy.ts')).toContain(
      'return { userId: payload.sub, employeeId: payload.employeeId }',
    );
  });

  it('should reject invalid identifier field names', async () => {
    await expect(
      runner.runSchematic('auth', { usernameField: 'not a field' }),
    ).rejects.toThrow('not a valid field name');
    await expect(
      runner.runSchematic('auth', { usernameField: 'password' }),
    ).rejects.toThrow('cannot be used as "--username-field"');
  });

  it('should honor an explicit name', async () => {
    const tree: UnitTestTree = await runner.runSchematic('auth', {
      name: 'authentication',
    });
    expect(tree.exists('/authentication/authentication.module.ts')).toBe(true);
    expect(
      tree.readContent('/authentication/authentication.module.ts'),
    ).toContain('export class AuthenticationModule {}');
    expect(
      tree.readContent('/authentication/authentication.service.ts'),
    ).toContain('export class AuthenticationService {');
  });

  it('should reject non-mongoose databases', async () => {
    await expect(
      runner.runSchematic('auth', { db: 'none', orm: 'none' }),
    ).rejects.toThrow('Only "--db mongodb" with "--orm mongoose"');
  });

  it('should reject unsupported methods', async () => {
    await expect(
      runner.runSchematic('auth', { method: 'session' } as any),
    ).rejects.toThrow();
  });

  it('should resolve the output dir like a resource', () => {
    const tree = new UnitTestTree(new HostTree());
    expect(resolveOutputPaths(tree, { name: 'auth' })).toEqual('/auth');
  });

  it('should add passport, jwt, config and type dependencies', () => {
    const host = new HostTree();
    host.create(
      '/package.json',
      JSON.stringify({ name: 'app', dependencies: {} }),
    );
    const tree = new UnitTestTree(host);
    addAuthDependencies()(
      tree,
      { addTask: () => {} } as unknown as SchematicContext,
    );
    const pkg = JSON.parse(tree.readContent('/package.json').toString());
    for (const name of [
      '@nestjs/passport',
      '@nestjs/jwt',
      '@nestjs/config',
      'passport',
      'passport-local',
      'passport-jwt',
      'argon2',
      'class-validator',
    ]) {
      expect(pkg.dependencies[name]).toBeDefined();
    }
    expect(pkg.devDependencies['@types/passport-local']).toBeDefined();
    expect(pkg.devDependencies['@types/passport-jwt']).toBeDefined();
  });
});
