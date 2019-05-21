import { addon } from './lib/utils/ember-cli-entities';
import BroccoliDebug from 'broccoli-debug';
import { PrePlugin, PostPlugin } from './plugins/preprocessor-registry';
import Addon from 'ember-cli/lib/models/addon';
import { computeOptions, MakeupOptions } from './lib/options';
import Project from 'ember-cli/lib/models/project';
import EmberCSSModulesPlugin from './plugins/ember-css-modules';

export default addon({
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

    this._super.included.apply(this, arguments);
  },

  belongsToAddon() {
    return Boolean((this.parent as Addon).parent);
  },

  setupPreprocessorRegistry(type, registry) {
    if (type !== 'parent') return;

    const TYPE = 'css';

    // Get a list of all already registered plugins.
    const registeredPlugins = Array.from(registry.registeredForType(TYPE));

    // Remove all already registered plugins.
    for (const plugin of registeredPlugins) registry.remove(TYPE, plugin);

    // Put the PrePlugin first.
    registry.add(TYPE, new PrePlugin(this));

    // Add all removed plugins back in.
    for (const plugin of registeredPlugins) registry.add(TYPE, plugin);

    // Add the PostPlugin.
    // The list now looks like: [PrePlugin, ..., PostPlugin]
    registry.add(TYPE, new PostPlugin(this));

    console.log(registeredPlugins);
  },

  getIntermediateOutputPath() {
    return this.makeupOptions.intermediateOutputPath;
  },

  /**
   *
   *
   * @see https://github.com/salsify/ember-css-modules/blob/master/docs/PLUGINS.md#plugins
   */
  createCssModulesPlugin(parent: Addon | Project) {
    return new EmberCSSModulesPlugin(parent);
  }
});
