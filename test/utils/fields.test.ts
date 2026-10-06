import { SchematicsException } from '@angular-devkit/schematics';
import {
  parseFields,
  FIELD_KINDS,
} from '../../src/utils/fields.js';

describe('parseFields', () => {
  it('should return placeholder bodies when no spec is given', () => {
    const parsed = parseFields(undefined, { orm: 'typeorm', db: 'postgres' });
    expect(parsed.fields).toEqual([]);
    expect(parsed.dtoBody).toBe(
      '  @IsString()\n  exampleField!: string;\n',
    );
    expect(parsed.validatorImports).toBe('IsString');
    expect(parsed.drizzleBody).toBe(
      "  exampleField: text('exampleField').notNull(),\n",
    );
  });

  it('should treat an empty spec as no fields', () => {
    expect(parseFields('', {}).fields).toEqual([]);
    expect(parseFields('  ,  ,', {}).fields).toEqual([]);
  });

  it('should parse names, kinds and the optional marker', () => {
    const parsed = parseFields('title:string, views:int?', {
      orm: 'typeorm',
      db: 'postgres',
    });
    expect(parsed.fields).toEqual([
      {
        prop: 'title',
        column: 'title',
        kind: 'string',
        optional: false,
        tsType: 'string',
      },
      {
        prop: 'views',
        column: 'views',
        kind: 'int',
        optional: true,
        tsType: 'number',
      },
    ]);
  });

  it('should accept kind aliases', () => {
    expect(parseFields('a:integer,b:number,c:boolean', {}).fields.map((f) => f.kind)).toEqual([
      'int',
      'int',
      'bool',
    ]);
  });

  it('should snake_case the column and camelCase the property', () => {
    const [field] = parseFields('publishedAt:date,first_name:string', {}).fields;
    expect(parseFields('publishedAt:date,first_name:string', {}).fields[0].column).toBe('published_at');
    expect(parseFields('publishedAt:date,first_name:string', {}).fields[1].prop).toBe('firstName');
    expect(field.kind).toBe('date');
  });

  it('should throw on a malformed token', () => {
    expect(() => parseFields('title', {})).toThrow(SchematicsException);
    expect(() => parseFields('title:', {})).toThrow(SchematicsException);
    expect(() => parseFields(':string', {})).toThrow(SchematicsException);
    expect(() => parseFields('a:string:b', {})).toThrow(SchematicsException);
  });

  it('should throw on an unknown kind', () => {
    expect(() => parseFields('a:bogus', {})).toThrow(/Unknown field type "bogus"/);
  });

  it('should list the supported kinds in the error', () => {
    for (const kind of FIELD_KINDS) {
      expect(() => parseFields(`a:${kind}`, {})).not.toThrow();
    }
  });

  it('should reject invalid names and the reserved "id"', () => {
    expect(() => parseFields('2bad:string', {})).toThrow(/Invalid field name/);
    expect(() => parseFields('a-b:string', {})).toThrow(/Invalid field name/);
    expect(() => parseFields('id:string', {})).toThrow(/reserved/);
    expect(() => parseFields('ID:string', {})).toThrow(/reserved/);
  });

  describe('typeorm + postgres', () => {
    it('should emit typed columns and class-validator decorators', () => {
      const parsed = parseFields('title:string,body:text,views:int?,meta:json', {
        orm: 'typeorm',
        db: 'postgres',
      });
      expect(parsed.entityBody).toBe(
        `  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'int', nullable: true })
  views?: number;

  @Column({ type: 'jsonb' })
  meta!: Record<string, unknown>;
`,
      );
      expect(parsed.dtoBody).toBe(
        `  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsInt()
  views?: number;

  @IsObject()
  meta!: Record<string, unknown>;
`,
      );
      expect(parsed.validatorImports).toBe(
        'IsInt, IsObject, IsOptional, IsString',
      );
    });

    it('should validate dates with IsDate and convert them with @Type', () => {
      const parsed = parseFields('publishedAt:date?', {
        orm: 'typeorm',
        db: 'postgres',
      });
      expect(parsed.entityBody).toBe(
        `  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt?: Date;
`,
      );
      expect(parsed.dtoBody).toBe(
        `  @IsOptional()
  @IsDate()
  @Type(() => Date)
  publishedAt?: Date;
`,
      );
      expect(parsed.validatorImports).toBe('IsDate, IsOptional');
      expect(parsed.transformerImports).toBe(
        "import { Type } from 'class-transformer';",
      );
    });

    it('should validate floats with IsNumber', () => {
      const parsed = parseFields('score:float', {
        orm: 'typeorm',
        db: 'postgres',
      });
      expect(parsed.dtoBody).toContain('@IsNumber()');
      expect(parsed.validatorImports).toBe('IsNumber');
    });

    it('should pin the column name when it differs from the property', () => {
      const parsed = parseFields('publishedAt:date', {
        orm: 'typeorm',
        db: 'postgres',
      });
      expect(parsed.entityBody).toContain(
        "@Column({ name: 'published_at', type: 'timestamp' })",
      );
    });
  });

  describe('typeorm + mongodb', () => {
    it('should emit bare columns', () => {
      expect(
        parseFields('title:string,views:int?', {
          orm: 'typeorm',
          db: 'mongodb',
        }).entityBody,
      ).toBe(`  @Column()
  title!: string;

  @Column()
  views?: number;
`);
    });
  });

  describe('mongoose', () => {
    it('should emit required props', () => {
      expect(
        parseFields('title:string,views:int?', { orm: 'mongoose' }).mongooseBody,
      ).toBe(
        `  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: Number })
  views?: number;
`,
      );
    });

    it('should add graphql fields for code-first', () => {
      expect(
        parseFields('title:string,views:int?', {
          orm: 'mongoose',
          type: 'graphql-code-first',
        }).mongooseBody,
      ).toBe(
        `  @Field(() => String)
  @Prop({ type: String, required: true })
  title!: string;

  @Field(() => Int, { nullable: true })
  @Prop({ type: Number })
  views?: number;
`,
      );
    });
  });

  describe('mikroorm', () => {
    it('should emit typed properties', () => {
      expect(
        parseFields('title:string,views:int?', {
          orm: 'mikroorm',
          db: 'postgres',
        }).entityBody,
      ).toBe(
        `  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'number', nullable: true })
  views?: number;
`,
      );
    });
  });

  describe('drizzle', () => {
    it('should emit postgres columns', () => {
      const parsed = parseFields('title:string,views:int?,meta:json', {
        orm: 'drizzle',
        db: 'postgres',
      });
      expect(parsed.drizzleBody).toBe(
        `  title: text('title').notNull(),
  views: integer('views'),
  meta: jsonb('meta').notNull(),
`,
      );
      expect([...parsed.drizzleColumnFns].sort()).toEqual([
        'integer',
        'jsonb',
        'text',
      ]);
    });

    it('should emit sqlite columns with modes', () => {
      const parsed = parseFields('draft:bool,at:date?,meta:json', {
        orm: 'drizzle',
        db: 'sqlite',
      });
      expect(parsed.drizzleBody).toBe(
        `  draft: integer('draft', { mode: 'boolean' }).notNull(),
  at: integer('at', { mode: 'timestamp_ms' }),
  meta: text('meta', { mode: 'json' }).notNull(),
`,
      );
    });

    it('should emit mysql columns with lengths', () => {
      expect(
        parseFields('title:string,ref:uuid', {
          orm: 'drizzle',
          db: 'mysql',
        }).drizzleBody,
      ).toBe(
        `  title: varchar('title', { length: 255 }).notNull(),
  ref: varchar('ref', { length: 36 }).notNull(),
`,
      );
    });
  });

  describe('graphql', () => {
    it('should emit input fields', () => {
      expect(
        parseFields('title:string,views:int?', {
          type: 'graphql-code-first',
        }).graphqlBody,
      ).toBe(
        `  @Field(() => String)
  title!: string;

  @Field(() => Int, { nullable: true })
  views?: number;
`,
      );
    });

    it('should only import scalars @nestjs/graphql re-exports', () => {
      expect(
        parseFields('title:string,draft:bool,score:float,ref:uuid,at:date,meta:json', {
          type: 'graphql-code-first',
        }).graphqlDecorators,
      ).toBe('ObjectType, Field, Float, ID');
    });

    it('should emit SDL for schema-first', () => {
      expect(
        parseFields('title:string,views:int?', {
          type: 'graphql-schema-first',
        }).sdlBody,
      ).toBe(
        `  title: String!
  views: Int
`,
      );
    });

    it('should degrade date and json to String in SDL', () => {
      expect(
        parseFields('at:date,meta:json', { type: 'graphql-schema-first' })
          .sdlBody,
      ).toBe(
        `  at: String!
  meta: String!
`,
      );
    });
  });

  describe('no orm', () => {
    it('should emit plain properties', () => {
      expect(parseFields('title:string', {}).entityBody).toBe(
        '  title!: string;\n',
      );
    });
  });
});
