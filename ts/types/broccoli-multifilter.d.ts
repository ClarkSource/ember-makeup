import BroccoliPlugin, { BroccoliNode } from 'broccoli-plugin';

interface BroccoliMultifilterOptions {
  name?: string;
  annotation?: string;
}

/**
 * On rebuild, `buildAndCache` may re-use the output from the previous build
 * instead of calling the callback, provided that none of the files or
 * directories (and their contents, recursively) identified by `dependencyPaths`
 * have changed.
 *
 * You must include the main input file itself in `dependencyPaths`. Therefore,
 * `dependencyPaths` must always be non-empty. For example, if each
 * `inputFilePath` is the relative path to an input file (as is typical),
 * you might return
 *
 * ```ts
 * {
 *   dependencies: [
 *     [path.join(this.inputPaths[0], inputFilePath)].concat(
 *       dependenciesReturnedByTheCompiler
 *     )
 *   ]
 * }
 * ```
 */
interface BuildFileCallbackReturnValue {
  dependencies: string[];
}

/**
 * Your callback function to rebuild the file identified by `inputFilePath` and
 * place the output file(s) into `outputDirectory`. It is important that you
 * write into `outputDirectory` and not into `this.outputPath`.
 *
 * Every input file will get its own `outputDirectory`, which will be empty on
 * each rebuild. After calling your callbacks for each `inputFilePath`,
 * `buildAndCache` will merge the `outputDirectories` for all `inputFilePaths`
 * into the plugin's output (`this.outputPath`), similar to
 * `broccoli-merge-trees` with `{ overwrite: false }`.
 *
 * The callback function must return an object (or a Promise to an object) of
 * matching the `BuildFileCallbackReturnValue` interface:
 *
 * ```ts
 * {
 *   dependencies: dependencyPaths
 * }
 * ```
 */
type BuildFileCallback = (
  inputFilePath: string,
  outputDirectory: string
) => BuildFileCallbackReturnValue | Promise<BuildFileCallbackReturnValue>;

/**
 * This is a helper base class for Broccoli plugins similar to
 * `broccoli-filter`. The `broccoli-filter` base class maps 1 input file into 1
 * output file at a time. As a result, plugins for compilers that have include
 * directives to include other dependent files cannot use `broccoli-filter`,
 * since `broccoli-filter`'s caching logic cannot accomodate dependencies.
 *
 * By contrast, `broccoli-multifilter` allows you to provide a list of
 * dependencies for each input file, thereby mapping `m` input files into `n`
 * output files at a time.
 */
declare abstract class BroccoliMultifilter extends BroccoliPlugin {
  constructor(inputNodes: BroccoliNode[], options?: BroccoliMultifilterOptions);

  /**
   * For each `inputFilePath`, call `buildFileCallback` in sequence.
   * This returns a promise, so be sure to await it in the `build` method.
   *
   * @param inputFilePaths An array of strings identifying input files.
   *   While you will typically use input file paths relative to
   *   `this.inputPaths[0]`, `BroccoliMultifilter` makes no assumption about the
   *   meaning of these strings and simply treats them as opaque identifiers.
   * @param buildFileCallback Your callback function to rebuild the file
   *   identified by `inputFilePath` and place the output file(s) into
   *   `outputDirectory`. It is important that you write into `outputDirectory`
   *   and not into `this.outputPath`.
   */
  protected buildAndCache(
    inputFilePaths: string[],
    buildFileCallback: BuildFileCallback
  ): Promise<unknown>;

  abstract build(): Promise<unknown>;
}

export = BroccoliMultifilter;
