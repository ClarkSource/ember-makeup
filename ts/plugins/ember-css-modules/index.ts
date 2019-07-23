import Plugin, { PluginHooks, Options } from 'ember-css-modules/lib/plugin';
import {
  composesContextPlugin,
  expandComponentShorthandPlugin
} from '../postcss';
import { EmberMakeupAddon } from '../../addon';
import Project from 'ember-cli/lib/models/project';
import Addon from 'ember-cli/lib/models/addon';

/**
 * This is a plugin for `ember-css-modules` that adds the following PostCSS
 * plugins to the build, before the files are joined by CSS Modules:
 *
 * - expandComponentShorthandPlugin: Expands `@component` at-rule shortcuts.
 * - composesContextPlugin: Transforms `@context` at-rules to `composes`
 *   declarations.
 *
 * @see https://github.com/salsify/ember-css-modules#plugins
 */
export default class EmberCSSModulesPlugin extends Plugin
  implements PluginHooks {
  private owner: EmberMakeupAddon;

  constructor(parent: Addon | Project, owner: EmberMakeupAddon) {
    super(parent);
    this.owner = owner;
  }

  config(_environment: string, baseOptions: Options) {
    this.addPostcssPlugin(
      baseOptions,
      'before',
      expandComponentShorthandPlugin,
      composesContextPlugin(this.owner.makeupOptions)
    );
  }
}
