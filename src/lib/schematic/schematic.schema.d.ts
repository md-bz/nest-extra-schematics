export interface SchematicOptions {
  /**
   * Nest schematic name.
   */
  name: string;

  /**
   * Specifies if a spec file is generated.
   */
  spec?: boolean;
  /**
   * Specifies the file suffix of spec files.
   * @default "spec"
   */
  specFileSuffix?: string;

  /**
   * The path to create the schematic.
   */
  path?: string;

  /**
   * Flag to indicate if a directory is created.
   */
  flat?: boolean;

  /**
   * Format generated files using Prettier if available.
   */
  format?: boolean;

  /**
   * Directive to insert declaration in collection.
   */
  skipImport?: boolean;
}
