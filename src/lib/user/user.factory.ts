import { join, normalize, Path, strings } from '@angular-devkit/core';
import {
  apply,
  chain,
  filter,
  forEach,
  MergeStrategy,
  mergeWith,
  move,
  noop,
  Rule,
  SchematicContext,
  SchematicsException,
  schematic,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import pluralize from 'pluralize';
import { DUPLICATE_KEY_GUARD } from '../../utils/fields.js';
import { normalizeToKebabOrSnakeCase } from '../../utils/formatting.js';
import { templateHelpers } from '../../utils/template-helpers.js';
import { installIfNotInstalled } from '../../utils/install-deps.utils.js';
import { NameParser } from '../../utils/name.parser.js';
import {
  isEsmProject,
  isInRootDirectory,
} from '../../utils/source-root.helpers.js';
import {
  entityTypeOptions,
  hasOrm,
  ormFlags,
} from '../../utils/entity-type.options.js';
import { drizzleOptions } from '../../utils/drizzle.options.js';
import { mikroOrmDriver } from '../../utils/mikro-orm.options.js';
import {
  matchServiceBranch,
  serviceBranch,
  stripServiceBranch,
} from '../../utils/service-branch.js';
import { DEFAULT_PATH_NAME } from '../defaults.js';
import type { UserOptions } from './user.schema.js';

export function main(options: UserOptions): Rule {
  // ponytail: the user entity has a fixed field set, so a "fields" spec would
  // be silently dropped by overwriteUserFiles — say so instead
  if ('fields' in options && options.fields) {
    throw new SchematicsException(
      'The "user" schematic does not support the "fields" option. Generate a plain "resource" and add your own fields, or edit src/<name>/entities after generating.',
    );
  }
  const effective: UserOptions & { fields?: string } = {
    ...options,
    name: options.name ?? 'users',
    type: options.type ?? 'rest',
    crud: options.crud ?? true,
    // ponytail: the nested resource schematic shares the prompt provider, so an
    // unset "fields" still gets asked; an empty answer skips the prompt and
    // resolves to the placeholder body that overwriteUserFiles replaces anyway
    fields: '',
    db: options.db,
    orm: options.orm,
  };
  return chain([
    schematic('resource', effective),
    overwriteUserFiles(effective),
    hasOrm(effective.orm) ? addUserDependencies() : noop(),
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
    const { ...flags } = ormFlags(options.orm, options.db);
    const { isMongoose, isTypeOrm, isDrizzle, isMikroOrm, hasOrm } = flags;
    const branch = serviceBranch(options);
    const isPasswordRoute =
      !!options.crud && hasOrm && (options.type ?? 'rest') === 'rest';

    if (!hasSchema && !hasEntity && !hasDto) {
      return tree;
    }

    return mergeWith(
      apply(url('./files'), [
        filter((path) => {
          const branchPath = matchServiceBranch(path);
          if (branchPath) {
            return isPasswordRoute && branchPath === branch;
          }
          if (path.includes('/schemas/')) {
            return hasSchema && (isMongoose || isDrizzle);
          }
          if (path.includes('/entities/')) {
            return hasEntity && (isTypeOrm || isMikroOrm);
          }
          if (path.endsWith('change-password.dto.ts')) {
            return isPasswordRoute;
          }
          if (path.endsWith('.controller.ts') || path.endsWith('.module.ts')) {
            return isPasswordRoute;
          }
          if (path.endsWith('.dto.ts')) {
            if (path.includes('/update-')) {
              return hasDto && hasOrm;
            }
            return hasDto;
          }
          return false;
        }),
        template({
          ...strings,
          ...options,
          ...ormFlags(options.orm, options.db),
          mikroOrmDriver: mikroOrmDriver(options.db),
          isEsm: isEsmProject(tree),
          ...entityTypeOptions(options.name, options.orm),
          ...drizzleOptions(options.db),
          ...templateHelpers,
          duplicateKeyGuard: DUPLICATE_KEY_GUARD,
        }),
        forEach((file) => ({
          content: file.content,
          path: normalize(stripServiceBranch(file.path)),
        })),
        move(output.dir as Path),
      ]),
      MergeStrategy.Overwrite,
    )(tree, context);
  };
}

function addUserDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    installIfNotInstalled(host, context, ['argon2', 'class-validator']);
  };
}
