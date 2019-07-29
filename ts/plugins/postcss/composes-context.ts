import { decl, plugin } from 'postcss';

import { assertNoDoubleColonAtRule, assertValidConfigKey } from './utils';

/**
 * Transforms `@context` at-rules to `composes` declarations. These are then
 * picked up by ember-css-modules and exposed to the `local-class` helper, which
 * we override in order to live update.
 *
 * `@context` accepts an optional config key that defaults to `context`.
 *
 * ```css
 * .foo {
 *   @context;
 * }
 * .bar {
 *   @context other-context;
 * }
 * ```
 *
 * ```css
 * .foo {
 *   composes: 'ember-makeup/contexts/context' from global;
 * }
 * .bar {
 *   composes: 'ember-makeup/contexts/other-context' from global;
 * }
 * ```
 */
export default plugin<{
  contextKeyword: string;
  contextClassNamePrefix: string;
}>('postcss-ember-makeup:composes-context', options => {
  if (!options) throw new TypeError('Cannot be invoked without options.');
  const { contextKeyword, contextClassNamePrefix } = options;

  return root => {
    assertNoDoubleColonAtRule(contextKeyword, root);

    root.walkAtRules(contextKeyword, atRule => {
      const configKey = atRule.params.length === 0 ? 'context' : atRule.params;
      assertValidConfigKey(configKey, atRule);

      atRule.replaceWith(
        decl({
          prop: 'composes',
          value: `${contextClassNamePrefix}${configKey} from global`
        })
      );
    });
  };
});
