import { plugin, Container, Declaration, AtRule } from 'postcss';
import valueParser from 'postcss-value-parser';
import {
  assertNoDoubleColonAtRule,
  assertValidConfigKey,
  getKeyNodeFromFunctionNode
} from './utils';
import {
  isValidRootConfigKey,
  resolveRootConfigKey
} from '../../lib/config-key';

/**
 * Expands `@component` at-rule shortcuts.
 *
 * ```css
 * @component button;
 *
 * .primary-button {
 *   @component primary;
 *   background: cfg('background');
 *   font-size: cfg('/typo.sizes.medium');
 * }
 *
 * .something-else {
 *   @component /typo.sizes;
 *  font-size: cfg('medium');
 * }
 * ```
 *
 * ```css
 * .primary-button {
 *   background: cfg('button.primary.background');
 *   font-size: cfg('typo.sizes.medium');
 * }
 *
 * .something-else {
 *   font-size: cfg('typo.sizes.medium');
 * }
 * ```
 */
export default plugin('postcss-ember-makeup:expand-component-shortcut', () => {
  const keyword = 'component';

  return (root, _result) => {
    assertNoDoubleColonAtRule(keyword, root);

    const componentAssociations = new Map<Container, string>();

    root.walkAtRules(keyword, atRule => {
      const { params: configKey, parent } = atRule;
      assertValidConfigKey(configKey, atRule);

      if (componentAssociations.has(parent)) {
        throw atRule.error(
          `You can only specify a '@component' once per container.`
        );
      }

      componentAssociations.set(parent, configKey);

      atRule.remove();
    });

    switch (componentAssociations.size) {
      case 0:
        return;
      case 1:
        transformOne(...Array.from(componentAssociations.entries())[0]);
        break;
      default:
        transformMany(root, componentAssociations);
    }
  };
});

function transformOne(
  container: Container,
  component: string,
  keyword = 'cfg'
) {
  container.walkDecls(decl => transformDecl(decl, component, keyword));
  container.walkAtRules('context', atRule =>
    transformContextAtRule(atRule, component)
  );
}

function transformMany(
  _container: Container,
  _componentAssociations: Map<Container, string>,
  _keyword = 'cfg'
) {}

function transformDecl(decl: Declaration, namespace: string, keyword = 'cfg') {
  const originalValue = decl.value;

  // Only parse and transform, if the function, e.g. `cfg(`, is present.
  if (!originalValue.includes(`${keyword}(`)) return;

  decl.value = valueParser(originalValue)
    .walk(node => {
      if (node.type !== 'function' || node.value !== keyword) return;

      const keyNode = getKeyNodeFromFunctionNode(decl, node, keyword);
      keyNode.value = namespaceConfigKey(namespace, keyNode.value);
    })
    .toString();
}

function transformContextAtRule(atRule: AtRule, namespace: string) {
  const configKey = atRule.params.length === 0 ? 'context' : atRule.params;
  assertValidConfigKey(configKey, atRule);
  atRule.params = namespaceConfigKey(namespace, configKey);
}

function namespaceConfigKey(namespace: string, key: string) {
  if (isValidRootConfigKey(key)) return resolveRootConfigKey(key);
  return `${namespace}.${key}`;
}
