import BroccoliPlugin, { BroccoliNode } from 'broccoli-plugin';

interface BroccoliDebugOptions {
  /**
    The label to use for the debug folder. By default, will be placed in `DEBUG/*`.
  */
  label: string;

  /**
    The base directory to place the input node contents when debugging is enabled.

    Chooses the default in this order:

    * `process.env.BROCCOLI_DEBUG_PATH`
    * `path.join(process.cwd(), 'DEBUG')`
  */
  baseDir: string;

  /**
    Should the tree be "always on" for debugging? This is akin to `debugger`, its very
    useful while actively working on a build pipeline, but is likely something you would
    remove before publishing.
  */
  force?: boolean;
}

declare class BroccoliDebug extends BroccoliPlugin {
  /**
    Builds a callback function for easily generating `BroccoliDebug` instances
    with a shared prefix.
  */
  static buildDebugCallback(
    prefix: string
  ): (
    node: BroccoliNode,
    labelOrOptions: string | BroccoliDebugOptions
  ) => BroccoliPlugin;

  constructor(
    node: BroccoliNode,
    labelOrOptions: string | BroccoliDebugOptions
  );

  debugLabel: string;
}

export = BroccoliDebug;
