import { join, Path, PathFragment } from '@angular-devkit/core';
import { DirEntry, Tree } from '@angular-devkit/schematics';

export class ModuleFinder {
  constructor(private tree: Tree) {}

  /**
   * Finds the module file in the given path.
   *
   * @param path - The directory to search from, walking up to the root.
   * @returns The path to the module file, or null if not found.
   */
  public find(path: Path): Path | null {
    return this.findIn(this.tree.getDir(path));
  }

  /**
   * Recursively searches for the module file in the given directory.
   *
   * @param directory - The directory to search in.
   * @returns The path to the module file, or null if not found.
   */
  private findIn(directory: DirEntry | null): Path | null {
    if (!directory) {
      return null;
    }
    const moduleFilename: PathFragment | undefined = directory.subfiles.find(
      (filename) => /\.module\.(t|j)s$/.test(filename),
    );
    return moduleFilename !== undefined
      ? join(directory.path, moduleFilename.valueOf())
      : this.findIn(directory.parent);
  }
}
