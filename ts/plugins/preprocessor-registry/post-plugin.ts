import { Plugin, ToTreeOptions } from 'ember-cli-preprocessor-registry';
import broccoliPostcss from 'broccoli-postcss';
import cfgToVarPlugin, { Usage } from '../postcss/cfg-to-var';
import { BroccoliNode } from 'broccoli-plugin';
import { EmberMakeupAddon } from '../../addon';

export default class PostPlugin implements Plugin {
  // eslint-disable-next-line unicorn/prevent-abbreviations
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
