import { parseFields } from '../../src/utils/fields.js';

/**
 * One float type per database, whatever the orm calls it: an 8-byte double
 * everywhere except sqlite, whose only floating point type is real.
 */
const EXPECTED = {
  postgres: {
    typeorm: "type: 'double precision'",
    drizzle: "doublePrecision('score')",
    mikroorm: "type: 'double'",
    sequelize: 'DataType.DOUBLE',
  },
  sqlite: {
    typeorm: "type: 'real'",
    drizzle: "real('score')",
    mikroorm: "type: 'float'",
    sequelize: 'DataType.FLOAT',
  },
  mysql: {
    typeorm: "type: 'double'",
    drizzle: "double('score')",
    mikroorm: "type: 'double'",
    sequelize: 'DataType.DOUBLE',
  },
} as const;

describe('float column normalization', () => {
  for (const [db, byOrm] of Object.entries(EXPECTED)) {
    it(`should use the same float precision for every orm on ${db}`, () => {
      for (const [orm, expected] of Object.entries(byOrm)) {
        const parsed = parseFields('score:float', { orm, db });
        const rendered =
          orm === 'drizzle' ? parsed.drizzleBody : parsed.entityBody;
        expect(rendered, `${orm} on ${db}`).toContain(expected);
      }
    });
  }

  it('should keep float optional and validated as a number', () => {
    const parsed = parseFields('score:float?', { orm: 'typeorm', db: 'postgres' });
    expect(parsed.dtoBody).toContain('@IsOptional()');
    expect(parsed.dtoBody).toContain('@IsNumber()');
    expect(parsed.drizzleBody).toBe(
      "  score: doublePrecision('score'),\n",
    );
  });
});
