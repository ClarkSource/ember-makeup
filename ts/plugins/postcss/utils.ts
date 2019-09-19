import { Container, Declaration, Plugin, Transformer, plugin } from 'postcss';
import {
  stringify,
  FunctionNode,
  StringNode,
  WordNode
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

/**
 * Validate and return then key node from a parsed function node.
 * This ensures that the passed in function node only has a single parameter.
 */
export function getKeyNodeFromFunctionNode(
  decl: Declaration,
  node: FunctionNode,
  keyword = 'cfg'
): WordNode | StringNode {
  const [keyNode] = node.nodes;

  /**
   * When invoked as `cfg()`, without an explicit config key, return the
   * declaration property name as the key. For instance, the following would
   * return `border-color`:
   *
   * ```css
   * .foo {
   *   border-color: cfg();
   * }
   * ```
   */
  if (!keyNode) {
    const syntheticKeyNode: StringNode = {
      type: 'string',
      value: decl.prop,
      quote: "'",
      unclosed: false
    };
    node.nodes = [syntheticKeyNode];
    return syntheticKeyNode;
  }

  /**
   * Disallow passing more than one parameter.
   */
  if (node.nodes.length !== 1) {
    throw decl.error(
      `You can only pass one parameter to '${keyword}', but you provided: ${stringify(
        node
      )}`,
      { word: keyword }
    );
  }

  /**
   * Only allow strings or words as keys.
   *
   * - string: `cfg('foo')`
   * - word:   `cfg(foo)`
   */
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

export function* getParents<T>(node: { parent: any }): IterableIterator<T> {
  let { parent } = node;
  while (parent) {
    yield parent;
    parent = parent.parent;
  }
}

export function findInIterable<T>(
  iterable: Iterable<any>,
  predicate: (element: any) => boolean
): T | null {
  for (const element of iterable) {
    if (predicate(element)) return element;
  }
  return null;
}
