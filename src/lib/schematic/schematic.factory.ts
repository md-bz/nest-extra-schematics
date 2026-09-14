import { join, normalize, Path, strings } from '@angular-devkit/core';
import {
  apply,
  chain,
  mergeWith,
  noop,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  Source,
  template,
  url,
  filter,
  Tree,
} from '@angular-devkit/schematics';
import { formatFiles } from '../../utils/format-files.rule.js';
import { normalizeToKebabOrSnakeCase } from '../../utils/formatting.js';
import { Location, NameParser } from '../../utils/name.parser.js';
import { mergeSourceRoot } from '../../utils/source-root.helpers.js';
import { SchematicOptions } from './schematic.schema.js';
import { classify } from '@angular-devkit/core/src/utils/strings';

export function main(options: SchematicOptions): Rule {
  options = transform(options);
  return chain([
    mergeSourceRoot(options),
    mergeWith(generate(options)),
    addDeclarationToCollection(options),
    options.format === true ? formatFiles() : noop(),
  ]);
}

function transform(options: SchematicOptions): SchematicOptions {
  const target: SchematicOptions = Object.assign({}, options);
  if (!target.name) {
    throw new SchematicsException('Option (name) is required.');
  }
  const location: Location = new NameParser().parse(target);
  target.name = normalizeToKebabOrSnakeCase(location.name);
  target.path = normalizeToKebabOrSnakeCase(location.path);

  target.specFileSuffix = normalizeToKebabOrSnakeCase(
    options.specFileSuffix ?? 'test',
  );

  if (target.path === '/') target.path = '/lib';

  target.path = target.flat
    ? target.path
    : join(target.path as Path, target.name);
  return target;
}

function generate(options: SchematicOptions): Source {
  return (context: SchematicContext) =>
    apply(url('./files'), [
      options.spec
        ? noop()
        : filter((path) => {
            const suffix = '.__specFileSuffix__.ts';
            return !path.endsWith(suffix);
          }),
      template({
        ...strings,
        ...options,
        lowercased: (name: string) => {
          const classifiedName = classify(name);
          return (
            classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1)
          );
        },
      }),
      move(options.path!),
    ])(context);
}

function addDeclarationToCollection(options: SchematicOptions): Rule {
  return (tree: Tree) => {
    if (options.skipImport !== undefined && options.skipImport) {
      return tree;
    }

    const collection = findCollection(tree, normalize(options.path ?? ''));

    if (!collection) {
      throw new SchematicsException(`Collection file does not exist.`);
    }

    const collectionContent = JSON.parse(tree.read(collection)!.toString());

    if (collectionContent.schematics[options.name])
      throw new SchematicsException(
        `Schematic ${options.name} already exists.`,
      );

    collectionContent.schematics[options.name] = {
      name: options.name,
      factory: `./lib/${options.name}/${options.name}.factory#main`,
      description: `Create a Nest ${options.name}.`,
      schema: `./lib/${options.name}/schema.json`,
    };
    tree.overwrite(collection, JSON.stringify(collectionContent, null, 2));
    return tree;
  };
}

function findCollection(tree: Tree, path?: Path): Path | null {
  if (!path) {
    return null;
  }

  const dir = tree.getDir(path);
  const file = dir.subfiles.find((file) => {
    return file.valueOf() === 'collection.json';
  });

  if (file) {
    return join(path, 'collection.json');
  }

  return findCollection(tree, dir.parent?.path);
}
