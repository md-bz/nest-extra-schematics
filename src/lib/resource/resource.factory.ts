import { join, normalize, Path, strings } from '@angular-devkit/core';
import { classify } from '@angular-devkit/core/src/utils/strings';
import {
  apply,
  branchAndMerge,
  chain,
  filter,
  forEach,
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
import pluralize from 'pluralize';
import {
  ArrayLiteralExpression,
  CallExpression,
  createSourceFile,
  Expression,
  Node,
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
  SyntaxKind,
  StringLiteral,
} from 'typescript';
import { ScriptTarget } from 'typescript';
import {
  DeclarationOptions,
  ModuleDeclarator,
  ModuleFinder,
} from '../../index.js';
import {
  getPackageJsonDependency,
  NodeDependencyType,
} from '../../utils/dependencies.utils.js';
import { formatFiles } from '../../utils/format-files.rule.js';
import { normalizeToKebabOrSnakeCase } from '../../utils/formatting.js';
import {
  entityTypeOptions,
  hasOrm,
  ormFlags,
} from '../../utils/entity-type.options.js';
import {
  drizzleDialect,
  drizzleOptions,
  drizzleSchemaOptions,
} from '../../utils/drizzle.options.js';
import {
  installIfNotInstalled,
  PACKAGE_JSON_PATH,
  PackageName,
  SQL_DRIVER_PACKAGE,
} from '../../utils/install-deps.utils.js';
import { parseFields } from '../../utils/fields.js';
import { templateHelpers } from '../../utils/template-helpers.js';
import { mikroOrmDriver } from '../../utils/mikro-orm.options.js';
import {
  isServiceTemplate,
  matchServiceBranch,
  serviceBranch,
  stripServiceBranch,
} from '../../utils/service-branch.js';
import { PathSolver } from '../../utils/path.solver.js';
import { Location, NameParser } from '../../utils/name.parser.js';
import {
  isEsmProject,
  mergeSourceRoot,
} from '../../utils/source-root.helpers.js';
import type { ResourceOptions } from './resource.schema.js';

export function main(options: ResourceOptions): Rule {
  options = transform(options);

  return (tree: Tree, context: SchematicContext) => {
    (options as any).isEsm = isEsmProject(tree);
    return branchAndMerge(
      chain([
        addMappedTypesDependencyIfApplies(options),
        addClassValidatorDependencyIfApplies(options),
        addMongooseDependenciesIfApplies(options),
        addTypeOrmDependenciesIfApplies(options),
        addDrizzleDependenciesIfApplies(options),
        addMikroOrmDependenciesIfApplies(options),
        mergeSourceRoot(options),
        addDeclarationToModule(options),
        addEntityToAppModuleIfApplies(options),
        mergeWith(generate(options)),
        addEntityToDrizzleConfigIfApplies(options),
        addMikroOrmConfigIfApplies(options),
        options.format === true ? formatFiles() : noop(),
      ]),
    )(tree, context);
  };
}

function transform(options: ResourceOptions): ResourceOptions {
  const target: ResourceOptions = Object.assign({}, options);
  if (!target.name) {
    throw new SchematicsException('Option (name) is required.');
  }
  target.metadata = 'imports';

  const location: Location = new NameParser().parse(target);
  target.name = normalizeToKebabOrSnakeCase(location.name);
  target.path = normalizeToKebabOrSnakeCase(location.path);
  target.language = target.language !== undefined ? target.language : 'ts';
  if (target.language === 'js') {
    throw new Error(
      'The "resource" schematic does not support JavaScript language (only TypeScript is supported).',
    );
  }
  target.specFileSuffix = normalizeToKebabOrSnakeCase(
    options.specFileSuffix || 'spec',
  );

  target.path = target.flat
    ? target.path
    : join(target.path as Path, target.name);
  target.isSwaggerInstalled = options.isSwaggerInstalled ?? false;
  // ponytail: "none" is the x-prompt escape hatch for "no database", normalized away so the rest flows as if no flag was passed
  if (target.db === 'none') {
    target.db = undefined;
  }
  if (target.orm === 'none') {
    target.orm = undefined;
  }
  const sqlDbs = ['sqlite', 'postgres', 'mysql'];
  // both or neither: half a choice has no sensible default,
  if ((target.db === undefined) !== (target.orm === undefined)) {
    throw new SchematicsException(
      target.orm === undefined
        ? `Option "db" requires "orm" as well: ${sqlDbs.includes(target.db!) ? 'use "--orm typeorm", "--orm drizzle" or "--orm mikroorm"' : 'use "--orm mongoose"'} for "--db ${target.db}".`
        : `Option "orm" requires "db" as well: use "--orm mongoose" with "--db mongodb", or "--orm ${target.orm}" with "--db sqlite", "--db postgres" or "--db mysql".`,
    );
  }
  if (
    (target.db !== undefined &&
      target.db !== 'mongodb' &&
      !sqlDbs.includes(target.db)) ||
    (target.orm !== undefined && !hasOrm(target.orm)) ||
    (target.db !== undefined &&
      sqlDbs.includes(target.db) &&
      target.orm === 'mongoose') ||
    (target.db === 'mongodb' && target.orm === 'drizzle')
  ) {
    throw new SchematicsException(
      'Only "--db mongodb" with "--orm mongoose", "--orm typeorm" or "--orm mikroorm", or "--db sqlite"/"--db postgres"/"--db mysql" (MySQL/MariaDB) with "--orm typeorm", "--orm drizzle" or "--orm mikroorm" is supported for now.',
    );
  }

  target.parsedFields = parseFields(target.fields, {
    orm: target.orm,
    db: target.db,
    type: target.type,
  });

  return target;
}

function generate(options: ResourceOptions): Source {
  const {
    isMongoose,
    isTypeOrm,
    isDrizzle,
    isMikroOrm,
    isStringId,
    mikroOrmMongo,
  } = ormFlags(options.orm, options.db);
  const branch = serviceBranch(options);
  const parsed = options.parsedFields!;
  return (context: SchematicContext) =>
    apply(url(join('./files' as Path, options.language!)), [
      filter((path) => {
        const branchPath = matchServiceBranch(path);
        if (branchPath) {
          return branchPath === branch;
        }
        if (isServiceTemplate(path)) {
          return branch === null;
        }
        if (path.includes('/schemas/')) {
          return (isMongoose || isDrizzle) && !!options.crud;
        }
        if (path.endsWith('.dto.ts')) {
          return (
            options.type !== 'graphql-code-first' &&
            options.type !== 'graphql-schema-first' &&
            !!options.crud
          );
        }
        if (path.endsWith('.input.ts')) {
          return (
            (options.type === 'graphql-code-first' ||
              options.type === 'graphql-schema-first') &&
            !!options.crud
          );
        }
        if (
          path.endsWith('.resolver.ts') ||
          path.endsWith('.resolver.__specFileSuffix__.ts')
        ) {
          return (
            options.type === 'graphql-code-first' ||
            options.type === 'graphql-schema-first'
          );
        }
        if (path.endsWith('.graphql')) {
          return options.type === 'graphql-schema-first' && !!options.crud;
        }
        if (
          path.endsWith('controller.ts') ||
          path.endsWith('.controller.__specFileSuffix__.ts')
        ) {
          return options.type === 'microservice' || options.type === 'rest';
        }
        if (
          path.endsWith('.gateway.ts') ||
          path.endsWith('.gateway.__specFileSuffix__.ts')
        ) {
          return options.type === 'ws';
        }
        if (path.includes('@ent')) {
          // Entity class file workaround
          // When an invalid glob path for entities has been specified (on the application part)
          // TypeORM was trying to load a template class
          // mongoose and drizzle use schemas/ instead, so no entity file
          return !isMongoose && !isDrizzle && !!options.crud;
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
        ...parsed,
        hasFields: parsed.fields.length > 0,
        isMongoose,
        isTypeOrm,
        isDrizzle,
        isMikroOrm,
        isStringId,
        mikroOrmMongo,
        mikroOrmDriver: mikroOrmDriver(options.db),
        ...entityTypeOptions(options.name, options.orm),
        ...drizzleOptions(options.db),
        ...drizzleSchemaOptions(options.db, parsed.drizzleColumnFns),
        ...templateHelpers,
        ent: (name: string) => name + '.entity',
      }),
      forEach((file) => ({
        content: file.content,
        path: normalize(stripServiceBranch(file.path)),
      })),
      move(options.path!),
    ])(context);
}

export function addDeclarationToModule(options: ResourceOptions): Rule {
  return (tree: Tree) => {
    if (options.skipImport !== undefined && options.skipImport) {
      return tree;
    }
    options.module =
      new ModuleFinder(tree).find(options.path as Path) ?? undefined;
    if (!options.module) {
      return tree;
    }
    const content = tree.read(options.module)!.toString();
    const declarator: ModuleDeclarator = new ModuleDeclarator();
    tree.overwrite(
      options.module,
      declarator.declare(content, {
        ...options,
        type: 'module',
        isEsm: isEsmProject(tree),
      } as DeclarationOptions),
    );
    return tree;
  };
}

function addClassValidatorDependencyIfApplies(options: ResourceOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (
      options.type === 'graphql-code-first' ||
      options.type === 'graphql-schema-first' ||
      !options.crud
    ) {
      return;
    }
    const names: PackageName[] = ['class-validator'];
    // @Type(() => Date) on a date field needs class-transformer to resolve
    if (options.parsedFields?.transformerImports) {
      names.push('class-transformer');
    }
    installIfNotInstalled(host, context, names);
  };
}

function addEntityToAppModuleIfApplies(options: ResourceOptions): Rule {
  return (tree: Tree) => {
    if (options.orm !== 'typeorm' || !options.crud || !options.module) {
      return tree;
    }

    const content = tree.read(options.module)?.toString();
    if (!content) return tree;

    const source = createSourceFile(
      'app.module.ts',
      content,
      ScriptTarget.ES2017,
      true,
    );

    const entities = findForRootEntities(source);
    if (!entities) return tree;

    const entity = classify(pluralize.singular(options.name));
    const entityFile = pluralize.singular(options.name);

    if (entities.elements.some((el) => el.getText(source) === entity)) {
      return tree;
    }

    const position = entities.getEnd() - 1;
    const value = entities.elements.length ? `, ${entity}` : entity;

    let updated = content.slice(0, position) + value + content.slice(position);

    let relativePath = new PathSolver().relative(
      options.module,
      normalize(`/${options.path}/entities/${entityFile}.entity`),
    );
    if (isEsmProject(tree)) {
      relativePath += '.js';
    }

    const importLine = `import { ${entity} } from '${relativePath}';`;

    if (!updated.includes(importLine)) {
      const lines = updated.split('\n');
      const reversed = Array.from(lines).reverse();
      const lastImport = reversed.find((line) => line.match(/\} from ('|")/));
      lines.splice(
        lastImport ? lines.indexOf(lastImport) + 1 : 0,
        0,
        importLine,
      );
      updated = lines.join('\n');
    }

    tree.overwrite(options.module, updated);

    return tree;
  };
}

function findForRootEntities(
  source: SourceFile,
): ArrayLiteralExpression | undefined {
  let result: ArrayLiteralExpression | undefined;

  const visit = (node: Node) => {
    if (result) return;

    if (node.kind === SyntaxKind.CallExpression) {
      const call = node as CallExpression;
      if (
        call.expression.getText(source) === 'TypeOrmModule.forRoot' &&
        call.arguments[0]?.kind === SyntaxKind.ObjectLiteralExpression
      ) {
        const config = call.arguments[0] as ObjectLiteralExpression;

        const property = config.properties.find(
          (p) =>
            p.kind === SyntaxKind.PropertyAssignment &&
            (p as PropertyAssignment).name.getText(source) === 'entities',
        ) as PropertyAssignment | undefined;

        if (property?.initializer.kind === SyntaxKind.ArrayLiteralExpression) {
          result = property.initializer as ArrayLiteralExpression;
          return;
        }
      }
    }

    node.forEachChild(visit);
  };

  visit(source);
  return result;
}

function addEntityToDrizzleConfigIfApplies(options: ResourceOptions): Rule {
  return (tree: Tree) => {
    if (options.orm !== 'drizzle') {
      return tree;
    }
    const schemaPath = `${options.path}/schemas/${pluralize.singular(options.name)}.schema.ts`;
    if (!tree.exists(schemaPath)) {
      return tree;
    }
    const entry = `./${schemaPath.replace(/^\/+/, '')}`;
    const configPath = 'drizzle.config.ts';
    const existing = tree.read(configPath)?.toString();
    if (existing !== undefined) {
      // one drizzle-kit config has a single dialect, so a schema table built
      // from a different core would be registered but never migrated
      const wanted = drizzleDialect(options.db);
      const found = findDrizzleDialect(existing);
      if (found !== undefined && found !== wanted) {
        throw new SchematicsException(
          `Cannot add a "${wanted}" resource to ${configPath}, which is set to dialect "${found}". ` +
            `drizzle-kit reads one dialect per config, so the table would never be migrated. ` +
            `Use a separate project per database.`,
        );
      }
      const updated = appendDrizzleSchemaEntry(existing, entry);
      if (updated !== existing) {
        tree.overwrite(configPath, updated);
      }
      return tree;
    }
    tree.create(configPath, createDrizzleConfig(entry, options.db));
    return tree;
  };
}

function findDrizzleDialect(content: string): string | undefined {
  const source = createSourceFile(
    'drizzle.config.ts',
    content,
    ScriptTarget.ES2017,
    true,
  );
  const value = findDrizzleProperty(source, 'dialect');
  return value?.kind === SyntaxKind.StringLiteral
    ? (value as StringLiteral).text
    : undefined;
}

function findDrizzleProperty(
  source: SourceFile,
  name: string,
): Expression | undefined {
  let result: Expression | undefined;

  const visit = (node: Node) => {
    if (result) return;

    if (node.kind === SyntaxKind.PropertyAssignment) {
      const property = node as PropertyAssignment;
      if (property.name.getText(source) === name) {
        result = property.initializer;
        return;
      }
    }

    node.forEachChild(visit);
  };

  visit(source);
  return result;
}

function appendDrizzleSchemaEntry(content: string, entry: string): string {
  const source = createSourceFile(
    'drizzle.config.ts',
    content,
    ScriptTarget.ES2017,
    true,
  );
  const schema = findDrizzleProperty(source, 'schema');
  if (!schema) {
    return content;
  }
  if (schema.kind === SyntaxKind.StringLiteral) {
    const literal = schema as StringLiteral;
    if (literal.text === entry) {
      return content;
    }
    const start = literal.getStart(source);

    return (
      content.slice(0, start) +
      `[${literal.getText(source)}, '${entry}']` +
      content.slice(literal.getEnd())
    );
  }
  if (schema.kind !== SyntaxKind.ArrayLiteralExpression) {
    return content;
  }
  const array = schema as ArrayLiteralExpression;
  const alreadyThere = array.elements.some(
    (element) => element.getText(source).slice(1, -1) === entry,
  );
  if (alreadyThere) {
    return content;
  }
  if (array.elements.length === 0) {
    const position = array.getEnd() - 1;
    return content.slice(0, position) + `'${entry}'` + content.slice(position);
  }

  const first = array.elements[0];
  const last = array.elements[array.elements.length - 1];
  const multiline = content
    .slice(array.getStart(source), first.getStart(source))
    .includes('\n');
  const after = content.slice(last.getEnd(), array.getEnd());
  const trailingComma = /^[ \t]*,/.exec(after);
  const lineStart = content.lastIndexOf('\n', first.getStart(source)) + 1;
  const indent = /^[ \t]*/.exec(content.slice(lineStart))?.[0] ?? '  ';

  if (multiline) {
    if (trailingComma) {
      const position = last.getEnd() + trailingComma[0].length;
      return (
        content.slice(0, position) +
        `\n${indent}'${entry}'` +
        content.slice(position)
      );
    }
    const position = last.getEnd();
    return (
      content.slice(0, position) +
      `,\n${indent}'${entry}'` +
      content.slice(position)
    );
  }
  if (trailingComma) {
    const position = last.getEnd() + trailingComma[0].length;
    return content.slice(0, position) + ` '${entry}'` + content.slice(position);
  }
  const position = last.getEnd();
  return content.slice(0, position) + `, '${entry}'` + content.slice(position);
}

function createDrizzleConfig(entry: string, db: string | undefined): string {
  const dialect = drizzleDialect(db);
  return `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: '${dialect}',
  schema: [
    '${entry}',
  ],
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
`;
}

function addMikroOrmConfigIfApplies(options: ResourceOptions): Rule {
  return (tree: Tree) => {
    if (options.orm !== 'mikroorm' || !options.crud) {
      return tree;
    }
    // ponytail: entity globs cover every future entity, so only create-if-missing
    if (tree.exists('mikro-orm.config.ts')) {
      return tree;
    }
    tree.create('mikro-orm.config.ts', createMikroOrmConfig(options.db));
    return tree;
  };
}

function createMikroOrmConfig(db: string | undefined): string {
  const connection =
    db === 'sqlite'
      ? "  dbName: 'sqlite.db',"
      : '  clientUrl: process.env.DATABASE_URL!,';
  return `import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { defineConfig } from '@mikro-orm/${mikroOrmDriver(db)}';

export default defineConfig({
${connection}
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  metadataProvider: ReflectMetadataProvider,
});
`;
}

function addMongooseDependenciesIfApplies(options: ResourceOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (options.orm !== 'mongoose') {
      return;
    }
    installIfNotInstalled(host, context, ['@nestjs/mongoose', 'mongoose']);
  };
}

function addTypeOrmDependenciesIfApplies(options: ResourceOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (options.orm !== 'typeorm') {
      return;
    }
    // ponytail: each db needs its own driver package alongside typeorm;
    // transform guarantees db is set when orm is typeorm
    installIfNotInstalled(host, context, [
      '@nestjs/typeorm',
      'typeorm',
      options.db === 'mongodb' ? 'mongodb' : SQL_DRIVER_PACKAGE[options.db!],
    ]);
  };
}

function addDrizzleDependenciesIfApplies(options: ResourceOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (options.orm !== 'drizzle') {
      return;
    }
    // ponytail: each sql db needs its own driver package alongside drizzle;
    // transform guarantees db is set (and in the map) when orm is drizzle
    installIfNotInstalled(host, context, [
      '@nestjs/drizzle',
      'drizzle-orm',
      SQL_DRIVER_PACKAGE[options.db!],
    ]);
    installIfNotInstalled(
      host,
      context,
      ['drizzle-kit'],
      NodeDependencyType.Dev,
    );
  };
}

function addMikroOrmDependenciesIfApplies(options: ResourceOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (options.orm !== 'mikroorm') {
      return;
    }
    // ponytail: driver package follows the db; transform guarantees db is set
    installIfNotInstalled(host, context, [
      '@mikro-orm/nestjs',
      '@mikro-orm/core',
      '@mikro-orm/decorators',
      `@mikro-orm/${mikroOrmDriver(options.db)}` as PackageName,
    ]);
  };
}

function addMappedTypesDependencyIfApplies(options: ResourceOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (
      options.type === 'graphql-code-first' ||
      !host.exists(PACKAGE_JSON_PATH)
    ) {
      return;
    }
    if (options.type === 'rest') {
      if (getPackageJsonDependency(host, '@nestjs/swagger')) {
        options.isSwaggerInstalled = true;
        return;
      }
    }
    installIfNotInstalled(host, context, ['@nestjs/mapped-types']);
  };
}
