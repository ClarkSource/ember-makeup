import postcss from 'postcss';
import { Node, WordNode, stringify } from 'postcss-value-parser';

import { SchemaUsage } from '.';
import { FlattenedTheme } from '../../theme/process-theme';
import { Theme } from '../broccoli/config-creator';
import { VariableUsage, isVariableUsage } from './usage';

type Token = Node | VariableUsage;

const makeWordNode = (value: string): WordNode => ({
  type: 'word',
  value
});

const resolveVariableUsage = (
  theme: FlattenedTheme,
  { key }: VariableUsage
) => {
  if (!(key in theme)) throw new Error(`'${key}' is unknown`);
  return String(theme[key]);
};

const resolveTokens = (theme: FlattenedTheme, tokens: Token[]) =>
  tokens.map(token =>
    isVariableUsage(token)
      ? makeWordNode(resolveVariableUsage(theme, token))
      : token
  );

const isUsageContextless = (theme: Theme, { tokens }: SchemaUsage) =>
  tokens.some(
    usage => isVariableUsage(usage) && usage.key in theme.contextless
  );

const batchUsages = (theme: Theme, usages: SchemaUsage[]) =>
  usages.reduce(
    ({ contextless, contextual }, usage) => {
      const batch = isUsageContextless(theme, usage) ? contextless : contextual;

      for (const selector of usage.selectors) {
        if (!batch[selector]) batch[selector] = {};
        batch[selector][usage.property] = usage.tokens;
      }

      return { contextless, contextual };
    },
    {
      contextless: {},
      contextual: {}
    } as {
      contextless: Record<string, Record<string, Token[]>>;
      contextual: Record<string, Record<string, Token[]>>;
    }
  );

export function generateCompatibilityCSS(theme: Theme, usages: SchemaUsage[]) {
  const root = postcss.root();
  const { contextless, contextual } = batchUsages(theme, usages);

  for (const [selector, decls] of Object.entries(contextless)) {
    root.append(
      postcss.rule({
        selector,
        nodes: Object.entries(decls).map(([prop, tokens]) =>
          postcss.decl({
            prop,
            value: stringify(resolveTokens(theme.contextless, tokens))
          })
        )
      })
    );
  }

  for (const [selector, decls] of Object.entries(contextual)) {
    for (const [contextName, configValues] of Object.entries(
      theme.contextual
    )) {
      try {
        root.append(
          postcss.rule({
            selector: `:context(${contextName}) ${selector}`,
            nodes: Object.entries(decls).map(([prop, tokens]) =>
              postcss.decl({
                prop,
                value: stringify(resolveTokens(configValues, tokens))
              })
            )
          })
        );
      } catch (error) {
        error.message = `'${selector}': ${error.message}`;
        throw error;
      }
    }
  }

  return root;
}
