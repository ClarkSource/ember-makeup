import postcss from 'postcss';

export default function broccoliPostcss(tree: Tree, options?: Options): Tree;

type Tree = unknown;

interface Options {
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
  map?: postcss.SourceMapOptions;

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
  module: postcss.Plugin<T>;
  options?: T;
}
