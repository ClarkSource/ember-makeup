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
  }
}

declare module 'ember-cli/lib/models/blueprint' {
  class Blueprint {
    taskFor(taskName: string): void;
  }
  export = Blueprint;
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
  }
}
