/* eslint-disable import-helpers/order-imports */
declare module 'ember-cli/lib/broccoli/ember-app' {
  import CoreObject from 'core-object';

  export default class EmberApp extends CoreObject {
    options: Record<string, unknown>;
  }
}

declare module 'ember-cli/lib/models/addon' {
  import { BroccoliNode } from 'broccoli-plugin';
  import UI from 'console-ui';
  import CoreObject, { ExtendOptions } from 'core-object';
  import EmberApp from 'ember-cli/lib/broccoli/ember-app';
  import Command from 'ember-cli/lib/models/command';
  import Project from 'ember-cli/lib/models/project';
  import Registry from 'ember-cli-preprocessor-registry';
  import { Application } from 'express';

  export default class Addon extends CoreObject {
    name: string;

    root: string;

    app?: EmberApp;

    parent: Addon | Project;

    project: Project;

    addons: Addon[];

    ui: UI;

    options?: Record<string, unknown>;

    // eslint-disable-next-line unicorn/prevent-abbreviations
    pkg: {
      name: string;
      version: string;
      keywords?: string[];
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    blueprintsPath(): string;

    included(includer: EmberApp | Project | Addon): void;

    includedCommands(): Record<
      string,
      typeof Command | ExtendOptions<Command>
    > | void;

    shouldIncludeChildAddon(addon: Addon): boolean;

    isDevelopingAddon(): boolean;

    serverMiddleware(options: { app: Application }): void | Promise<void>;

    testemMiddleware(app: Application): void;

    setupPreprocessorRegistry(
      type: 'self' | 'parent',
      registry: Registry
    ): void;

    treeForAddon(tree: BroccoliNode): BroccoliNode;

    postprocessTree(
      type: 'src' | 'css' | 'template' | 'js' | 'all',
      tree: BroccoliNode
    ): BroccoliNode;
  }
}

declare module 'ember-cli/lib/models/blueprint' {
  class Blueprint {
    taskFor(taskName: string): void;
  }
  export = Blueprint;
}

declare module 'ember-cli/lib/models/builder' {
  import UI from 'console-ui';

  import { BroccoliNode } from 'broccoli-plugin';
  import CoreObject, { ExtendOptions } from 'core-object';
  import Registry from 'ember-cli-preprocessor-registry';
  import EmberApp from 'ember-cli/lib/broccoli/ember-app';
  import Addon from 'ember-cli/lib/models/addon';
  import Command from 'ember-cli/lib/models/command';
  import Project from 'ember-cli/lib/models/project';
  import { Application } from 'express';

  interface BuilderOptions {
    ui: UI;
    outputPath: string;
    environment: string;
    project: Project;
    onProcessInterrupt?: unknown;
  }

  /**
   * Wrapper for the Broccoli [Builder](https://github.com/broccolijs/broccoli/blob/master/lib/builder.js) class.
   *
   * @private
   * @module ember-cli
   * @class Builder
   * @constructor
   * @extends Task
   */
  export default class Builder extends CoreObject {
    constructor(options: BuilderOptions);

    /**
     * @private
     * @method readBuildFile
     * @param path The file path to read the build file from
     */
    private readBuildFile(path: string): (defaults: {}) => EmberApp;

    /**
     * @private
     * @method setupBroccoliBuilder
     */
    private setupBroccoliBuilder(): void;

    /**
     * Determine whether the output path is safe to delete. If the outputPath
     * appears anywhere in the parents of the project root, the build would
     * delete the project directory. In this case return `false`, otherwise
     * return `true`.
     * @private
     * @method canDeleteOutputPath
     * @param {String} outputPath
     * @return {Boolean}
     */
    private canDeleteOutputPath(outputPath: string): boolean;

    /**
     * @private
     * @method copyToOutputPath
     * @param {String} inputPath
     */
    private copyToOutputPath(inputPath: string): unknown[];

    /**
     * @private
     * @method processBuildResult
     * @param results
     * @return {Promise}
     */
    private processBuildResult<T = unknown>(results: T): Promise<T>;

    /**
     * @private
     * @method processAddonBuildSteps
     * @param buildStep
     * @param results
     * @return {Promise}
     */
    private processAddonBuildSteps<T = unknown>(
      buildStep: string,
      results: T
    ): Promise<T>;

    /**
     * @private
     * @method build
     * @return {Promise}
     */
    // private
    build(
      addWatchDirectoryCallback?: (path: string) => unknown,
      resultAnnotation?: string
    ): Promise<void>;

    /**
     * Delegates to the `cleanup` method of the wrapped Broccoli builder.
     *
     * @private
     * @method cleanup
     * @return {Promise}
     */
    // private
    cleanup(): Promise<void>;

    /**
     * Checks for issues in the environment that can't easily be detected until
     * after a build and issues any necessary deprecation warnings.
     *
     * - check for old (pre 0.1.4) versions of heimdalljs
     *
     * @private
     * @method checkForPostBuildEnvironmentIssues
     */
    private checkForPostBuildEnvironmentIssues<T = unknown>(value: T): T;

    /**
     * @private
     * @method finalizeBuild
     */
    private finalizeBuild(): void;

    /**
     * broccoli-builder reformats the response into {directory, graph}, this method is a backwards
     * compatible shim for broccoli 1.x
     * @private
     * @method compatNode
     * @param node The node returned from Broccoli builder
     */
    private compatNode<T = BroccoliNode>(
      node: T
    ): T | { directory: string; graph: unknown };

    private compatBroccoliPayload(error: Error): never;
  }
}

declare module 'ember-cli/lib/models/command' {
  import UI from 'console-ui';
  import CoreObject from 'core-object';
  import Project from 'ember-cli/lib/models/project';

  interface CommandOption {
    name: string;
    type: unknown;
    description?: string;
    required?: boolean;
    default?: unknown;
    aliases?: string[];
  }

  export default class Command extends CoreObject {
    name: string;

    works: 'insideProject' | 'outsideProject' | 'everywhere';

    description: string;

    availableOptions: CommandOption[];

    anonymousOptions: string[];

    ui: UI;

    project: Project;

    run(options: {}, anonymousOptions: string[]): void | Promise<unknown>;
  }
}

declare module 'ember-cli/lib/models/project' {
  import UI from 'console-ui';

  import { BroccoliNode } from 'broccoli-plugin';
  import CoreObject, { ExtendOptions } from 'core-object';
  import Registry from 'ember-cli-preprocessor-registry';
  import EmberApp from 'ember-cli/lib/broccoli/ember-app';
  import Addon from 'ember-cli/lib/models/addon';
  import Command from 'ember-cli/lib/models/command';
  import { Application } from 'express';

  export default class Project extends CoreObject {
    ui: UI;

    options?: Record<string, unknown>;

    root: string;

    addons: Addon[];

    // eslint-disable-next-line unicorn/prevent-abbreviations
    pkg: {
      name: string;
      version: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    targets: {
      browsers: string[];
    };

    name(): string;

    isEmberCLIAddon(): boolean;

    require(module: string): unknown;

    isModuleUnification(): boolean;

    findAddonByName(name: string): Addon | undefined;

    resolveSync(relativePath: string): string;
  }
}
