const byDb = {
  postgres: {
    drizzleEntry: 'node-postgres',
    drizzleDbType: 'NodePgDatabase',
  },
  sqlite: {
    drizzleEntry: 'better-sqlite3',
    drizzleDbType: 'BetterSQLite3Database',
  },
  mysql: {
    drizzleEntry: 'mysql2',
    drizzleDbType: 'MySql2Database',
  },
};

export function drizzleOptions(db?: string) {
  return (
    byDb[db as keyof typeof byDb] ?? {
      drizzleEntry: '',
      drizzleDbType: '',
    }
  );
}
