import { Path } from '@angular-devkit/core';

export interface AuthOptions {
  /**
   * The name of the auth module.
   */
  name: string;
  /**
   * The path to create the auth module.
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
   * The authentication method ("jwt" for now).
   */
  method?: 'jwt';
  /**
   * The user field login accepts alongside the password ("email" by default;
   * anything custom leaves the user lookup for you to wire up).
   */
  usernameField?: string;
  /**
   * Flag to indicate if a directory is created.
   */
  flat?: boolean;
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
   * Format generated files using Prettier if available.
   */
  format?: boolean;
}
