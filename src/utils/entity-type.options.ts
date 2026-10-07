import { classify } from '@angular-devkit/core/src/utils/strings';
import pluralize from 'pluralize';

export const ORMS = ['mongoose', 'typeorm', 'drizzle', 'mikroorm'] as const;

export type Orm = (typeof ORMS)[number];

/**
 * The derived booleans every factory branches on. Both resource and user
 * computed these identically, and the orm whitelist itself appeared a few more
 * times inline — this is the single place either question is answered.
 */
export function ormFlags(orm?: string, db?: string) {
  const hasOrm = ORMS.includes(orm as Orm);
  const isMongoose = orm === 'mongoose';
  const isTypeOrm = orm === 'typeorm';
  const isDrizzle = orm === 'drizzle';
  const isMikroOrm = orm === 'mikroorm';
  return {
    isMongoose,
    isTypeOrm,
    isDrizzle,
    isMikroOrm,
    hasOrm,
    isStringId: isMongoose || ((isTypeOrm || isMikroOrm) && db === 'mongodb'),
    mikroOrmMongo: isMikroOrm && db === 'mongodb',
  };
}

export function hasOrm(orm?: string): boolean {
  return ORMS.includes(orm as Orm);
}

export function entityTypeOptions(name: string, orm?: string) {
  const isMongoose = orm === 'mongoose';
  const withOrm = hasOrm(orm);
  const entity = pluralize.singular(classify(name));
  const entityType = isMongoose ? `${entity}Document` : entity;
  const file = pluralize.singular(name);
  return {
    entityType,
    entityPath:
      isMongoose || orm === 'drizzle'
        ? `./schemas/${file}.schema`
        : `./entities/${file}.entity`,
    hasOrm: withOrm,
    returnOneType: withOrm ? `Promise<${entityType}>` : 'string',
    returnListType: withOrm ? `Promise<${entityType}[]>` : 'string',
    returnNullableType: withOrm ? `Promise<${entityType} | null>` : 'string',
  };
}
