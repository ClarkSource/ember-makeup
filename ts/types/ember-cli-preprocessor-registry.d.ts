import BroccoliPlugin, { BroccoliNode } from 'broccoli-plugin';

export default class Registry {
  /**
   * Adds the provided plugin to the registry for the type specified.
   *
   * @example
   * ```js
   * class SpecialSauce {
   *   get name() { return 'special-sauce'; }
   *
   *   toTree(tree) {
   *     // return new tree after processing
   *   }
   * }
   *
   * registry.add('js', new SpecialSauce);
   * ```
   */
  add(type: string, plugin: Plugin): void;

  /**
   * Returns an array of all plugins that are registered for a given type.
   */
  load(type: string): Plugin[];

  /**
   * Returns an array of all known extensions for a given type.
   */
  extensionsForType(type: string): string[];

  /**
   * Returns an array of all registered plugins for a given type.
   */
  registeredForType(type: string): Plugin[];

  /**
   * Removes the provided plugin from the specified type listing.
   */
  remove(type: string, plugin: Plugin): void;
}

export interface Plugin {
  name: string;
  // ext: string | string[];
  toTree(
    tree: BroccoliNode,
    inputDirectory: string,
    outputDirectory: string,
    options: ToTreeOptions
  ): BroccoliPlugin;
}

export interface ToTreeOptions {
  outputPaths: Record<string, string>;
  registry: unknown;
  minifyCSS: {
    processImport: boolean;
    relativeTo: string;
  };
}
