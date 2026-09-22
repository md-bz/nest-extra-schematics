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

extended from nest schematic, has database (mongodb, sqlite, postgres, mysql/mariadb) and ORM (mongoose, typeorm) integration.

**usage:**

```bash
$ nest g -c nest-extra-schematics res notes
```

### User

extended from resource, has some basic properties for user (username, email, first/last name, phone number, password), password hashing and a route for updating password.

**usage:**

```bash
$ nest g -c nest-extra-schematics u users
```

## License

Nest is [MIT licensed](LICENSE).
