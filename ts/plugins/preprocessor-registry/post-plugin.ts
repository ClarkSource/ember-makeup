import BroccoliMergeTrees from 'broccoli-merge-trees';
import { BroccoliNode } from 'broccoli-plugin';
import broccoliPostcss from 'broccoli-postcss';
import { Plugin, ToTreeOptions } from 'ember-cli-preprocessor-registry';

import { EmberMakeupAddon } from '../../addon';
import { collectUsages } from '../broccoli/hook-broccoli-plugin';
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
    const cfgToVarTree = collectUsages(
      usages => this.owner.reportUsages(this.name, usages),
      reportUsage =>
        broccoliPostcss(input, {
          browsers: this.owner.project.targets.browsers,
          plugins: [
            {
              module: cfgToVarPlugin,
              options: {
                reportUsage,
                customPropertyPrefix: this.owner.makeupOptions
                  .customPropertyPrefix
              }
            }
          ]
        })
    );

    return this.owner.debugTree(
      new BroccoliMergeTrees([cfgToVarTree, this.owner.treeForConfig()]),
      'post-plugin'
    );
  }
}
