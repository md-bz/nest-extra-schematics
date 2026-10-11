import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodeDependencyType } from '../../src/utils/dependencies.utils.js';
import {
  PACKAGE_JSON_PATH,
  PACKAGE_VERSIONS,
  PackageName,
  SEQUELIZE_DRIVER_PACKAGE,
  SQL_DRIVER_PACKAGE,
  installIfNotInstalled,
  sequelizeDriver,
} from '../../src/utils/install-deps.utils.js';

const treeWith = (packageJson: Record<string, unknown>) => {
  const tree = Tree.empty();
  tree.create(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
  return tree;
};

const parse = (tree: Tree) => JSON.parse(tree.read(PACKAGE_JSON_PATH)!.toString());

const context = () =>
  ({ addTask: () => {} }) as unknown as SchematicContext;

describe('PACKAGE_VERSIONS', () => {
  it('should pin every entry to a real version range', () => {
    for (const [name, version] of Object.entries(PACKAGE_VERSIONS)) {
      // '*' would let any new major land on the next install
      expect(version, `${name} should not be '*'`).not.toBe('*');
      expect(version, `${name} should be a version range`).toMatch(
        /^(\^|~\d|\d)/,
      );
    }
  });

  it('should keep the mikro-orm packages on one shared version', () => {
    const mikro = Object.entries(PACKAGE_VERSIONS).filter(([name]) =>
      name.startsWith('@mikro-orm/'),
    );
    expect(mikro.length).toBeGreaterThan(1);
    const core = PACKAGE_VERSIONS['@mikro-orm/core'];
    for (const [name, version] of mikro) {
      // nestjs trails the rest and is versioned on its own
      if (name === '@mikro-orm/nestjs') continue;
      // a mismatched core and driver pair breaks at bootstrap
      expect(version, `${name} must match @mikro-orm/core`).toBe(core);
    }
  });
});

describe('driver tables', () => {
  it('should map every sql database to a known package', () => {
    for (const db of ['postgres', 'mysql', 'sqlite']) {
      expect(SQL_DRIVER_PACKAGE[db]).toBeDefined();
      expect(SEQUELIZE_DRIVER_PACKAGE[db]).toBeDefined();
    }
  });

  it('should fall back to sqlite3 for an unknown database', () => {
    expect(sequelizeDriver(undefined)).toBe('sqlite3');
    expect(sequelizeDriver('nope')).toBe('sqlite3');
  });
});

describe('installIfNotInstalled', () => {
  it('should add missing packages with their pinned version', () => {
    const tree = treeWith({ name: 'app' });
    installIfNotInstalled(tree, context(), ['typeorm', 'pg']);
    const pkg = parse(tree);
    expect(pkg.dependencies['typeorm']).toBe(PACKAGE_VERSIONS['typeorm']);
    expect(pkg.dependencies['pg']).toBe(PACKAGE_VERSIONS['pg']);
  });

  it('should leave a package the project already has alone', () => {
    const tree = treeWith({
      name: 'app',
      dependencies: { typeorm: '0.3.20' },
    });
    installIfNotInstalled(tree, context(), ['typeorm' as PackageName]);
    expect(parse(tree).dependencies['typeorm']).toBe('0.3.20');
  });

  it('should not add to a tree without a package.json', () => {
    const tree = Tree.empty();
    expect(() =>
      installIfNotInstalled(tree, context(), ['typeorm']),
    ).not.toThrow();
    expect(tree.exists(PACKAGE_JSON_PATH)).toBe(false);
  });

  it('should honour the dependency type', () => {
    const tree = treeWith({ name: 'app' });
    installIfNotInstalled(tree, context(), ['drizzle-kit'], NodeDependencyType.Dev);
    const pkg = parse(tree);
    expect(pkg.devDependencies['drizzle-kit']).toBe(
      PACKAGE_VERSIONS['drizzle-kit'],
    );
    expect(pkg.dependencies).toBeUndefined();
  });
});