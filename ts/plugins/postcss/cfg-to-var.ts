import { plugin } from 'postcss';
import valueParser, { Node } from 'postcss-value-parser';
import cssesc from 'cssesc';
import { getKeyNodeFromFunctionNode } from './utils';

const serializeConfigKey = (key: string) =>
  `--${cssesc(key, { isIdentifier: true })}`;

export interface Options {
  keyword?: string;
  reportUsage?: (usage: Usage) => void;

  // https://github.com/jeffjewiss/broccoli-postcss/blob/d01e9827889b0a61a56ed7d991119f2f00bde6b1/index.js#L38
  from?: string;
  to?: string;
}

export interface Usage {
  selectors: string[];
  prop: string;
  originalValue: string;
  key: string;
  fallback?: string;
  path: string;
}

export default plugin(
  'postcss-ember-makeup',
  ({ keyword = 'cfg', reportUsage, to }: Options = {}) => {
    const needsTransformation = (value: string) =>
      value.includes(`${keyword}(`);

    if (!to) throw new TypeError('Called without `to` file path option.');

    return (root, _result) => {
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
            keyNode.value = serializeConfigKey(key);

            node.nodes = [keyNode];

            // turns `cfg` into `var`
            node.value = 'var';

            if (reportUsage) {
              const fallback =
                node.nodes.length > 1
                  ? valueParser.stringify(node.nodes.slice(1))
                  : undefined;
              reportUsage({
                selectors: rule.selectors!,
                prop: decl.prop,
                originalValue,
                key,
                fallback,
                path: to
              });
            }
          }, true)
          .toString();
      });
    };
  }
);
