import { join, Path, strings } from '@angular-devkit/core';
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
import type { <%= classify(name) %>Options } from './<%= (lowercased(name)) %>.schema.js';

export function main(options: <%= classify(name) %>Options): Rule {
  options = transform(options);
  return chain([
    mergeSourceRoot(options),
    mergeWith(generate(options)),
    options.format === true ? formatFiles() : noop(),
  ]);
}

function transform(options: <%= classify(name) %>Options): <%= classify(name) %>Options {
  const target: <%= classify(name) %>Options = Object.assign({}, options);
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

function generate(options: <%= classify(name) %>Options): Source {
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
