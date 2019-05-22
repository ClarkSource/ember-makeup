'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  const app = new EmberAddon(defaults, {
    cssModules: {
      intermediateOutputPath: 'app/styles/css-modules.css'
    }
  });

  return app.toTree();
};
