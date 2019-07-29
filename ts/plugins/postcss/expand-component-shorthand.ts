import { Container, Declaration, AtRule, Rule, Result } from 'postcss';
import valueParser from 'postcss-value-parser';

import {
  isValidRootConfigKey,
  resolveRootConfigKey
} from '../../lib/config-key';
import { Usage } from './usage';
import {
  assertNoDoubleColonAtRule,
  assertValidConfigKey,
  getKeyNodeFromFunctionNode,
  getParents,
  findInIterable,
  pluginWithRequiredOptions
} from './utils';

function buildNamespaceFromParents(
  componentAssociations: Map<Container, string>,
  node: { parent: any }
): string {
  const namespaceFragments: string[] = [];
  for (const parent of getParents<Container>(node)) {
    if (!componentAssociations.has(parent)) continue;

    // @todo https://github.com/microsoft/TypeScript/issues/13086
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentNamespaceFragment = componentAssociations.get(parent)!;
    if (isValidRootConfigKey(currentNamespaceFragment)) {
      namespaceFragments.push(resolveRootConfigKey(currentNamespaceFragment));
      break;
    }
    namespaceFragments.push(currentNamespaceFragment);
  }

  return namespaceFragments.reverse().join('.');
}

function namespaceConfigKey(namespace: string, key: string) {
  if (isValidRootConfigKey(key)) return resolveRootConfigKey(key);
  return `${namespace}.${key}`;
}

function transformContextAtRule(atRule: AtRule, namespace: string) {
  const configKey = atRule.params.length === 0 ? 'context' : atRule.params;
  assertValidConfigKey(configKey, atRule);
  atRule.params = namespaceConfigKey(namespace, configKey);
}

interface TransformOptions {
  configKeyword: string;
  reportUsage?: (usage: Usage) => void;
  path: string;
}

function transformDecl(
  decl: Declaration,
  namespace: string,
  { configKeyword, reportUsage, path }: TransformOptions
) {
  const originalValue = decl.value;

  decl.value = valueParser(originalValue)
    .walk(node => {
      if (node.type !== 'function' || node.value !== configKeyword) return;

      const keyNode = getKeyNodeFromFunctionNode(decl, node, configKeyword);
      const key = namespaceConfigKey(namespace, keyNode.value);

      keyNode.value = key;

      if (reportUsage) {
        const rule = findInIterable<Rule>(
          getParents(decl),
          parentNode => parentNode.type === 'rule'
        );
        reportUsage({
          selectors: rule ? rule.selectors : [],
          property: decl.prop,
          originalValue,
          key,
          path
        });
      }
    })
    .toString();
}

function transformOne(
  container: Container,
  component: string,
  { configKeyword, reportUsage, path }: TransformOptions
) {
  container.walkDecls(decl => {
    // Only parse and transform, if the function, e.g. `cfg(`, is present.
    if (!decl.value.includes(`${configKeyword}(`)) return;

    transformDecl(decl, component, { configKeyword, reportUsage, path });
  });
  container.walkAtRules('context', atRule =>
    transformContextAtRule(atRule, component)
  );
}

function transformMany(
  container: Container,
  componentAssociations: Map<Container, string>,
  { configKeyword = 'cfg', reportUsage, path }: TransformOptions
) {
  container.walkDecls(decl => {
    // Only parse and transform, if the function, e.g. `cfg(`, is present.
    if (!decl.value.includes(`${configKeyword}(`)) return;

    const parentNamespace = buildNamespaceFromParents(
      componentAssociations,
      decl
    );

    if (!parentNamespace) return;

    transformDecl(decl, parentNamespace, { configKeyword, reportUsage, path });
  });
  container.walkAtRules('context', atRule => {
    const parentNamespace = buildNamespaceFromParents(
      componentAssociations,
      atRule
    );
    transformContextAtRule(atRule, parentNamespace);
  });
}

export interface Options {
  /**
   * The function name to use.
   *
   * @default 'cfg'
   */
  configKeyword?: string;

  /**
   * The at-rule name to use.
   *
   * @default 'component'
   */
  componentKeyword?: string;

  /**
   * An optional function to call for every occurrence of the `cfg` function.
   * This is used to build the implicit schema.
   */
  reportUsage?: (usage: Usage) => void;

  // https://github.com/jeffjewiss/broccoli-postcss/blob/d01e9827889b0a61a56ed7d991119f2f00bde6b1/index.js#L38
  from?: string;
  to?: string;
}

interface BroccoliCSSModulesResult extends Result {
  opts?: Result['opts'] & {
    relativeFrom?: string;
  };
}

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
export default pluginWithRequiredOptions(
  'postcss-ember-makeup:expand-component-shortcut',
  function({
    configKeyword = 'cfg',
    componentKeyword = 'component',
    reportUsage,
    to
  }: Options) {
    // eslint-disable-next-line unicorn/prevent-abbreviations
    return function(root, { opts }: BroccoliCSSModulesResult) {
      const path = to || (opts && opts.relativeFrom);
      if (!path)
        throw new TypeError('Neither `to` or `relativeFrom` were defined.');

      assertNoDoubleColonAtRule(componentKeyword, root);

      const componentAssociations = new Map<Container, string>();

      root.walkAtRules(componentKeyword, atRule => {
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
        case 1: {
          const [
            container,
            component
          ] = componentAssociations.entries().next().value;
          transformOne(container, component, {
            configKeyword,
            reportUsage,
            path
          });
          break;
        }
        default:
          transformMany(root, componentAssociations, {
            configKeyword,
            reportUsage,
            path
          });
      }
    };
  }
);
