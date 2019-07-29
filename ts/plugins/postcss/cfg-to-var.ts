import valueParser, { Node } from 'postcss-value-parser';
import { getKeyNodeFromFunctionNode, pluginWithRequiredOptions } from './utils';
import { serializeConfigKey } from '../../lib/config-key';
import { Usage } from './usage';

export interface Options {
  /**
   * The function name to use.
   *
   * @default 'cfg'
   */
  keyword?: string;

  /**
   * The key namespace to prepend when transforming to `var` functions.
   */
  customPropertyPrefix: string;

  /**
   * An optional function to call for every occurrence of the `cfg` function.
   * This is used to build the implicit schema.
   */
  reportUsage?: (usage: Usage) => void;

  // https://github.com/jeffjewiss/broccoli-postcss/blob/d01e9827889b0a61a56ed7d991119f2f00bde6b1/index.js#L38
  from?: string;
  to?: string;
}

/**
 * Transforms the `cfg()` function to `var()`.
 */
export default pluginWithRequiredOptions(
  'postcss-ember-makeup:cfg-to-var',
  ({ keyword = 'cfg', customPropertyPrefix, reportUsage, to }: Options) => {
    const needsTransformation = (value: string) =>
      value.includes(`${keyword}(`);

    if (!to) throw new TypeError('Called without `to` file path option.');
    if (!customPropertyPrefix)
      throw new TypeError('Called without key `customPropertyPrefix` option.');

    return root => {
      root.walkDecls(decl => {
        if (!needsTransformation(decl.value)) return;

        const rule = decl.parent;
        if (!rule || rule.type !== 'rule') {
          throw decl.error(
            `'${keyword}' must only be used in declarations contained in rules.`,
            { word: keyword }
          );
        }

        const originalValue = decl.value;

        decl.value = valueParser(decl.value)
          .walk(node => {
            if (node.type !== 'function' || node.value !== keyword) return;

            // This also validates the function node and ensures that it only
            // a single parameter. Thus we can safely reuse it to turn it into a
            // `var` function, without accidentally specifying a second
            // parameter (the optional fallback value).
            const keyNode = getKeyNodeFromFunctionNode(
              decl,
              node,
              keyword
            ) as Node;
            keyNode.type = 'word';

            const key = keyNode.value;
            keyNode.value = serializeConfigKey(`${customPropertyPrefix}${key}`);

            // turns `cfg` into `var`
            node.value = 'var';

            if (reportUsage) {
              reportUsage({
                selectors: rule.selectors,
                property: decl.prop,
                originalValue,
                key,
                path: to
              });
            }
          }, true)
          .toString();
      });
    };
  }
);
