import { Plugin, ToTreeOptions } from 'ember-cli-preprocessor-registry';
import _addon from '../../addon';
import Addon from 'ember-cli/lib/models/addon';
import broccoliPostcss from 'broccoli-postcss';
import cfgToVarPlugin, { Usage } from '../postcss/cfg-to-var';
import { BroccoliNode } from 'broccoli-plugin';

type EmberMakeupAddon = typeof _addon & Addon;

export default class PostPlugin implements Plugin {
  ext = ['css', 'yml'];
  name = 'ember-makeup:post';

  private owner: EmberMakeupAddon;

  constructor(owner: EmberMakeupAddon) {
    this.owner = owner;
  }

  toTree(
    tree: BroccoliNode,
    _inputDirectory: string,
    _outputDirectory: string,
    _options: ToTreeOptions
  ) {
    const cfgToVarTree = broccoliPostcss(tree, {
      browsers: this.owner.project.targets.browsers,
      plugins: [
        {
          module: cfgToVarPlugin,
          options: {
            reportUsage(usage: Usage) {
              console.log(usage);
            }
          }
        }
      ]
    });

    return this.owner.debugTree(cfgToVarTree, 'post-plugin');
  }
}
