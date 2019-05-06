import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import cssesc from 'cssesc';

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

export default postcss.plugin(
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
          .walk((node, _index, _nodes) => {
            if (node.type !== 'function' || node.value !== keyword) return;

            const [keyNode] = node.nodes;
            if (
              (keyNode.type !== 'word' && keyNode.type !== 'string') ||
              keyNode.value.length === 0
            ) {
              throw decl.error(
                `The first parameter of '${keyword}' has to be a key, but you provided: ${valueParser.stringify(
                  node
                )}`,
                { word: keyword }
              );
            }

            const key = keyNode.value;
            keyNode.value = serializeConfigKey(key);
            keyNode.type = 'word';

            // turns `cfg` into `env`
            node.value = 'env';

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
