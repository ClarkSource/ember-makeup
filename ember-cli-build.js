'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const BroccoliDebugTree = require('broccoli-debug');

module.exports = function(defaults) {
  const app = new EmberAddon(defaults, {
    cssModules: {
      intermediateOutputPath: 'app/styles/css-modules.css'
    }
  });

  return new BroccoliDebugTree(app.toTree(), 'ember-makeup:dummy-app');
};
