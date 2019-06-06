import Plugin, { PluginHooks, Options } from 'ember-css-modules/lib/plugin';
import {
  composesContextPlugin,
  expandComponentShorthandPlugin
} from '../postcss';
import { EmberMakeupAddon } from '../../addon';
import Project from 'ember-cli/lib/models/project';
import Addon from 'ember-cli/lib/models/addon';

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
