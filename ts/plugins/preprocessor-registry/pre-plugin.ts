import { Plugin, ToTreeOptions } from 'ember-cli-preprocessor-registry';
import broccoliPostcss from 'broccoli-postcss';
import { BroccoliNode } from 'broccoli-plugin';
import { EmberMakeupAddon } from '../../addon';
import { expandComponentShorthandPlugin } from '../postcss';

export default class PrePlugin implements Plugin {
  ext = ['css', 'scss'];
  name = 'ember-makeup:pre';

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
    const expandComponentShorthandTree = broccoliPostcss(tree, {
      browsers: this.owner.project.targets.browsers,
      plugins: [
        {
          module: expandComponentShorthandPlugin
        }
      ]
    });

    // Passing as part of the options object above unfortunately does not work
    // correctly, because the `undefined` is ignored.
    expandComponentShorthandTree.extensions = this.ext;
    expandComponentShorthandTree.targetExtension = undefined;

    return this.owner.debugTree(expandComponentShorthandTree, 'pre-plugin');
  }
}
