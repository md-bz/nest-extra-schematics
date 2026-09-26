import { classify } from '@angular-devkit/core/src/utils/strings';
import pluralize from 'pluralize';

export function entityTypeOptions(name: string, orm?: string) {
  const isMongoose = orm === 'mongoose';
  const hasOrm = orm === 'mongoose' || orm === 'typeorm';
  const entity = pluralize.singular(classify(name));
  const entityType = isMongoose ? `${entity}Document` : entity;
  const file = pluralize.singular(name);
  return {
    entityType,
    entityPath: isMongoose
      ? `./schemas/${file}.schema`
      : `./entities/${file}.entity`,
    hasOrm,
    returnOneType: hasOrm ? `Promise<${entityType}>` : 'string',
    returnListType: hasOrm ? `Promise<${entityType}[]>` : 'string',
    returnNullableType: hasOrm ? `Promise<${entityType} | null>` : 'string',
  };
}
