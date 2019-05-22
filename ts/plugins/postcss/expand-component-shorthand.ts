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
  container.walkDecls(decl => {
    // Only parse and transform, if the function, e.g. `cfg(`, is present.
    if (!decl.value.includes(`${keyword}(`)) return;

    transformDecl(decl, component, keyword);
  });
  container.walkAtRules('context', atRule =>
    transformContextAtRule(atRule, component)
  );
}

function transformMany(
  container: Container,
  componentAssociations: Map<Container, string>,
  keyword = 'cfg'
) {
  container.walkDecls(decl => {
    // Only parse and transform, if the function, e.g. `cfg(`, is present.
    if (!decl.value.includes(`${keyword}(`)) return;

    const parentNamespace = buildNamespaceFromParents(
      componentAssociations,
      decl
    );

    if (!parentNamespace) return;

    transformDecl(decl, parentNamespace, keyword);
  });
  container.walkAtRules('context', atRule => {
    const parentNamespace = buildNamespaceFromParents(
      componentAssociations,
      atRule
    );
    transformContextAtRule(atRule, parentNamespace);
  });
}

function transformDecl(decl: Declaration, namespace: string, keyword = 'cfg') {
  const originalValue = decl.value;

  decl.value = valueParser(originalValue)
    .walk(node => {
      if (node.type !== 'function' || node.value !== keyword) return;

      const keyNode = getKeyNodeFromFunctionNode(decl, node, keyword);
      keyNode.value = namespaceConfigKey(namespace, keyNode.value);

      node.nodes = [keyNode];
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

function* getParents(node: { parent: any }) {
  let { parent } = node;
  while (parent) {
    yield parent;
    parent = parent.parent;
  }
}

function buildNamespaceFromParents(
  componentAssociations: Map<Container, string>,
  node: { parent: any }
): string {
  const namespaceFragments: string[] = [];
  for (const parent of getParents(node)) {
    if (!componentAssociations.has(parent)) continue;

    const currentNamespaceFragment = componentAssociations.get(parent)!;
    if (isValidRootConfigKey(currentNamespaceFragment)) {
      namespaceFragments.push(resolveRootConfigKey(currentNamespaceFragment));
      break;
    }
    namespaceFragments.push(currentNamespaceFragment);
  }

  return namespaceFragments.reverse().join('.');
}
