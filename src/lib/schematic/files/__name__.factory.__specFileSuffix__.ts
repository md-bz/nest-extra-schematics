import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import type { <%= classify(name) %>Options } from './<%= (lowercased(name)) %>.schema.js';


describe('<%= classify(name) %>Options Factory', () => {
  const runner: SchematicTestRunner = new SchematicTestRunner(
    '.',
    path.join(process.cwd(), 'src/collection.json'),
  );

  it('should be defined',async () => {
    const options: <%= classify(name) %>Options = {
      name: 'foo',
    };
    const tree = await runner.runSchematic('<%= lowercased(name) %>', options);
    expect(tree).toBeDefined();
  });

});
