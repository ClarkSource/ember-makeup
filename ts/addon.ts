import { addon } from './lib/utils/ember-cli-entities';
import BroccoliDebug from 'broccoli-debug';
import { register } from './plugins/preprocessor-registry';
import Addon from 'ember-cli/lib/models/addon';
import { computeOptions, MakeupOptions } from './lib/options';
import Project from 'ember-cli/lib/models/project';
import EmberCSSModulesPlugin from './plugins/ember-css-modules';

const addonPrototype = addon({
  name: require(`${__dirname}/../package`).name as string,

  makeupOptions: (undefined as unknown) as MakeupOptions,

  parentAddon: (undefined as unknown) as Addon | undefined,

  get debugTree() {
    return BroccoliDebug.buildDebugCallback(this.name);
  },

  included(includer) {
    this.makeupOptions = computeOptions(
      includer.options && (includer.options.makeup as MakeupOptions | undefined)
    );

    if (this.belongsToAddon()) {
      this.parentAddon = includer as Addon;
    }

    this._super.included.call(this, includer);
  },

  belongsToAddon() {
    return Boolean((this.parent as Addon).parent);
  },

  /**
   * Integrate with other CSS processors, like ember-cli-sass.
   *
   * @see https://github.com/ember-cli/ember-cli-preprocess-registry#addon-usage
   */
  setupPreprocessorRegistry(type, registry) {
    register(this, type, registry);
  },

  getIntermediateOutputPath() {
    return this.makeupOptions.intermediateOutputPath;
  },

  /**
   * Integrate with ember-css-modules.
   *
   * @see https://github.com/salsify/ember-css-modules/blob/master/docs/PLUGINS.md#plugins
   */
  createCssModulesPlugin(parent: Addon | Project) {
    return new EmberCSSModulesPlugin(parent);
  }
});

export default addonPrototype;

export type EmberMakeupAddon = typeof addonPrototype & Addon;
