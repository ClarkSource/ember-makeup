import BroccoliPlugin, { BroccoliNode } from 'broccoli-plugin';

/**
 * Copy multiple trees of files on top of each other, resulting in a single
 * merged tree.
 */
declare class BroccoliMergeTrees extends BroccoliPlugin {
  /**
   * @param inputNodes An array of nodes, whose contents will be merged.
   * @param options An object of options.
   */
  constructor(inputNodes: BroccoliNode[], options?: BroccoliMergeTrees.Options);

  private inputNodes: BroccoliNode[];

  private options: BroccoliMergeTrees.Options;
}

// @todo https://github.com/typescript-eslint/typescript-eslint/issues/60
// eslint-disable-next-line no-redeclare
declare namespace BroccoliMergeTrees {
  interface Options {
    /**
     * A note to help tell multiple plugin instances apart.
     */
    annotation?: string;

    /**
     * By default, `broccoli-merge-trees` throws an error when a file exists in
     * multiple nodes. If you pass `{ overwrite: true }`, the output will
     * contain the version of the file as it exists in the last input node that
     * contains it.
     *
     * @default false
     */
    overwrite?: boolean;
  }
}

export = BroccoliMergeTrees;
