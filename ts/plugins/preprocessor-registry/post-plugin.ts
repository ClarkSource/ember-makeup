import BroccoliMergeTrees from 'broccoli-merge-trees';
import BroccoliMultiPostCSS from 'broccoli-multi-postcss';
import { BroccoliNode } from 'broccoli-plugin';
import { Plugin, ToTreeOptions } from 'ember-cli-preprocessor-registry';

import { EmberMakeupAddon } from '../../addon';
import { cfgToVarPlugin } from '../postcss';

export default class PostPreprocessorPlugin implements Plugin {
  // eslint-disable-next-line unicorn/prevent-abbreviations
  ext = ['css'];

  name = 'ember-makeup:post';

  private owner: EmberMakeupAddon;

  constructor(owner: EmberMakeupAddon) {
    this.owner = owner;
  }

  toTree(
    input: BroccoliNode,
    _inputDirectory: string,
    _outputDirectory: string,
    _options: ToTreeOptions
  ) {
    const cfgToVarTree = new BroccoliMultiPostCSS(input, {
      browsers: this.owner.project.targets.browsers,
      plugins: [
        {
          module: cfgToVarPlugin,
          options: {
            customPropertyPrefix: this.owner.makeupOptions.customPropertyPrefix
          }
        }
      ]
    });

    return this.owner.debugTree(
      new BroccoliMergeTrees([cfgToVarTree, this.owner.treeForConfig()]),
      'post-plugin'
    );
  }
}
