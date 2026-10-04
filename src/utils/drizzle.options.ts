const byDb = {
  postgres: {
    drizzleEntry: 'node-postgres',
    drizzleDbType: 'NodePgDatabase',
    tableFn: 'pgTable',
    idFn: 'integer',
    schemaModule: 'drizzle-orm/pg-core',
    idColumn: "integer('id').primaryKey().generatedAlwaysAsIdentity()",
  },
  sqlite: {
    drizzleEntry: 'better-sqlite3',
    drizzleDbType: 'BetterSQLite3Database',
    tableFn: 'sqliteTable',
    idFn: 'integer',
    schemaModule: 'drizzle-orm/sqlite-core',
    idColumn: "integer('id').primaryKey({ autoIncrement: true })",
  },
  mysql: {
    drizzleEntry: 'mysql2',
    drizzleDbType: 'MySql2Database',
    tableFn: 'mysqlTable',
    idFn: 'int',
    schemaModule: 'drizzle-orm/mysql-core',
    idColumn: "int('id').autoincrement().primaryKey()",
  },
};

export function drizzleOptions(db?: string) {
  return (
    byDb[db as keyof typeof byDb] ?? {
      drizzleEntry: '',
      drizzleDbType: '',
      tableFn: '',
      idFn: '',
      schemaModule: '',
      idColumn: '',
    }
  );
}

/**
 * Import list for the generated schema file: the table fn, the id column fn
 * and every column fn the requested fields need.
 */
export function drizzleSchemaOptions(
  db: string | undefined,
  columnFns: string[],
): { tableFn: string; idColumn: string; schemaImport: string } {
  const o = drizzleOptions(db);
  const names = [...new Set([o.tableFn, o.idFn, ...columnFns])].sort();
  return {
    tableFn: o.tableFn,
    idColumn: o.idColumn,
    schemaImport: `import { ${names.join(', ')} } from '${o.schemaModule}';`,
  };
}
