import { SchematicsException } from '@angular-devkit/schematics';

export type FieldKind =
  | 'string'
  | 'text'
  | 'int'
  | 'float'
  | 'bool'
  | 'date'
  | 'json'
  | 'uuid';

export const FIELD_KINDS: readonly FieldKind[] = [
  'string',
  'text',
  'int',
  'float',
  'bool',
  'date',
  'json',
  'uuid',
];

const aliases: Record<string, FieldKind> = {
  str: 'string',
  string: 'string',
  text: 'text',
  int: 'int',
  integer: 'int',
  number: 'int',
  float: 'float',
  double: 'float',
  bool: 'bool',
  boolean: 'bool',
  date: 'date',
  datetime: 'date',
  json: 'json',
  jsonb: 'json',
  uuid: 'uuid',
};

const tsType: Record<FieldKind, string> = {
  string: 'string',
  text: 'string',
  int: 'number',
  float: 'number',
  bool: 'boolean',
  date: 'Date',
  json: 'Record<string, unknown>',
  uuid: 'string',
};

const validator: Record<FieldKind, string> = {
  string: 'IsString',
  text: 'IsString',
  int: 'IsInt',
  float: 'IsNumber',
  bool: 'IsBoolean',
  date: 'IsDate',
  json: 'IsObject',
  uuid: 'IsString',
};

// ponytail: @nestjs/graphql only re-exports Int/Float/ID; String and Boolean are
// the JS globals. Date and JSON would need GraphQLISODateTime/graphql-type-json,
// so they degrade to String instead of adding dependencies the user didn't ask for
const graphqlType: Record<FieldKind, string> = {
  string: 'String',
  text: 'String',
  int: 'Int',
  float: 'Float',
  bool: 'Boolean',
  date: 'String',
  json: 'String',
  uuid: 'ID',
};

// ponytail: schema-first has no scalar registry either, so date/json degrade to String
const sdlType: Record<FieldKind, string> = {
  string: 'String',
  text: 'String',
  int: 'Int',
  float: 'Float',
  bool: 'Boolean',
  date: 'String',
  json: 'String',
  uuid: 'ID',
};

// graphql-type imports @nestjs/graphql actually exports; the rest are globals
const graphqlScalars = new Set(['Int', 'Float', 'ID']);

const mongoType: Record<FieldKind, string> = {
  string: 'String',
  text: 'String',
  int: 'Number',
  float: 'Number',
  bool: 'Boolean',
  date: 'Date',
  json: "'Mixed'",
  uuid: 'String',
};

const mikroType: Record<FieldKind, string> = {
  string: 'string',
  text: 'text',
  int: 'number',
  float: 'float',
  bool: 'boolean',
  date: 'Date',
  json: 'json',
  uuid: 'string',
};

const typeormColumn = {
  postgres: {
    string: { type: 'varchar', length: 255 },
    text: { type: 'text' },
    int: { type: 'int' },
    float: { type: 'double precision' },
    bool: { type: 'boolean' },
    date: { type: 'timestamp' },
    json: { type: 'jsonb' },
    uuid: { type: 'uuid' },
  },
  sqlite: {
    string: { type: 'varchar', length: 255 },
    text: { type: 'text' },
    int: { type: 'integer' },
    float: { type: 'real' },
    bool: { type: 'boolean' },
    date: { type: 'datetime' },
    json: { type: 'simple-json' },
    uuid: { type: 'varchar', length: 36 },
  },
  mysql: {
    string: { type: 'varchar', length: 255 },
    text: { type: 'text' },
    int: { type: 'int' },
    float: { type: 'double' },
    bool: { type: 'boolean' },
    date: { type: 'datetime' },
    json: { type: 'json' },
    uuid: { type: 'varchar', length: 36 },
  },
} as Record<string, Record<FieldKind, { type: string; length?: number }>>;

const drizzleColumn = {
  postgres: {
    string: ['text', ''],
    text: ['text', ''],
    int: ['integer', ''],
    float: ['real', ''],
    bool: ['boolean', ''],
    date: ['timestamp', ''],
    json: ['jsonb', ''],
    uuid: ['uuid', ''],
  },
  sqlite: {
    string: ['text', ''],
    text: ['text', ''],
    int: ['integer', ''],
    float: ['real', ''],
    bool: ['integer', ", { mode: 'boolean' }"],
    date: ['integer', ", { mode: 'timestamp_ms' }"],
    json: ['text', ", { mode: 'json' }"],
    uuid: ['text', ''],
  },
  mysql: {
    string: ['varchar', ', { length: 255 }'],
    text: ['text', ''],
    int: ['int', ''],
    float: ['double', ''],
    bool: ['boolean', ''],
    date: ['datetime', ''],
    json: ['json', ''],
    uuid: ['varchar', ', { length: 36 }'],
  },
} as Record<string, Record<FieldKind, [string, string]>>;

export interface Field {
  prop: string;
  column: string;
  kind: FieldKind;
  optional: boolean;
  tsType: string;
}

export interface FieldContext {
  orm?: string;
  db?: string;
  type?: string;
}

/**
 * Ready-to-print class/table bodies. Templates stay dumb and every ORM quirk
 * lives in this file.
 */
export interface ParsedFields {
  fields: Field[];
  dtoBody: string;
  graphqlBody: string;
  sdlBody: string;
  entityBody: string;
  mongooseBody: string;
  drizzleBody: string;
  drizzleColumnFns: string[];
  validatorImports: string;
  transformerImports: string;
  graphqlDecorators: string;
  graphqlDecoratorsAndTypes: string;
}

export function parseFields(
  spec?: string,
  ctx: FieldContext = {},
): ParsedFields {
  const fields = (spec ?? '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => parseToken(token));

  if (!fields.length) {
    return empty(ctx);
  }

  // one blank line between properties, so decorators read as a block per field
  const body = (render: (field: Field) => string[]) =>
    fields.map((f) => render(f).join('\n')).join('\n\n') + '\n';

  const prop = (field: Field) =>
    `${field.prop}${field.optional ? '?' : '!'}: ${field.tsType};`;
  const graphql = (field: Field) =>
    `@Field(() => ${graphqlType[field.kind]}${field.optional ? ', { nullable: true }' : ''})`;

  const validators = new Set<string>();
  let needsTypeDecorator = false;
  for (const field of fields) {
    validators.add(validator[field.kind]);
    if (field.optional) validators.add('IsOptional');
    if (field.kind === 'date') needsTypeDecorator = true;
  }

  return {
    fields,
    dtoBody: body((f) => [
      ...(f.optional ? ['  @IsOptional()'] : []),
      `  @${validator[f.kind]}()`,
      ...(f.kind === 'date' ? ['  @Type(() => Date)'] : []),
      `  ${prop(f)}`,
    ]),
    graphqlBody: body((f) => [`  ${graphql(f)}`, `  ${prop(f)}`]),
    sdlBody: fields
      .map((f) => `  ${f.prop}: ${sdlType[f.kind]}${f.optional ? '' : '!'}`)
      .join('\n') + '\n',
    entityBody: entityBody(ctx, body, prop),
    mongooseBody: mongooseBody(ctx, body, prop, graphql),
    drizzleBody: drizzleBody(fields, ctx.db),
    drizzleColumnFns: [
      ...new Set(
        fields.map((f) => drizzleColumnFn(ctx.db, f.kind)),
      ),
    ],
    validatorImports: [...validators].sort().join(', '),
    transformerImports: needsTypeDecorator ? "import { Type } from 'class-transformer';" : '',
    graphqlDecorators: graphqlImport(['ObjectType', 'Field'], fields),
    graphqlDecoratorsAndTypes: graphqlImport(['InputType', 'Field'], fields),
  };
}

function graphqlImport(base: string[], fields: Field[] = []): string {
  const types = [
    ...new Set(
      fields
        .map((f) => graphqlType[f.kind])
        .filter((t) => graphqlScalars.has(t)),
    ),
  ].sort();
  return [...base, ...types].join(', ');
}

function entityBody(
  ctx: FieldContext,
  body: (render: (field: Field) => string[]) => string,
  prop: (field: Field) => string,
): string {
  if (ctx.orm === 'mikroorm') {
    return body((f) => [
      `  ${mikroDecorator(f)}`,
      `  ${prop(f)}`,
    ]);
  }
  if (ctx.orm === 'typeorm') {
    return body((f) => [
      `  ${typeormDecorator(f, ctx.db)}`,
      `  ${prop(f)}`,
    ]);
  }
  return body((f) => [`  ${prop(f)}`]);
}

function mongooseBody(
  ctx: FieldContext,
  body: (render: (field: Field) => string[]) => string,
  prop: (field: Field) => string,
  graphql: (field: Field) => string,
): string {
  const isCodeFirst = ctx.type === 'graphql-code-first';
  return body((f) => [
    ...(isCodeFirst ? [`  ${graphql(f)}`] : []),
    `  ${mongoDecorator(f)}`,
    `  ${prop(f)}`,
  ]);
}

function drizzleBody(fields: Field[], db?: string): string {
  return (
    fields
      .map(
        (f) =>
          `  ${f.prop}: ${drizzleCall(db, f.kind, f.column)}${f.optional ? '' : '.notNull()'},`,
      )
      .join('\n') + '\n'
  );
}

/** No fields: keep the historical exampleField placeholder everywhere. */
function empty(ctx: FieldContext): ParsedFields {
  const isCodeFirst = ctx.type === 'graphql-code-first';
  return {
    fields: [],
    dtoBody: '  @IsString()\n  exampleField!: string;\n',
    graphqlBody:
      "  @Field(() => Int, { description: 'Example field (placeholder)' })\n  exampleField!: number;\n",
    sdlBody: '  # Example field (placeholder)\n  exampleField: Int\n',
    entityBody:
      ctx.orm === 'mikroorm'
        ? '  @Property()\n  exampleField!: string;\n'
        : '  @Column()\n  exampleField!: string;\n',
    mongooseBody:
      (isCodeFirst ? '  @Field({ nullable: true })\n' : '') +
      '  @Prop()\n  exampleField!: string;\n',
    drizzleBody: "  exampleField: text('exampleField').notNull(),\n",
    drizzleColumnFns: ['text'],
    validatorImports: 'IsString',
    transformerImports: '',
    graphqlDecorators: 'ObjectType, Field, Int',
    graphqlDecoratorsAndTypes: 'InputType, Int, Field',
  };
}

function parseToken(token: string): Field {
  const optional = token.endsWith('?');
  const body = optional ? token.slice(0, -1).trim() : token;
  const parts = body.split(':').map((part) => part.trim());

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new SchematicsException(
      `Invalid field "${token}". Expected "name:type", e.g. "title:string".`,
    );
  }

  const [rawName, rawKind] = parts;
  const kind = aliases[rawKind.toLowerCase()];
  if (!kind) {
    throw new SchematicsException(
      `Unknown field type "${rawKind}" in "${token}". Supported: ${FIELD_KINDS.join(', ')}.`,
    );
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(rawName)) {
    throw new SchematicsException(
      `Invalid field name "${rawName}" in "${token}". Use letters, digits and underscores.`,
    );
  }
  if (rawName.toLowerCase() === 'id') {
    throw new SchematicsException(
      'Field name "id" is reserved for the primary key.',
    );
  }

  return {
    prop: camelCase(rawName),
    column: snakeCase(rawName),
    kind,
    optional,
    tsType: tsType[kind],
  };
}

function mongoDecorator(field: Field): string {
  const options = [`type: ${mongoType[field.kind]}`];
  if (!field.optional) options.push('required: true');
  if (field.column !== field.prop) options.unshift(`name: '${field.column}'`);
  return `@Prop({ ${options.join(', ')} })`;
}

function mikroDecorator(field: Field): string {
  const options = [`type: '${mikroType[field.kind]}'`];
  if (field.column !== field.prop) options.unshift(`name: '${field.column}'`);
  if (field.optional) options.push('nullable: true');
  return `@Property({ ${options.join(', ')} })`;
}

function typeormDecorator(field: Field, db?: string): string {
  if (!db || db === 'mongodb') {
    // ponytail: mongo is schemaless, so only the column name is worth pinning
    return field.column === field.prop
      ? '@Column()'
      : `@Column({ name: '${field.column}' })`;
  }
  const column = (typeormColumn[db] ?? typeormColumn.postgres)[field.kind];
  const options = [
    `type: '${column.type}'`,
    ...(column.length ? [`length: ${column.length}`] : []),
    ...(field.optional ? ['nullable: true'] : []),
  ];
  if (field.column !== field.prop) options.unshift(`name: '${field.column}'`);
  return `@Column({ ${options.join(', ')} })`;
}

function drizzleColumnFn(db: string | undefined, kind: FieldKind): string {
  return drizzleCall(db, kind, 'x').split('(')[0];
}

function drizzleCall(
  db: string | undefined,
  kind: FieldKind,
  column: string,
): string {
  // ponytail: transform() only pairs a drizzle db with orm=drizzle; postgres
  // is the safe default for anything else
  const entry = (drizzleColumn[db as string] ?? drizzleColumn.postgres)[kind];
  return `${entry[0]}('${column}'${entry[1]})`;
}

function camelCase(value: string): string {
  return value.replace(/[_-]+(.)/g, (_, char: string) => char.toUpperCase());
}

function snakeCase(value: string): string {
  return value.replace(/([a-z\d])([A-Z])/g, '$1_$2').toLowerCase();
}
