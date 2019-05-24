// eslint-disable-next-line @typescript-eslint/no-var-requires
const merge = require('lodash.merge');

const [
  BASE_ABBREVIATIONS_LEVEL,
  BASE_ABBREVIATIONS_CONFIG
] = require('@clark/eslint-config/lib/common').rules[
  'unicorn/prevent-abbreviations'
];

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
    ]
  }
};
