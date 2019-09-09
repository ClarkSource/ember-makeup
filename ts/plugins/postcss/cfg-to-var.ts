import BroccoliMultiPostCSS from 'broccoli-multi-postcss';
import valueParser, { Node } from 'postcss-value-parser';

import { serializeConfigKey } from '../../lib/config-key';
import { stripExtension } from '../../lib/utils/path';
import { Usage } from './usage';
import { getKeyNodeFromFunctionNode, pluginWithRequiredOptions } from './utils';

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
  ({ keyword = 'cfg', customPropertyPrefix }: Options) => {
    const needsTransformation = (value: string) =>
      value.includes(`${keyword}(`);

    if (!customPropertyPrefix)
      throw new TypeError('Called without key `customPropertyPrefix` option.');

    return (root, result) => {
      if (!result.opts || !result.opts.to)
        throw new TypeError('Called without `to` file path option.');

      const path = result.opts.to;

      const usages: Usage[] = [];
      const reportUsage = (usage: Usage) => usages.push(usage);

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
                path
              });
            }
          }, true)
          .toString();
      });

      result.messages.push({
        plugin: 'postcss-ember-makeup:cfg-to-var',
        type: BroccoliMultiPostCSS.MessageType.WriteFile,
        path: `${stripExtension(path)}.makeup.json`,
        content: JSON.stringify({ path, usages })
      });
    };
  }
);
