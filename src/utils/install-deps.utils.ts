import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks/index.js';
import {
  addPackageJsonDependency,
  getPackageJsonDependency,
  NodeDependencyType,
} from './dependencies.utils.js';

export const PACKAGE_JSON_PATH = '/package.json';

/**
 * Version requested for every package the schematics add. Callers pass the
 * keys of this map, so a version bump is a one-line edit here instead of a
 * hunt through the factories. '*' means "whatever latest resolves to", which is
 * the right default for packages that share a release train with the host app.
 */
export const PACKAGE_VERSIONS = {
  '@mikro-orm/core': '*',
  '@mikro-orm/decorators': '*',
  '@mikro-orm/mongodb': '*',
  '@mikro-orm/mysql': '*',
  '@mikro-orm/nestjs': '*',
  '@mikro-orm/postgresql': '*',
  '@mikro-orm/sqlite': '*',
  '@nestjs/config': '*',
  '@nestjs/drizzle': '*',
  '@nestjs/mapped-types': '*',
  '@nestjs/mongoose': '*',
  '@nestjs/jwt': '*',
  '@nestjs/passport': '*',
  '@nestjs/typeorm': '*',
  '@types/passport-jwt': '*',
  '@types/passport-local': '*',
  argon2: '*',
  'better-sqlite3': '*',
  'class-transformer': '*',
  'class-validator': '*',
  // ponytail: drizzle v1 only ships under the rc tag, so pin the tag
  'drizzle-kit': 'rc',
  'drizzle-orm': 'rc',
  mongodb: '*',
  mongoose: '*',
  mysql2: '*',
  passport: '*',
  'passport-jwt': '*',
  'passport-local': '*',
  pg: '*',
  typeorm: '*',
} as const;

export type PackageName = keyof typeof PACKAGE_VERSIONS;

/** npm driver package per sql database, shared by typeorm and drizzle. */
export const SQL_DRIVER_PACKAGE: Record<string, PackageName> = {
  postgres: 'pg',
  mysql: 'mysql2',
  sqlite: 'better-sqlite3',
};

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
