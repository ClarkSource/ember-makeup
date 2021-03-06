import Addon from 'ember-cli/lib/models/addon';
import Project from 'ember-cli/lib/models/project';
import Plugin, { PluginHooks, Options } from 'ember-css-modules/lib/plugin';

import { EmberMakeupAddon } from '../../addon';
import {
  composesContextPlugin,
  expandComponentShorthandPlugin,
  Usage
} from '../postcss';

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
  private usages: Usage[] = [];

  name = 'ember-makeup:css-modules';

  constructor(parent: Addon | Project, owner: EmberMakeupAddon) {
    super(parent);
    this.owner = owner;
  }

  private flushUsages() {
    this.usages = [];
  }

  private collectUsage(usage: Usage) {
    this.usages.push(usage);
  }

  private reportUsages() {
    this.owner.reportUsages(this.name, this.usages);
  }

  buildEnd() {
    this.reportUsages();
    this.flushUsages();
  }

  config(_environment: string, baseOptions: Options) {
    this.addPostcssPlugin(
      baseOptions,
      'before',
      expandComponentShorthandPlugin({
        reportUsage: usage => this.collectUsage(usage)
      }),
      composesContextPlugin(this.owner.makeupOptions)
    );
  }
}
