import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import type { SchematicOptions } from './schematic.schema.js';
const factoryContent = `import { join, Path, strings } from '@angular-devkit/core';
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
} from '@angular-devkit/schematics';
import { formatFiles } from '../../utils/format-files.rule.js';
import { normalizeToKebabOrSnakeCase } from '../../utils/formatting.js';
import { Location, NameParser } from '../../utils/name.parser.js';
import { mergeSourceRoot } from '../../utils/source-root.helpers.js';
import { classify } from '@angular-devkit/core/src/utils/strings';
import type { FooOptions } from './foo.schema.js';

export function main(options: FooOptions): Rule {
  options = transform(options);
  return chain([
    mergeSourceRoot(options),
    mergeWith(generate(options)),
    options.format === true ? formatFiles() : noop(),
  ]);
}

function transform(options: FooOptions): FooOptions {
  const target: FooOptions = Object.assign({}, options);
  if (!target.name) {
    throw new SchematicsException('Option (name) is required.');
  }
  const location: Location = new NameParser().parse(target);
  target.name = normalizeToKebabOrSnakeCase(location.name);
  target.path = normalizeToKebabOrSnakeCase(location.path);

  target.specFileSuffix = normalizeToKebabOrSnakeCase(
    options.specFileSuffix ?? 'test',
  );

  target.path = target.flat
    ? target.path
    : join(target.path as Path, target.name);
  return target;
}

function generate(options: FooOptions): Source {
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
`;

describe('Schematic Factory', () => {
  const runner: SchematicTestRunner = new SchematicTestRunner(
    '.',
    path.join(process.cwd(), 'src/collection.json'),
  );

  it('should generate appropriate files ', async () => {
    const options: SchematicOptions = {
      name: 'foo',
      skipImport: true,
    };
    const tree = await runner.runSchematic('schematic', options);
    const files = tree.files;
    expect(files).toEqual([
      '/lib/schema.json',
      '/lib/foo.factory.spec.ts',
      '/lib/foo.factory.ts',
      '/lib/foo.schema.d.ts',
    ]);
  });
  it('should manage name only', async () => {
    const options: SchematicOptions = {
      name: 'foo',
      flat: false,
      skipImport: true,
    };
    const tree: UnitTestTree = await runner.runSchematic('schematic', options);

    const files: string[] = tree.files;
    expect(
      files.find((filename) => filename === '/lib/foo/foo.factory.ts'),
    ).not.toBeUndefined();
    expect(tree.readContent('/lib/foo/foo.factory.ts')).toEqual(factoryContent);
  });

  it('should manage name as a path', async () => {
    const options: SchematicOptions = {
      name: 'bar/foo',
      flat: false,
      skipImport: true,
    };
    const tree: UnitTestTree = await runner.runSchematic('schematic', options);

    const files: string[] = tree.files;
    expect(
      files.find((filename) => filename === '/bar/foo/foo.factory.ts'),
    ).not.toBeUndefined();
    console.log(tree.readContent('/bar/foo/foo.factory.ts'));
    expect(tree.readContent('/bar/foo/foo.factory.ts')).toEqual(factoryContent);
  });
});
