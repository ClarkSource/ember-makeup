import { Container, Declaration, Plugin, Transformer, plugin } from 'postcss';
import {
  stringify,
  FunctionNode,
  StringNode,
  WordNode,
  NodeType
} from 'postcss-value-parser';
import { isValidConfigKey, containsQuotes } from '../../lib/config-key';

export function assertNoDoubleColonAtRule(
  keyword: string,
  container: Container
) {
  container.walkAtRules(`${keyword}:`, atRule => {
    throw atRule.error(`Use '@${keyword}' without a ':'.`, { word: ':' });
  });
}

export function assertValidConfigKey(
  configKey: string,
  container: Container
): void {
  if (!isValidConfigKey(configKey)) {
    if (containsQuotes(configKey)) {
      throw container.error(`Do not put the config key in quotes.`, {
        word: configKey
      });
    }
    throw container.error(`Invalid config key: '${configKey}'`, {
      word: configKey
    });
  }
}

export function getKeyNodeFromFunctionNode(
  decl: Declaration,
  node: FunctionNode,
  keyword = 'cfg'
): WordNode | StringNode {
  const [keyNode] = node.nodes;

  if (!keyNode) {
    const syntheticKeyNode: StringNode = {
      type: 'string' as NodeType.String,
      value: decl.prop,
      quote: "'",
      unclosed: false
    };
    return syntheticKeyNode;
  }

  if (
    (keyNode.type !== 'word' && keyNode.type !== 'string') ||
    keyNode.value.length === 0
  ) {
    throw decl.error(
      `The first parameter of '${keyword}' has to be a key, but you provided: ${stringify(
        node
      )}`,
      { word: keyword }
    );
  }

  return keyNode as WordNode | StringNode;
}

export function pluginWithRequiredOptions<T>(
  name: string,
  initializer: (pluginOptions: T) => Transformer
) {
  return plugin(name, (pluginOptions?: T) => {
    if (!pluginOptions)
      throw new TypeError(
        `Plugin '${name}' requires you to pass an options object.`
      );

    return initializer(pluginOptions);
  }) as Plugin<T | Record<string, any>>;
}
