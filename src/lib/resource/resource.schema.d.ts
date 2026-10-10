import { Path } from '@angular-devkit/core';
import type { ParsedFields } from '../../utils/fields.js';

export interface ResourceOptions {
  /**
   * The name of the resource.
   */
  name: string;
  /**
   * The path to create the resource.
   */
  path?: string | Path;
  /**
   * The source root path
   */
  sourceRoot?: string;
  /**
   * Application language.
   */
  language?: string;
  /**
   * Specifies if spec files are generated.
   */
  spec?: boolean;
  /**
   * Specifies the file suffix of spec files.
   * @default "spec"
   */
  specFileSuffix?: string;
  /**
   * The path to insert the module declaration.
   */
  module?: Path;
  /**
   * Metadata name affected by declaration insertion.
   */
  metadata?: string;
  /**
   * Directive to insert declaration in module.
   */
  skipImport?: boolean;
  /**
   * The transport layer.
   */
  type?:
    | 'rest'
    | 'graphql-code-first'
    | 'graphql-schema-first'
    | 'microservice'
    | 'ws';
  /**
   * When true, CRUD entry points are generated.
   */
  crud?: boolean;
  /**
   * The database used by the resource ("mysql" covers both MySQL and MariaDB;
   * "none" behaves like the option was not passed).
   */
  db?: 'mongodb' | 'sqlite' | 'postgres' | 'mysql' | 'none';
  /**
   * The ORM used by the resource ("none" behaves like the option was not passed).
   */
  orm?: 'mongoose' | 'typeorm' | 'drizzle' | 'mikroorm' | 'sequelize' | 'none';
  /**
   * Flag to indicate if a directory is created.
   */
  flat?: boolean;
  /**
   * When true, "@nestjs/swagger" dependency is installed in the project.
   */
  isSwaggerInstalled?: boolean;
  /**
   * Format generated files using Prettier if available.
   */
  format?: boolean;
  /**
   * Comma-separated "name:type" entity fields, where type is one of string,
   * text, int, float, bool, date, json, uuid. A trailing "?" makes the field
   * optional. Prompted for interactively.
   * @example "title:string,body:text,views:int?,published:date?"
   */
  fields?: string;
  /**
   * Internal: the parsed "fields" spec, filled in by transform().
   */
  parsedFields?: ParsedFields;
}
