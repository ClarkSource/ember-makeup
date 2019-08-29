import BroccoliPersistentFilter, {
  BroccoliPersistentFilterOptions
} from 'broccoli-persistent-filter';
import { BroccoliNode } from 'broccoli-plugin';
import cssesc from 'cssesc';
import { root, rule, decl } from 'postcss';

import { serializeConfigKey } from '../../lib/config-key';
import { FlattenedTheme, ProcessedTheme } from '../../theme/process-theme';

const flattenedThemeToRule = (
  {
    selector,
    customPropertyPrefix
  }: { selector: string; customPropertyPrefix: string },
  theme: FlattenedTheme
) =>
  Object.entries(theme).reduce(
    (builtRule, [key, value]) =>
      builtRule.append(
        decl({
          prop: serializeConfigKey(`${customPropertyPrefix}${key}`),
          value: String(value)
        })
      ),
    rule({ selector })
  );

function themeToCSS(
  theme: {
    contextless: FlattenedTheme;
    contextual: Record<string, FlattenedTheme>;
  },
  {
    customPropertyPrefix,
    contextClassNamePrefix
  }: { customPropertyPrefix: string; contextClassNamePrefix: string }
) {
  const { contextless, contextual } = theme;

  const css = root();
  css.append(
    flattenedThemeToRule(
      { selector: ':root', customPropertyPrefix },
      contextless
    )
  );
  for (const [contextName, contextualTheme] of Object.entries(contextual)) {
    css.append(
      flattenedThemeToRule(
        {
          selector: `.${cssesc(`${contextClassNamePrefix}${contextName}`, {
            isIdentifier: true
          })}`,
          customPropertyPrefix
        },
        contextualTheme
      )
    );
  }

  return css.toString();
}

interface BroccoliJSONToCSSOptions extends BroccoliPersistentFilterOptions {
  customPropertyPrefix: string;
  contextClassNamePrefix: string;
}

export default class BroccoliJSONToCSS extends BroccoliPersistentFilter {
  private options: BroccoliJSONToCSSOptions;

  constructor(inputNode: BroccoliNode, options: BroccoliJSONToCSSOptions) {
    super(inputNode, {
      extensions: ['json'],
      targetExtension: 'css',
      ...options
    });
    this.options = options;
  }

  processString(contents: string) {
    const json = JSON.parse(contents) as ProcessedTheme;
    return themeToCSS(json, this.options);
  }
}
