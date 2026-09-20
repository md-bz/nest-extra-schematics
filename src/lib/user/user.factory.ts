import { join, normalize, Path, strings } from '@angular-devkit/core';
import { classify } from '@angular-devkit/core/src/utils/strings';
import {
  apply,
  chain,
  filter,
  MergeStrategy,
  mergeWith,
  move,
  noop,
  Rule,
  SchematicContext,
  schematic,
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
import { normalizeToKebabOrSnakeCase } from '../../utils/formatting.js';
import { NameParser } from '../../utils/name.parser.js';
import {
  isEsmProject,
  isInRootDirectory,
} from '../../utils/source-root.helpers.js';
import { DEFAULT_PATH_NAME } from '../defaults.js';
import type { UserOptions } from './user.schema.js';

export function main(options: UserOptions): Rule {
  const effective: UserOptions = {
    ...options,
    name: options.name ?? 'users',
    type: options.type ?? 'rest',
    crud: options.crud ?? true,
    db: options.db ?? 'mongodb',
    orm: options.orm ?? 'mongoose',
  };
  return chain([
    schematic('resource', effective),
    overwriteUserFiles(effective),
    effective.orm === 'mongoose' || effective.orm === 'typeorm'
      ? addUserDependencies()
      : noop(),
  ]);
}

export interface UserOutputPaths {
  dir: string;
  singular: string;
  schemaPath: string;
  entityPath: string;
  createDtoPath: string;
  updateDtoPath: string;
}

export function resolveOutputPaths(
  tree: Tree,
  options: UserOptions,
): UserOutputPaths {
  const location = new NameParser().parse({
    name: options.name,
    path: options.path,
  });

  const name = normalizeToKebabOrSnakeCase(location.name);
  let dir = normalizeToKebabOrSnakeCase(location.path);

  if (!options.flat) {
    dir = join(dir as Path, name as Path) as string;
  }

  if (isInRootDirectory(tree, ['tsconfig.json', 'package.json'])) {
    dir = join(
      normalize(options.sourceRoot ?? DEFAULT_PATH_NAME),
      dir as Path,
    ) as string;
  }
  const singular = pluralize.singular(name);
  return {
    dir,
    singular,
    schemaPath: `${dir}/schemas/${singular}.schema.ts`,
    entityPath: `${dir}/entities/${singular}.entity.ts`,
    createDtoPath: `${dir}/dto/create-${singular}.dto.ts`,
    updateDtoPath: `${dir}/dto/update-${singular}.dto.ts`,
  };
}

function overwriteUserFiles(options: UserOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const output = resolveOutputPaths(tree, options);
    const hasSchema = tree.exists(output.schemaPath);
    const hasEntity = tree.exists(output.entityPath);
    const hasDto = tree.exists(output.createDtoPath);
    // ponytail: password route needs a hashing data path (mongoose doc.save()
    // hook or typeorm save()); password must never flow through
    // findByIdAndUpdate/.update(), so the update DTO drops it on both
    const isMongoose = options.orm === 'mongoose';
    const isTypeOrm = options.orm === 'typeorm';
    const isPasswordRoute =
      !!options.crud &&
      (isMongoose || isTypeOrm) &&
      (options.type ?? 'rest') === 'rest';

    if (!hasSchema && !hasEntity && !hasDto) {
      return tree;
    }

    return mergeWith(
      apply(url('./files'), [
        filter((path) => {
          if (path.includes('/schemas/')) {
            return hasSchema;
          }
          if (path.includes('/entities/')) {
            return hasEntity && isTypeOrm;
          }
          if (path.endsWith('change-password.dto.ts')) {
            return isPasswordRoute;
          }
          if (
            path.endsWith('.controller.ts') ||
            path.endsWith('.service.ts') ||
            path.endsWith('.module.ts')
          ) {
            return isPasswordRoute;
          }
          if (path.endsWith('.dto.ts')) {
            if (path.includes('/update-')) {
              return hasDto && (isMongoose || isTypeOrm);
            }
            return hasDto;
          }
          return false;
        }),
        template({
          ...strings,
          ...options,
          isMongoose: options.orm === 'mongoose',
          isTypeOrm: options.orm === 'typeorm',
          isEsm: isEsmProject(tree),
          lowercased: (name: string) => {
            const classifiedName = classify(name);
            return (
              classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1)
            );
          },
          singular: (name: string) => pluralize.singular(name) as string,
        }),
        move(output.dir as Path),
      ]),
      MergeStrategy.Overwrite,
    )(tree, context);
  };
}

function addUserDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    try {
      let installed = false;
      for (const name of ['argon2', 'class-validator']) {
        if (!getPackageJsonDependency(host, name)) {
          addPackageJsonDependency(host, {
            type: NodeDependencyType.Default,
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
