'use strict';

// eslint-disable-next-line node/no-deprecated-api
if (!require.extensions['.ts']) {
  const options = {
    project: `${__dirname}/ts/tsconfig.json`,

    // Otherwise the `use strict` statement is inserted and toggles on strict
    // mode, which breaks other addons, that rely on sloppy mode.
    // In the prod build `ember-makeup` is still compiled in strict mode.
    compilerOptions: { strict: false }
  };

  // If we're operating in the context of another project, which might happen
  // if someone has installed ember-makeup from git, only perform
  // transpilation and skip the default ignore glob (which prevents anything
  // in node_modules from being transpiled)
  if (process.cwd() !== __dirname) {
    options.skipIgnore = true;
    options.transpileOnly = true;
  }

  // eslint-disable-next-line node/no-unpublished-require
  require('ts-node').register(options);
}
