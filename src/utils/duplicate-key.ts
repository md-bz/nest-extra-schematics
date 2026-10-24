/**
 * Written once per generated project to <sourceRoot>/common/duplicate-key.ts,
 * so every ORM's service imports the same check instead of carrying a copy.
 */
export const DUPLICATE_KEY_GUARD = `export function isDuplicateKey(err: unknown): boolean {
  const e = err as { name?: string; code?: string | number; driverError?: { code?: string | number }; cause?: { code?: string | number } };
  if (e?.name === 'SequelizeUniqueConstraintError') {
    return true;
  }
  const code = e?.cause?.code ?? e?.driverError?.code ?? e?.code;
  return code === '23505' || code === 'ER_DUP_ENTRY' || code === 11000 || String(code).startsWith('SQLITE_CONSTRAINT');
}`;

/** The service-side import for the guard emitted by {@link DUPLICATE_KEY_GUARD}. */
export function duplicateKeyImport(
  flat: boolean | undefined,
  isEsm: boolean,
): string {
  return `import { isDuplicateKey } from '${flat ? './common' : '../common'}/duplicate-key${isEsm ? '.js' : ''}';`;
}
