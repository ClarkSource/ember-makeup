import { addon } from './lib/utils/ember-cli-entities';
import BroccoliDebug from 'broccoli-debug';
import { register } from './plugins/preprocessor-registry';
import Addon from 'ember-cli/lib/models/addon';
import {
  computeOptions,
  MakeupOptions,
  FinalMakeupOptions
} from './lib/options';
import Project from 'ember-cli/lib/models/project';
import EmberCSSModulesPlugin from './plugins/ember-css-modules';
import EmberApp from 'ember-cli/lib/broccoli/ember-app';
import { Class as BroccoliFileCreator } from 'broccoli-file-creator';
import BroccoliMergeTrees from 'broccoli-merge-trees';
import { BroccoliNode } from 'broccoli-plugin';
import { EmberMakeupConfig } from '../addon/config';

const addonPrototype = addon({
  name: require(`${__dirname}/../package`).name as string,

  makeupOptions: (undefined as unknown) as FinalMakeupOptions,

  parentAddon: (undefined as unknown) as Addon | undefined,

  get debugTree() {
    return BroccoliDebug.buildDebugCallback(this.name);
  },

  included(includer) {
    this.computeOptions(includer);

    this._super.included.call(this, includer);
  },

  computeOptions(includer: Addon | Project | EmberApp) {
    if (this.makeupOptions) return;

    this.makeupOptions = computeOptions(
      includer.options && (includer.options.makeup as MakeupOptions | undefined)
    );

    if (this.belongsToAddon()) {
      this.parentAddon = includer as Addon;
    }
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

  /**
   * Integrate with ember-css-modules.
   *
   * @see https://github.com/salsify/ember-css-modules/blob/master/docs/PLUGINS.md#plugins
   */
  createCssModulesPlugin(parent: Addon | Project) {
    this.computeOptions(parent);

    return new EmberCSSModulesPlugin(parent, this);
  },

  treeForAddon(tree: BroccoliNode): BroccoliNode {
    const originalTree = this.debugTree(
      this._super.treeForAddon.call(this, tree),
      'treeForAddon:input'
    );
    const configModuleName = `${this.name}/config`;
    const config: EmberMakeupConfig = this.makeupOptions;
    const configFile = new BroccoliFileCreator(
      `${configModuleName}.js`,
      `define.exports('${configModuleName}', { default: ${JSON.stringify(
        config
      )} });`
    );
    const mergedTree = this.debugTree(
      new BroccoliMergeTrees([originalTree, configFile], {
        annotation: 'ember-makeup:merge-config'
      }),
      'treeForAddon:output'
    );

    return mergedTree;
  }
});

export default addonPrototype;

export type EmberMakeupAddon = typeof addonPrototype & Addon;
