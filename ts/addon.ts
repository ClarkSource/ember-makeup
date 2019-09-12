import { join, dirname } from 'path';

import BroccoliDebug from 'broccoli-debug';
import BroccoliFunnel from 'broccoli-funnel';
import BroccoliMergeTrees from 'broccoli-merge-trees';
import BroccoliPlugin, { BroccoliNode } from 'broccoli-plugin';
import { WatchedDir } from 'broccoli-source';
import Registry from 'ember-cli-preprocessor-registry';
import EmberApp from 'ember-cli/lib/broccoli/ember-app';
import Addon from 'ember-cli/lib/models/addon';
import Project from 'ember-cli/lib/models/project';
import fromPairs from 'lodash.frompairs';

import commands from './commands';
import {
  computeOptions,
  MakeupOptions,
  FinalMakeupOptions
} from './lib/options';
import {
  configCreatorJS,
  configCreatorCSS
} from './plugins/broccoli/config-creator';
import EmberCSSModulesPlugin from './plugins/ember-css-modules';
import { Usage } from './plugins/postcss';
import { register } from './plugins/preprocessor-registry';

interface PackageJSON {
  name: string;
  version: string;
  keywords?: string[];
  makeup?: {
    name?: string;
  };
}

interface ThemePackage {
  name: string;
  package: PackageJSON;
}

export const addonName = require(`${__dirname}/../package`).name as string;

export class EmberMakeupAddon extends Addon {
  /**
   * Since `CoreObject` executes the `init` chain _during_ `super()`, the
   * `Addon` base class's `init` runs _before_ class instance property
   * assignments in the `EmberMakeupAddon` sub-class.
   *
   * Since `Addon#init` checks for the presence of `this.name`, we need to
   * assign the property here as opposed to just using a class instance property
   * assignment, like:
   *
   * ```ts
   * class EmberMakeupAddon extends Addon {
   *   name = 'ember-makeup';
   * }
   * ```
   *
   * @see https://github.com/ember-cli/ember-cli/blob/3af9f60cfe6e16caab0a972c7d25e8bb8017db26/lib/models/addon.js#L286-L288
   */
  init(...args: any[]) {
    this.name = addonName;
    super.init(...args);
  }

  makeupOptions!: FinalMakeupOptions;

  themePackages!: ThemePackage[];

  parentAddon: Addon | undefined;

  _treeForConfig!: BroccoliPlugin;

  usages: { [callsite: string]: Usage[] } = {};

  debugTree = BroccoliDebug.buildDebugCallback(this.name);

  findThemePackages() {
    const keyword = 'ember-makeup-theme';
    const { dependencies = {}, devDependencies = {} } = this.project.pkg;

    // Would be using `.flatMap()`, but it's not supported in Node 8.
    // https://node.green/#ES2019-features-Array-prototype--flat--flatMap-
    // eslint-disable-next-line unicorn/prefer-flat-map
    const packages: ThemePackage[] = ([] as string[])
      .concat(...[dependencies, devDependencies].map(Object.keys))
      .map(name => this.project.require(`${name}/package.json`) as PackageJSON)
      .filter(json => json.keywords && json.keywords.includes(keyword))
      .map(json => ({
        name: (json.makeup && json.makeup.name) || json.name,
        package: json
      }));

    if (packages.length === 0) {
      throw new Error(
        `Could not find a package with the '${keyword}' keyword.`
      );
    }
    return packages;
  }

  included(includer: Addon | Project | EmberApp) {
    this.computeOptions(includer);
    this.checkIfInstalledAtRoot();

    this.themePackages = this.findThemePackages();

    super.included(includer);
  }

  includedCommands() {
    return commands;
  }

  computeOptions(includer: Addon | Project | EmberApp) {
    if (this.makeupOptions) return;

    if (!includer.options && !this.app)
      throw new Error('Could not find parent options.');

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parentOptions = includer.options || this.app!.options;

    this.makeupOptions = computeOptions(parentOptions.makeup as
      | MakeupOptions
      | undefined);

    if ((this.parent as Addon).parent) {
      this.parentAddon = includer as Addon;
    }
  }

  checkIfInstalledAtRoot() {
    if (this.parentAddon && !this.project.findAddonByName(this.name)) {
      throw new Error(
        `You need to install '${
          this.name
        }' in your project '${this.project.name()}', because '${
          this.parentAddon.name
        }' depends on it.`
      );
    }
  }

  shouldIncludeChildAddon(childAddon: Addon): boolean {
    const disabledAddons = ['ember-css-modules', 'ember-cli-sass'];
    if (disabledAddons.includes(childAddon.name)) {
      return false;
    }

    return super.shouldIncludeChildAddon(childAddon);
  }

  /**
   * Integrate with other CSS processors, like ember-cli-sass.
   *
   * @see https://github.com/ember-cli/ember-cli-preprocess-registry#addon-usage
   */
  setupPreprocessorRegistry(type: 'self' | 'parent', registry: Registry) {
    register(this, type, registry);
  }

  /**
   * Integrate with ember-css-modules.
   *
   * @see https://github.com/salsify/ember-css-modules/blob/master/docs/PLUGINS.md#plugins
   */
  createCssModulesPlugin(parent: Addon | Project) {
    this.computeOptions(parent);

    return new EmberCSSModulesPlugin(parent, this);
  }

  reportUsages(callsite: string, usages: Usage[]) {
    this.usages[callsite] = usages;
  }

  treeForAddon(tree: BroccoliNode): BroccoliNode {
    const originalTree = this.debugTree(
      super.treeForAddon(tree),
      'treeForAddon:input'
    );

    // Only run for the root app.
    if (this.parentAddon) return originalTree;

    const configFile = configCreatorJS(`${this.name}/config`, {
      options: this.makeupOptions,
      themePaths: fromPairs(
        this.themePackages.map(theme => [
          theme.name,
          join('/', this.makeupOptions.pathPrefix, `${theme.name}.css`)
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
  }

  treeForConfig() {
    // Only run for the root app.
    if (this.parentAddon)
      throw new Error('`treeForConfig` must not be called for addons.');

    // Only run once and return the cached value.
    if (this._treeForConfig) return this._treeForConfig;

    const themePackageNames = this.findThemePackages();

    const themePackageSourceNodes = themePackageNames.map(
      themePackage =>
        ([
          themePackage.name,
          new WatchedDir(
            dirname(
              this.project.resolveSync(
                `${themePackage.package.name}/package.json`
              )
            ),
            { annotation: `ember-makeup:theme-source (${themePackage.name})` }
          )
        ] as unknown) as [string, BroccoliPlugin]
    );

    const tree = this.debugTree(
      new BroccoliFunnel(
        new BroccoliMergeTrees(
          themePackageSourceNodes.map(([themeName, source]) =>
            configCreatorCSS(source, {
              themeName,
              customPropertyPrefix: this.makeupOptions.customPropertyPrefix,
              contextClassNamePrefix: this.makeupOptions.contextClassNamePrefix
            })
          )
        ),
        { destDir: this.makeupOptions.pathPrefix }
      ),
      'treeForConfig:output'
    );

    this._treeForConfig = tree;

    return tree;
  }
}

export default EmberMakeupAddon;
