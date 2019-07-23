import valueParser, { Node } from 'postcss-value-parser';
import { getKeyNodeFromFunctionNode, pluginWithRequiredOptions } from './utils';
import { serializeConfigKey } from '../../lib/config-key';

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
 * A `Usage` is reported for every occurrence of the `cfg` function.
 */
export interface Usage {
  /**
   * The list of selectors of the rule of this declaration this config value is
   * used in.
   *
   * @example ['.foo', '.bar > .foo']
   */
  selectors: string[];

  /**
   * The name of the property of the declaration this config value is used in.
   *
   * @example 'border-color'
   */
  prop: string;

  /**
   * The original full value of the declaration this config value is used in.
   */
  originalValue: string;

  /**
   * The fully resolved config key that is referenced, i.e. the part inside of
   * the `cfg()` function.
   *
   * @example 'some-component.border.color'
   */
  key: string;

  /**
   * The file path of the current file.
   */
  path: string;
}

export default pluginWithRequiredOptions(
  'postcss-ember-makeup',
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

            const keyNode = getKeyNodeFromFunctionNode(
              decl,
              node,
              keyword
            ) as Node;
            keyNode.type = 'word';

            const key = keyNode.value;
            keyNode.value = serializeConfigKey(`${customPropertyPrefix}${key}`);

            node.nodes = [keyNode];

            // turns `cfg` into `var`
            node.value = 'var';

            if (reportUsage) {
              reportUsage({
                selectors: rule.selectors,
                prop: decl.prop,
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
