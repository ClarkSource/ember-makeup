import BroccoliPlugin, { BroccoliNode } from 'broccoli-plugin';
import { Plugin, ProcessOptions, SourceMapOptions } from 'postcss';

export default function broccoliPostcss(
  tree: BroccoliNode,
  options?: Options
): BroccoliPlugin & ExtensionConfig;

/**
 * By default, if the options passed into the `Filter` constructor contain a
 * property `extensions`, and `targetExtension` is supplied, the first matching
 * extension in the list is replaced with the `targetExtension` option's value.
 *
 * @see https://github.com/stefanpenner/broccoli-persistent-filter#options
 * @see https://github.com/jeffjewiss/broccoli-postcss/blob/f802b7ceb62d5328d4f492a622bc64f3c77e14d5/index.js#L11-L12
 */
interface ExtensionConfig {
  /**
   * An array of file extensions to process, e.g. `['css', 'scss']`
   */
  extensions?: string[];

  /**
   * The file extension of the corresponding output files, e.g. `'css'`.
   */
  targetExtension?: string;
}

interface Options extends ProcessOptions {
  /**
   * A list of plugin objects to be used by Postcss (a minimum of 1 plugin is
   * required).
   */
  plugins: ObjectFormPlugin[];

  /**
   * A list of browsers to support. Follows the browserslist format. Will be
   * passed to each plugin and can be overridden using the plugin’s options.
   */
  browsers?: string[];

  /**
   * An object of options to describe how Postcss should handle source maps.
   *
   * @default `{ inline: false, annotation: false }`
   */
  map?: SourceMapOptions;

  /**
   * Whitelist of files to be processed.
   */
  include?: FileFilterList;

  /**
   * Blacklist of files to not be processed.
   */
  exclude?: FileFilterList;
}

type FileFilterList = (string | RegExp | ((filename: string) => boolean))[];

interface ObjectFormPlugin<T = Record<string, any>> {
  module: Plugin<T>;
  options?: T;
}
