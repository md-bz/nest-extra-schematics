import { classify } from '@angular-devkit/core/src/utils/strings';
import pluralize from 'pluralize';

/**
 * Name helpers every template needs. Spreading this keeps templates terse
 * (`<%= plural(lowercased(name)) %>`) and stops each factory from writing its
 * own copy.
 */
export const templateHelpers = {
  lowercased: (name: string): string => {
    const classifiedName = classify(name);
    return classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1);
  },
  singular: (name: string): string => pluralize.singular(name) as string,
  plural: (name: string): string => pluralize.plural(name) as string,
};