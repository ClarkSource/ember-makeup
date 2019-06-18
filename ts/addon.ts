import { join } from 'path';
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
import BroccoliMergeTrees from 'broccoli-merge-trees';
import { BroccoliNode } from 'broccoli-plugin';
import {
  configCreatorJS,
  configCreatorCSS
} from './plugins/broccoli/config-creator';

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

    if ((this.parent as Addon).parent) {
      this.parentAddon = includer as Addon;
    }
  },

  shouldIncludeChildAddon(childAddon): boolean {
    const disabledAddons = ['ember-css-modules', 'ember-cli-sass'];
    if (disabledAddons.includes(childAddon.name)) {
      return false;
    }

    return this._super.shouldIncludeChildAddon.call(this, childAddon);
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

  themes: {
    clark: {
      'contextual-component': {
        background: {
          $light: 'white',
          $dark: 'black'
        },
        color: {
          $light: 'black',
          $dark: 'white'
        },
        actual: {
          $light: '"light"',
          $dark: '"dark"'
        },
        'style-applied': '"Yes"'
      },

      context: {
        light: 'light',
        dark: 'dark'
      }
    }
  },

  filePathForTheme(themeName: string) {
    return `${this.name}/${themeName}.css`;
  },

  treeForAddon(tree: BroccoliNode): BroccoliNode {
    const originalTree = this.debugTree(
      this._super.treeForAddon.call(this, tree),
      'treeForAddon:input'
    );

    // Only run for the root app.
    if (this.parentAddon) return originalTree;

    const configFile = configCreatorJS(`${this.name}/config`, {
      options: this.makeupOptions,
      themePaths: Object.fromEntries(
        Object.keys(this.themes).map(themeName => [
          themeName,
          join('/', this.filePathForTheme(themeName))
        ])
      )
    });

    const mergedTree = this.debugTree(
      new BroccoliMergeTrees([originalTree, configFile], {
        annotation: 'ember-makeup:merge-config'
      }),
      'treeForAddon:output'
    );

    return mergedTree;
  },

  treeForPublic() {
    // Only run for the root app.
    if (this.parentAddon) return undefined;

    return this.debugTree(
      configCreatorCSS({
        getFileName: themeName => this.filePathForTheme(themeName),
        contextClassNamePrefix: this.makeupOptions.contextClassNamePrefix,
        themes: this.themes
      }),
      'treeForStyles:output'
    );
  }
});

export default addonPrototype;

export type EmberMakeupAddon = typeof addonPrototype & Addon;
