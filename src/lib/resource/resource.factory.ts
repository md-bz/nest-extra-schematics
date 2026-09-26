import { join, normalize, Path, strings } from '@angular-devkit/core';
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
  ArrayLiteralExpression,
  CallExpression,
  createSourceFile,
  Node,
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
  SyntaxKind,
} from 'typescript';
import { ScriptTarget } from 'typescript';
import {
  DeclarationOptions,
  ModuleDeclarator,
  ModuleFinder,
} from '../../index.js';
import {
  addPackageJsonDependency,
  getPackageJsonDependency,
  NodeDependencyType,
} from '../../utils/dependencies.utils.js';
import { formatFiles } from '../../utils/format-files.rule.js';
import { normalizeToKebabOrSnakeCase } from '../../utils/formatting.js';
import { entityTypeOptions } from '../../utils/entity-type.options.js';
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
        mergeSourceRoot(options),
        addDeclarationToModule(options),
        addEntityToAppModuleIfApplies(options),
        mergeWith(generate(options)),
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
  if (target.db === 'mongodb' && target.orm === undefined) {
    target.orm = 'mongoose';
  }
  if (target.orm === 'mongoose' && target.db === undefined) {
    target.db = 'mongodb';
  }
  if (target.orm === 'typeorm' && target.db === undefined) {
    target.db = 'mongodb';
  }
  const sqlDbs = ['sqlite', 'postgres', 'mysql'];
  if (target.db !== undefined && sqlDbs.includes(target.db) && target.orm === undefined) {
    target.orm = 'typeorm';
  }
  if (
    (target.db !== undefined &&
      target.db !== 'mongodb' &&
      !sqlDbs.includes(target.db)) ||
    (target.orm !== undefined &&
      target.orm !== 'mongoose' &&
      target.orm !== 'typeorm') ||
    (target.db !== undefined && sqlDbs.includes(target.db) && target.orm === 'mongoose')
  ) {
    throw new SchematicsException(
      'Only "--db mongodb" with "--orm mongoose" or "--orm typeorm", or "--db sqlite"/"--db postgres"/"--db mysql" (MySQL/MariaDB) with "--orm typeorm" is supported for now.',
    );
  }

  return target;
}

function generate(options: ResourceOptions): Source {
  const isMongoose = options.orm === 'mongoose';
  const isTypeOrm = options.orm === 'typeorm';
  return (context: SchematicContext) =>
    apply(url(join('./files' as Path, options.language!)), [
      filter((path) => {
        if (path.includes('/schemas/')) {
          return isMongoose && !!options.crud;
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
          // mongoose uses schemas/ instead, so no entity file
          return !isMongoose && !!options.crud;
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
        isMongoose,
        isTypeOrm,
        ...entityTypeOptions(options.name, options.orm),
        lowercased: (name: string) => {
          const classifiedName = classify(name);
          return (
            classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1)
          );
        },
        singular: (name: string) => pluralize.singular(name) as string,
        ent: (name: string) => name + '.entity',
      }),
      move(options.path!),
    ])(context);
}

export function addDeclarationToModule(options: ResourceOptions): Rule {
  return (tree: Tree) => {
    if (options.skipImport !== undefined && options.skipImport) {
      return tree;
    }
    options.module =
      new ModuleFinder(tree).find({
        name: options.name,
        path: options.path as Path,
      }) ?? undefined;
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
    try {
      if (!getPackageJsonDependency(host, 'class-validator')) {
        addPackageJsonDependency(host, {
          type: NodeDependencyType.Default,
          name: 'class-validator',
          version: '*',
        });
        context.addTask(new NodePackageInstallTask());
      }
    } catch {
      // ignore if "package.json" not found
    }
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

function addMongooseDependenciesIfApplies(options: ResourceOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (options.orm !== 'mongoose') {
      return;
    }
    try {
      let installed = false;
      for (const name of ['@nestjs/mongoose', 'mongoose']) {
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

function addTypeOrmDependenciesIfApplies(options: ResourceOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (options.orm !== 'typeorm') {
      return;
    }
    try {
      let installed = false;
      // ponytail: each db needs its own driver package alongside typeorm;
      // transform guarantees db is set (and in this map) when orm is typeorm
      const driverByDb: Record<string, string> = {
        mongodb: 'mongodb',
        postgres: 'pg',
        mysql: 'mysql2',
        sqlite: 'better-sqlite3',
      };
      const names = ['@nestjs/typeorm', 'typeorm', driverByDb[options.db!]];
      for (const name of names) {
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

function addMappedTypesDependencyIfApplies(options: ResourceOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    try {
      if (options.type === 'graphql-code-first') {
        return;
      }
      if (options.type === 'rest') {
        const nodeDependencyRef = getPackageJsonDependency(
          host,
          '@nestjs/swagger',
        );
        if (nodeDependencyRef) {
          options.isSwaggerInstalled = true;
          return;
        }
      }
      const nodeDependencyRef = getPackageJsonDependency(
        host,
        '@nestjs/mapped-types',
      );
      if (!nodeDependencyRef) {
        addPackageJsonDependency(host, {
          type: NodeDependencyType.Default,
          name: '@nestjs/mapped-types',
          version: '*',
        });
        context.addTask(new NodePackageInstallTask());
      }
    } catch {
      // ignore if "package.json" not found
    }
  };
}
