import { Plugin as PostCSSPlugin } from 'postcss';
import Addon from 'ember-cli/lib/models/addon';
import Project from 'ember-cli/lib/models/project';

export interface PluginHooks {
  /**
   * Very similar to an addon's `config` hook, a plugin's `config` hook is
   * invoked with the current build environment and its parent's base
   * ember-css-modules configuration. Also like the `Addon#config` hook,
   * a plugin can return a hash of configuration options which will be deeply
   * merged with the base config, with the parent's own values always winning
   * out when there's a conflict. For more complex changes, the plugin can
   * directly mutate the `baseOptions` hash.
   *
   * @param env
   * @param baseOptions
   */
  config?(env: string, baseOptions: Options): Options | void;

  /**
   * Invoked each time a build or rebuild of the parent's styles begins.
   */
  buildStart?(): void;

  /**
   * Invoked each time a build or rebuild of the parent's styles ends,
   * regardless of whether it succeeded or failed.
   */
  buildEnd?(): void;

  /**
   * Invoked each time a build or rebuild of the parent's styles successfully
   * completes.
   */
  buildSuccess?(): void;

  /**
   * Invoked each time a build or rebuild of the parent's styles fails for any
   * reason.
   */
  buildError?(): void;
}

/**
 * @see https://github.com/salsify/ember-css-modules/blob/master/docs/PLUGINS.md
 */
export default class Plugin {
  constructor(parent: Addon | Project);

  /**
   * Indicates whether this plugin's parent is an addon (which may be useful
   * when determining things such as output paths).
   */
  isForAddon(): boolean;

  /**
   * The inverse of `isForAddon()` — indicates whether this plugin's parent is
   * an app.
   */
  isForApp(): void;

  /**
   * Given a config hash, adds the given PostCSS plugins to that configuration,
   * either as a `before`, `after` or `postprocess` plugin. Particularly useful
   * within the `config` hook.
   *
   * `after` and `postprocess` plugins are inserted after already registered
   * plugins.
   * `before` plugins are prepended to already registered plugins. This means
   * for before that if you called this method with plugins that are dependent
   * on order of execution, you would either have to register the plugin that
   * needs to be executed last as the first plugin, like so:
   *
   * ```js
   * class ExamplePlugin extends Plugin {
   *   config(env, baseConfig) {
   *     this.addPostcssPlugin(baseConfig, 'before', require('postcss-nested'));
   *
   *     // needs to be executed *before* `postcss-nested` and is thus registered, *after* it
   *     this.addPostcssPlugin(baseConfig, 'before', require('postcss-nested-ancestors'));
   *   }
   * }
   * ```
   *
   * Because this is confusing, you should rather pass both plugins in one go,
   * like so:
   *
   * ```js
   * class ExamplePlugin extends Plugin {
   *   config(env, baseConfig) {
   *     this.addPostcssPlugin(
   *       baseConfig,
   *       'before',
   *       require('postcss-nested-ancestors'),
   *       require('postcss-nested')
   *     );
   *   }
   * }
   * ```
   *
   * `addPostcssPlugin` is variadic and accepts as many plugins as you like.
   * The order is preserved, when passing all plugins in one go.
   *
   * @param config
   * @param type
   * @param plugins
   */
  addPostcssPlugin(
    config: Options,
    type: 'after' | 'before' | 'postprocess',
    ...plugins: PostCSSPlugin<any>[]
  ): void;
}

export type Options = Record<string, any>;
