import { join, dirname } from 'path';

import BroccoliDebug from 'broccoli-debug';
import BroccoliFunnel from 'broccoli-funnel';
import BroccoliMergeTrees from 'broccoli-merge-trees';
import BroccoliPlugin, { BroccoliNode } from 'broccoli-plugin';
import { WatchedDir } from 'broccoli-source';
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
import { addon } from './lib/utils/ember-cli-entities';
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

const addonPrototype = addon({
  name: require(`${__dirname}/../package`).name as string,

  makeupOptions: (undefined as unknown) as FinalMakeupOptions,

  themePackages: (undefined as unknown) as ThemePackage[],

  parentAddon: (undefined as unknown) as Addon | undefined,

  get usages(): { [callsite: string]: Usage[] } {
    return {};
  },

  get debugTree() {
    return BroccoliDebug.buildDebugCallback(this.name);
  },

  findThemePackages() {
    const keyword = 'ember-makeup-theme';
    const { dependencies = {}, devDependencies = {} } = this.project.pkg;
    const packages: ThemePackage[] = [dependencies, devDependencies]
      .flatMap(Object.keys)
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
  },

  included(includer) {
    this.computeOptions(includer);

    this.themePackages = this.findThemePackages();

    this._super.included.call(this, includer);
  },

  includedCommands() {
    return commands;
  },

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

  reportUsages(callsite: string, usages: Usage[]) {
    this.usages[callsite] = usages;
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
  },

  treeForPublic() {
    // Only run for the root app.
    if (this.parentAddon) return undefined;

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

    return this.debugTree(
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
      'treeForPublic:output'
    );
  }
});

export default addonPrototype;

export const addonName = addonPrototype.name;
export type EmberMakeupAddon = typeof addonPrototype & Addon;
