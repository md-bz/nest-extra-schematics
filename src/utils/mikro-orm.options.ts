const byDb = {
  postgres: 'postgresql',
  sqlite: 'sqlite',
  mysql: 'mysql',
  mongodb: 'mongodb',
};

export function mikroOrmDriver(db?: string) {
  return byDb[db as keyof typeof byDb] ?? 'postgresql';
}
