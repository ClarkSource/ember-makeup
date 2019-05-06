import { Plugin } from 'ember-cli-preprocessor-registry';
import _addon from '../addon';
import Addon from 'ember-cli/lib/models/addon';
import broccoliPostcss from 'broccoli-postcss';
import postcssPlugin, { Usage } from '../postcss-plugin';

type EmberMakeupAddon = typeof _addon & Addon;

export default class PreprocessorRegistryPlugin implements Plugin {
  ext = 'css';
  name = 'ember-makeup';

  private addon: EmberMakeupAddon;

  constructor(addon: EmberMakeupAddon) {
    this.addon = addon;
  }

  toTree(tree: unknown) {
    const cfgToEnv = broccoliPostcss(tree, {
      browsers: this.addon.project.targets.browsers,
      plugins: [
        {
          module: postcssPlugin,
          options: {
            reportUsage(usage: Usage) {
              console.log(usage);
            }
          }
        }
      ]
    });

    return this.addon.debugTree(cfgToEnv, 'preprocess');
  }
}
