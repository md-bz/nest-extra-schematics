<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

nest cli is an awesome tool, yet i find myself writing the same codes a lot, thats why i made this project extending <a href="https://github.com/nestjs/schematics" target="blank">nest-schematic</a>.

## Installation

```bash
$ npm install --save-dev nest-extra-schematics
```

## Features

### Schematic

an schematic for creating more schematics, in this project or <a href="https://github.com/nestjs/schematics" target="blank">nest-schematic</a>.

**usage:**

```bash
$ nest g -c nest-extra-schematics schematic schematic
```

### Resource

extended from nest schematic, has database (mongodb, sqlite, postgres, mysql/mariadb) and ORM (mongoose, typeorm, drizzle, mikroorm) integration.

**usage:**

```bash
$ nest g -c nest-extra-schematics res notes
```

#### Fields

every resource is prompted for its entity fields. pass them as a comma-separated
`name:type` list, suffix a field with `?` to make it optional. leave the answer
empty to get the `exampleField` placeholder.

types: `string`, `text`, `int`, `float`, `bool`, `date`, `json`, `uuid`

`id` is reserved for the primary key.

fields land on the entity/schema, the create dto (class-validator + `@IsOptional`)
and, for graphql, on the object type / input type or the SDL. the update dto and
input still come from `PartialType`, so they follow along for free.

note: `date` and `json` degrade to `String` under graphql — mapping them to
`GraphQLISODateTime`/`graphql-type-json` would pull in dependencies.

### User

extended from resource, has some basic properties for user (username, email, first/last name, phone number, password), password hashing and a route for updating password.

**usage:**

```bash
$ nest g -c nest-extra-schematics u users
```

### Auth

JWT auth (Passport) wired to the user resource. Two methods: `jwt` (password login) or `code` (a login code your own email/sms module delivers — it must provide `CODE_SENDER` with `sendCode(to, code)` and a `CODE_STORE`). Login identifies the user by `email` by default. Codes allow 3 attempts and expire after `CODE_TTL_MINUTES` (default 10).

**usage:**

```bash
$ nest g -c nest-extra-schematics auth
```

## License

Nest is [MIT licensed](LICENSE).
