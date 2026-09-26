import { join, Path, strings } from '@angular-devkit/core';
import { classify } from '@angular-devkit/core/src/utils/strings';
import {
  apply,
  branchAndMerge,
  chain,
  filter,
  mergeWith,
  move,
  noop,
  Rule,
  SchematicContext,
  SchematicsException,
  Source,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks/index.js';
import pluralize from 'pluralize';
import {
  addPackageJsonDependency,
  getPackageJsonDependency,
  NodeDependencyType,
} from '../../utils/dependencies.utils.js';
import { formatFiles } from '../../utils/format-files.rule.js';
import { normalizeToKebabOrSnakeCase } from '../../utils/formatting.js';
import { NameParser } from '../../utils/name.parser.js';
import {
  isEsmProject,
  mergeSourceRoot,
} from '../../utils/source-root.helpers.js';
import { addDeclarationToModule } from '../resource/resource.factory.js';
import { resolveOutputPaths as resolveUserOutputPaths } from '../user/user.factory.js';
import type { AuthOptions } from './auth.schema.js';

export function main(options: AuthOptions): Rule {
  options = transform(options);

  return (tree: Tree, context: SchematicContext) => {
    (options as any).isEsm = isEsmProject(tree);
    return branchAndMerge(
    chain([
      addAuthDependencies(options),
      mergeSourceRoot(options),
      addDeclarationToModule(options),
      mergeWith(generate(options)),
      options.format === true ? formatFiles() : noop(),
    ]),
    )(tree, context);
  };
}

export function resolveOutputPaths(
  tree: Tree,
  options: AuthOptions,
): string {
  // ponytail: auth lives wherever a resource would; reuse the user path math instead of a third copy
  return resolveUserOutputPaths(tree, options).dir;
}

function transform(options: AuthOptions): AuthOptions {
  const target: AuthOptions = Object.assign({}, options);
  if (!target.name) {
    target.name = 'auth';
  }
  target.metadata = 'imports';

  const location = new NameParser().parse({
    name: target.name,
    path: target.path,
  });
  target.name = normalizeToKebabOrSnakeCase(location.name);
  target.path = normalizeToKebabOrSnakeCase(location.path);
  target.language = target.language !== undefined ? target.language : 'ts';
  if (target.language === 'js') {
    throw new Error(
      'The "auth" schematic does not support JavaScript language (only TypeScript is supported).',
    );
  }
  target.path = target.flat
    ? target.path
    : join(target.path as Path, target.name);
  target.specFileSuffix = normalizeToKebabOrSnakeCase(
    options.specFileSuffix || 'spec',
  );

  target.method = target.method ?? 'jwt';
  if (target.method !== 'jwt' && target.method !== 'code') {
    throw new SchematicsException(
      'Only "--method jwt" or "--method code" is supported for now.',
    );
  }
  target.usernameField = target.usernameField ?? 'email';
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(target.usernameField)) {
    throw new SchematicsException(
      `"${target.usernameField}" is not a valid field name for "--username-field".`,
    );
  }
  if (target.usernameField === 'password') {
    throw new SchematicsException(
      '"password" cannot be used as "--username-field".',
    );
  }

  return target;
}

function generate(options: AuthOptions): Source {
  const isCode = options.method === 'code';
  return (context: SchematicContext) =>
    apply(url('./files'), [
      filter((path) => {
        if (
          path.includes('local.strategy') ||
          path.includes('local-auth.guard')
        ) {
          return !isCode;
        }
        if (path.includes('request-code.dto')) {
          return isCode;
        }
        return true;
      }),
      options.spec
        ? noop()
        : filter((path) => {
            const suffix = `.__specFileSuffix__.ts`;
            return !path.endsWith(suffix);
          }),
      template({
        ...strings,
        ...options,
        isCode,
        identifier: options.usernameField ?? 'email',
        // ponytail: only email/username have known user finders; custom
        // identifiers emit a lookup stub for the developer to wire up
        hasUserFinder:
          options.usernameField === undefined ||
          options.usernameField === 'email' ||
          options.usernameField === 'username',
        lowercased: (name: string) => {
          const classifiedName = classify(name);
          return (
            classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1)
          );
        },
        singular: (name: string) => pluralize.singular(name) as string,
      }),
      move(options.path!),
    ])(context);
}

export function addAuthDependencies(options?: AuthOptions): Rule {
  // ponytail: code login has no password — skip the local/passport-local/argon2 stack
  const isCode = options?.method === 'code';
  return (host: Tree, context: SchematicContext) => {
    try {
      let installed = false;
      const dependencies: Array<{
        type: NodeDependencyType;
        name: string;
      }> = [
        { type: NodeDependencyType.Default, name: '@nestjs/passport' },
        { type: NodeDependencyType.Default, name: '@nestjs/jwt' },
        { type: NodeDependencyType.Default, name: '@nestjs/config' },
        { type: NodeDependencyType.Default, name: 'passport' },
        { type: NodeDependencyType.Default, name: 'passport-jwt' },
        { type: NodeDependencyType.Default, name: 'class-validator' },
        { type: NodeDependencyType.Dev, name: '@types/passport-jwt' },
      ];
      if (!isCode) {
        dependencies.push(
          { type: NodeDependencyType.Default, name: 'passport-local' },
          { type: NodeDependencyType.Default, name: 'argon2' },
          { type: NodeDependencyType.Dev, name: '@types/passport-local' },
        );
      }
      for (const { type, name } of dependencies) {
        if (!getPackageJsonDependency(host, name)) {
          addPackageJsonDependency(host, {
            type,
            name,
            version: '*',
          });
          installed = true;
        }
      }
      if (installed) {
        context.addTask(new NodePackageInstallTask());
      }
    } catch {
      // ignore if "package.json" not found
    }
  };
}
