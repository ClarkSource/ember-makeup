import Plugin, { PluginHooks, Options } from 'ember-css-modules/lib/plugin';
import {
  composesContextPlugin,
  expandComponentShorthandPlugin
} from '../postcss';

export default class EmberCSSModulesPlugin extends Plugin
  implements PluginHooks {
  config(_environment: string, baseOptions: Options) {
    this.addPostcssPlugin(
      baseOptions,
      'before',
      expandComponentShorthandPlugin,
      composesContextPlugin
    );
  }
}
