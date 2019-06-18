'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const BroccoliDebugTree = require('broccoli-debug');

module.exports = function(defaults) {
  const app = new EmberAddon(defaults, {
    cssModules: {
      intermediateOutputPath: 'app/styles/css-modules.css'
    },

    themes: {
      clark: {
        'contextual-component': {
          background: {
            $light: 'white',
            $dark: 'black'
          },
          color: {
            $light: 'black',
            $dark: 'white'
          },
          actual: {
            $light: '"light"',
            $dark: '"dark"'
          },
          'style-applied': '"Yes"'
        },

        context: {
          light: 'light',
          dark: 'dark'
        }
      }
    }
  });

  return new BroccoliDebugTree(app.toTree(), 'ember-makeup:dummy-app');
};
