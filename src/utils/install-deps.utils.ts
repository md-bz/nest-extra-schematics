import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks/index.js';
import {
  addPackageJsonDependency,
  getPackageJsonDependency,
  NodeDependencyType,
} from './dependencies.utils.js';

export const PACKAGE_JSON_PATH = '/package.json';

/**
 * Every @mikro-orm package except nestjs moves together — a mismatched core
 * and driver pair breaks at bootstrap, so they share one floor. nestjs is
 * versioned on its own below.
 */
const MIKRO_ORM_VERSION = '^7.2.5';

/**
 * Version requested for every package the schematics add. Callers pass the
 * keys of this map, so a version bump is a one-line edit here instead of a
 * hunt through the factories. Ranges are caret-pinned to the current npm
 * release: it stops a fresh major from landing in someone's project on the
 * next install, while still picking up patch and minor fixes.
 */
export const PACKAGE_VERSIONS = {
  '@mikro-orm/core': MIKRO_ORM_VERSION,
  // cli ships the schema:update command, and must match the core version
  '@mikro-orm/cli': MIKRO_ORM_VERSION,
  '@mikro-orm/decorators': MIKRO_ORM_VERSION,
  '@mikro-orm/mongodb': MIKRO_ORM_VERSION,
  '@mikro-orm/mysql': MIKRO_ORM_VERSION,
  // nestjs trails the rest: 7.1.0 is its newest release, and it
  // peer-depends on core ^7.0.0, which the shared floor satisfies
  '@mikro-orm/nestjs': '^7.1.0',
  '@mikro-orm/postgresql': MIKRO_ORM_VERSION,
  '@mikro-orm/reflection': MIKRO_ORM_VERSION,
  '@mikro-orm/sqlite': MIKRO_ORM_VERSION,
  '@nestjs/config': '^12.0.1',
  '@nestjs/drizzle': '^0.0.1',
  '@nestjs/mapped-types': '^12.0.0',
  '@nestjs/mongoose': '^12.0.0',
  '@nestjs/jwt': '^12.0.2',
  '@nestjs/passport': '^12.0.0',
  '@nestjs/sequelize': '^12.0.0',
  '@nestjs/typeorm': '^12.0.2',
  '@types/passport-jwt': '^4.0.1',
  '@types/passport-local': '^1.0.38',
  argon2: '^0.45.1',
  'better-sqlite3': '^13.0.3',
  'class-transformer': '^0.5.1',
  'class-validator': '^0.15.1',
  // ponytail: drizzle v1 is still pre-release, so keep tracking the rc tag
  'drizzle-kit': '1.0.0-rc.4',
  'drizzle-orm': '1.0.0-rc.4',
  mongodb: '^7.7.0',
  mongoose: '^9.11.1',
  mysql2: '^3.24.5',
  passport: '^0.7.0',
  'passport-jwt': '^4.0.1',
  'passport-local': '^1.0.0',
  pg: '^8.23.1',
  sequelize: '^6.37.8',
  'sequelize-typescript': '^2.1.6',
  sqlite3: '^6.0.1',
  typeorm: '^1.1.2',
  tsx: '^4.23.15',
} as const;

export type PackageName = keyof typeof PACKAGE_VERSIONS;

/** npm driver package per sql database, shared by typeorm and drizzle. */
export const SQL_DRIVER_PACKAGE: Record<string, PackageName> = {
  postgres: 'pg',
  mysql: 'mysql2',
  sqlite: 'better-sqlite3',
};

/** sequelize takes its dialect driver as a separate package. */
export const SEQUELIZE_DRIVER_PACKAGE: Record<string, PackageName> = {
  postgres: 'pg',
  mysql: 'mysql2',
  sqlite: 'sqlite3',
};

export function sequelizeDriver(db?: string): PackageName {
  return SEQUELIZE_DRIVER_PACKAGE[db ?? ''] ?? 'sqlite3';
}

/**
 * Adds any of `names` that the project does not already depend on, then queues
 * a single install task. Package.json absence is ignored: a schematic can run
 * against a tree without one (tests, bare files).
 *
 * @param tree - The file tree representing the project.
 * @param context - The schematic context the install task is queued on.
 * @param names - Keys of PACKAGE_VERSIONS, so a typo is a type error.
 * @param type - Which package.json block to write to.
 */
export function installIfNotInstalled(
  tree: Tree,
  context: SchematicContext,
  names: PackageName[],
  type: NodeDependencyType = NodeDependencyType.Default,
): void {
  if (!tree.exists(PACKAGE_JSON_PATH)) {
    return;
  }
  let installed = false;
  for (const name of names) {
    if (getPackageJsonDependency(tree, name)) {
      continue;
    }
    addPackageJsonDependency(tree, {
      type,
      name,
      version: PACKAGE_VERSIONS[name],
    });
    installed = true;
  }
  if (installed) {
    context.addTask(new NodePackageInstallTask());
  }
}
