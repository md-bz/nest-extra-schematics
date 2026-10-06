---
name: nest-extra-schematics
description: 'Generate NestJS CRUD resources, user entities and auth modules with real database/ORM wiring. USE WHEN: working in a NestJS app and asked to scaffold a resource/controller/service/entity/model, add a CRUD endpoint for a table or collection, set up an ORM (mongoose, typeorm, drizzle, mikro-orm), generate a user/account entity with password hashing, add JWT or OTP login, or create a new schematic — especially when the request mentions nest-extra-schematics, `nest g -c nest-extra-schematics res`, or generating a resource with entity fields.'
---

# nest-extra-schematics

A schematic collection that extends the Nest CLI's `resource`/`user` generators so
generated code is wired to a real database instead of stopping at an empty class.

**Package**: `nest-extra-schematics` (add with `npm i -D nest-extra-schematics`).
Collection entry: `<pkg>/dist/collection.json`.

| schematic     | alias | what it makes                                                        |
| ------------- | ----- | -------------------------------------------------------------------- |
| `resource`    | `res` | CRUD service/controller/resolver/gateway + entity or schema          |
| `user`        | `u`   | a `resource` with user fields, argon2 hashing, change-password route |
| `auth`        | —     | JWT (Passport) or OTP-code login wired to the user resource          |
| `application` | —     | scaffolds a Nest app (`js`, `ts`, `ts-esm`)                          |
| `schematic`   | —     | scaffolds a new schematic inside this collection                     |

## Two ways to run it — pick the right one

### Interactive (humans)

```bash
nest g -c nest-extra-schematics res notes
```

Every option is an `x-prompt`, so the CLI asks for name, transport, CRUD, entity
fields, database, and ORM in that order. Answer the prompts; do not expect flags
to work (see below).

### Non-interactive (agents, scripts, CI)

`nest g` rejects unknown flags outright — `--fields`, `--db`, `--orm`,
`--method`, `--username-field` all die with `error: unknown option`. This is a
hard limit of the Nest CLI: its commander definition whitelists about ten
options and forwards only `name`, `path`, `type`, `crud`, `spec`, `flat`,
`skip-import`, `format`, `dry-run`, `collection`, `project`. Nothing you add to
a `schema.json` gets through.

Call the underlying schematics runner directly instead:

```bash
npx @angular-devkit/schematics-cli \
  'node_modules/nest-extra-schematics/dist/collection.json:resource' \
  --name=notes --db=postgres --orm=typeorm \
  --fields='title:string,body:text,views:int?' \
  --no-dry-run
```

Notes on that command:

- The `collection:schematic` argument is one string; quote it.
- Add `--no-dry-run` or nothing hits disk. `schematics-cli` enables dry-run by
  default when the collection path is a relative or absolute local path.
- Use kebab-case for multi-word options: `--username-field=email`, not
  `--usernameField`. `schematics-cli` rejects camelCase unknown options outright.
- Generated output lands under the collection's `sourceRoot` (usually `src/`).
- If you target a local checkout rather than an installed package, point at the
  built `dist/collection.json` and make sure its own dependencies resolve — the
  runner imports the factory from wherever the collection lives.
- The schematic adds ORM/driver packages to `package.json` and registers an
  install task, so expect an `npm install` step to run afterwards.

If you cannot run either path (no CLI available), fall back to hand-writing the
entity, DTOs, service and module. Say that is what you did.

## Options

Shared by `resource` and `user` (except `fields`, which is `resource`-only):

| option                                             | values                                                                     | default            |
| -------------------------------------------------- | -------------------------------------------------------------------------- | ------------------ |
| `--name`                                           | plural resource name                                                       | `users` for `user` |
| `--type`                                           | `rest`, `graphql-code-first`, `graphql-schema-first`, `microservice`, `ws` | `rest`             |
| `--crud`                                           | `true`/`false`                                                             | `true`             |
| `--db`                                             | `none`, `mongodb`, `sqlite`, `postgres`, `mysql`                           | inferred           |
| `--orm`                                            | `none`, `mongoose`, `typeorm`, `drizzle`, `mikroorm`                       | inferred           |
| `--fields`                                         | see below (`resource` only)                                                | none               |
| `--spec`                                           | `true`/`false`                                                             | `true`             |
| `--flat`                                           | `true`/`false`                                                             | `false`            |
| `--path`, `--skip-import`, `--format`, `--dry-run` |                                                                            |                    |

`auth` takes `--name`, `--method` (`jwt` or `code`), `--username-field`
(default `email`), plus the shared `spec`/`flat`/`path`/`skip-import`/`format`.

`db` and `orm` infer each other: `mongodb` implies `mongoose`; `mongoose` implies
`mongodb`; `drizzle`/`mikroorm` default to `postgres`; a SQL `db` with no `orm`
implies `typeorm`. Invalid pairings throw — mongo+drizzle, or mongo+typeorm is
fine, but sqlite+drizzle is fine while sqlite+mongoose is not.

## Fields

`--fields` is a comma-separated `name:type` list. Suffix a field with `?` to make
it optional (`views?` → `views?: number` plus `@IsOptional()`).

Types: `string`, `text`, `int`, `float`, `bool`, `date`, `json`, `uuid`.
Aliases: `number`/`integer` → `int`, `boolean` → `bool`, `datetime` → `date`.

`id` is reserved (primary key) and rejected. Names must be identifier-safe:
letters, digits, underscores. camelCase names store snake_case — `publishedAt`
becomes column `published_at`. Each field gets a blank line between property
blocks.

**Example**

```bash
--fields='title:string,body:text,views:int?,publishedAt:date?,meta:json'
```

produces, with `--db=postgres --orm=typeorm`:

```ts
// dto/create-note.dto.ts
import { IsDate, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNoteDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsInt()
  views?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  publishedAt?: Date;

  @IsObject()
  meta!: Record<string, unknown>;
}

// entities/note.entity.ts
@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'int', nullable: true })
  views?: number;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'jsonb' })
  meta!: Record<string, unknown>;
}
```

The update DTO/input comes from `PartialType(Create…)`, so it picks the fields up
for free.

### Per-ORM field output

| orm / db           | string                   | int        | bool                        | date                             | json                  | uuid          |
| ------------------ | ------------------------ | ---------- | --------------------------- | -------------------------------- | --------------------- | ------------- |
| typeorm + postgres | `varchar(255)`           | `int`      | `boolean`                   | `timestamp`                      | `jsonb`               | `uuid`        |
| typeorm + sqlite   | `varchar(255)`           | `integer`  | `boolean`                   | `datetime`                       | `simple-json`         | `varchar(36)` |
| typeorm + mysql    | `varchar(255)`           | `int`      | `boolean`                   | `datetime`                       | `json`                | `varchar(36)` |
| typeorm + mongodb  | `@Column()` (schemaless) |            |                             |                                  |                       |               |
| mongoose           | `String, required`       | `Number`   | `Boolean`                   | `Date`                           | `'Mixed'`             | `String`      |
| mikro-orm          | `type: 'string'`         | `'number'` | `'boolean'`                 | `'Date'`                         | `'json'`              | `'string'`    |
| drizzle + postgres | `text`                   | `integer`  | `boolean`                   | `timestamp`                      | `jsonb`               | `uuid`        |
| drizzle + sqlite   | `text`                   | `integer`  | `integer({mode:'boolean'})` | `integer({mode:'timestamp_ms'})` | `text({mode:'json'})` | `text`        |
| drizzle + mysql    | `varchar(255)`           | `int`      | `boolean`                   | `datetime`                       | `json`                | `varchar(36)` |

Under graphql, `date` and `json` degrade to `String` in both code-first
(`@Field`) and schema-first (SDL) output — mapping them to
`GraphQLISODateTime`/`graphql-type-json` would add dependencies nobody asked for.
Only `Int`, `Float` and `ID` get imported from `@nestjs/graphql`; `String` and
`Boolean` are globals. If you need real scalars, import them yourself after
generating.

## Wiring the generator performs

Beyond writing files, it edits existing project files. Expect and review these:

- **typeorm** — appends the entity class to the `entities` array inside
  `TypeOrmModule.forRoot({…})` and adds an `import` line to the app module.
- **drizzle** — appends the schema path to the `schema` array in
  `drizzle.config.ts`, creating that file (with the right `dialect`) if absent.
  Refuses when the existing config uses a different `dialect`: drizzle-kit reads
  one dialect per config, so the table would be registered but never migrated.
  One database per project.
- **mikro-orm** — creates `mikro-orm.config.ts` if it does not already exist.
- **all** — adds the ORM, its driver package, `class-validator` and
  `@nestjs/mapped-types` to `package.json` as needed, then installs.

Services map duplicate-key errors to `ConflictException` (codes `11000`,
`23505`, `ER_DUP_ENTRY`, `SQLITE_CONSTRAINT*`) and throw `NotFoundException` on
missing rows. Return types are concrete (`Promise<Note>`), not `any`.

## Gotchas

- **`user` rejects `--fields`.** Its field set is fixed (username, email,
  firstName, lastName, phoneNumber, password), and there is no `fields` prompt —
  its own entity/DTO files would overwrite whatever `resource` generated. Passing
  the flag is a hard error, not a silent no-op. To add a field, generate a plain
  `resource` and add your own columns, or edit the generated user entity by hand.
- **Non-interactive runs skip prompts entirely.** When stdin is not a TTY the
  prompt provider is never registered, so unanswered options fall back to schema
  defaults and you silently get an empty `exampleField` entity. This is why
  `nest g res notes < /dev/null` produces a bare class instead of erroring.
- **`--db=none` / `--orm=none`** mean "no database", not "unset". They are the
  escape hatch for generating a plain service.
- **Empty fields is valid.** Answering the prompt with nothing keeps the legacy
  `exampleField` placeholder, which is what all pre-existing tests assert.
- **JavaScript is unsupported** by `resource`; passing `language: js` throws.
- **`format`** only does anything if Prettier is installed in the target project.

## Verifying what you generated

After a run, read the entity/schema and the create DTO and confirm the fields and
types look right. Then compile — `npx tsc --noEmit -p tsconfig.json` — because the
generator does not typecheck its own output, and mismatches between an ORM's
expected decorator options and what a field maps to only surface at compile time.
