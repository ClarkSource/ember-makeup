'use strict';

const BroccoliDebugTree = require('broccoli-debug');
const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

const { ThemeProvider } = require('.');

module.exports = function(defaults) {
  const app = new EmberAddon(defaults, {
    'ember-cli-babel': {
      includePolyfill: true
    },

    cssModules: {
      intermediateOutputPath: 'app/styles/css-modules.css',
      passthroughFileExtensions: ['scss']
    },

    createEmberMakeupThemeProvider() {
      return new (class extends ThemeProvider {
        getThemes() {
          return {
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
          };
        }
      })();
    }
  });

  return new BroccoliDebugTree(app.toTree(), 'ember-makeup:dummy-app');
};
