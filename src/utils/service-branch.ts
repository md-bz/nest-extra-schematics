export interface ServiceBranchOptions {
  orm?: string;
  crud?: boolean;
  db?: string;
}

export function serviceBranch({
  orm,
  crud,
  db,
}: ServiceBranchOptions): string | null {
  if (!crud) {
    return null;
  }
  if (orm === 'drizzle') {
    return 'drizzle';
  }
  if (orm === 'typeorm') {
    return db === 'mongodb' ? 'typeorm-mongo' : 'typeorm-sql';
  }
  if (orm === 'mongoose') {
    return 'mongoose';
  }
  return null;
}

const BRANCHES = 'drizzle|typeorm-sql|typeorm-mongo|mongoose';
const SERVICE_BRANCH_DIR = new RegExp(`^/service/(${BRANCHES})/`);
const SERVICE_PREFIX = new RegExp(`^/service/(?:${BRANCHES}/)?`);

export function isServiceTemplate(path: string): boolean {
  return path.startsWith('/service/');
}

export function matchServiceBranch(path: string): string | null {
  return path.match(SERVICE_BRANCH_DIR)?.[1] ?? null;
}

export function stripServiceBranch(path: string): string {
  return path.replace(SERVICE_PREFIX, '/');
}
