/* eslint-disable @typescript-eslint/no-var-requires */
const [
  BASE_ABBREVIATIONS_LEVEL,
  BASE_ABBREVIATIONS_CONFIG
] = require('@clark/eslint-config/lib/common').rules[
  'unicorn/prevent-abbreviations'
];
const merge = require('lodash.merge');

module.exports = {
  root: true,
  extends: '@clark/node-typescript',

  rules: {
    'unicorn/prevent-abbreviations': [
      BASE_ABBREVIATIONS_LEVEL,
      merge(BASE_ABBREVIATIONS_CONFIG, {
        whitelist: {
          prop: true
        }
      })
    ],

    // @TODO: fix config to re-enable this
    'node/no-missing-import': 'off',

    // @TODO: the rule does not understand type-only imports
    'node/no-extraneous-import': 'off',
    'node/no-unpublished-import': 'off'
  }
};
