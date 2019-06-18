import { Class as BroccoliFileCreator } from 'broccoli-file-creator';
import { root, rule, decl } from 'postcss';
import transform from 'lodash.transform';
import BroccoliMergeTrees from 'broccoli-merge-trees';
import cssesc from 'cssesc';
import {
  serializeConfigKey,
  isContextKey,
  contextFromContextKey
} from '../../../lib/config-key';
import { Theme, ThemeList } from '../../../themes';

const isPrimitiveValue = (value: any) =>
  typeof value === 'string' || typeof value === 'number';

const buildKey = (keyPrefix: string[], key: string) =>
  [...keyPrefix, key].join('.');

function throwKeyError(keyPrefix: string[], key: string, message: string) {
  throw new TypeError(`'${buildKey(keyPrefix, key)}': ${message}`);
}

type FlattenedTheme = Record<string, string | number>;

/* eslint-disable no-param-reassign */
const flattenTheme = (
  keyPrefix: string[],
  acc: {
    contextless: FlattenedTheme;
    contextual: Record<string, FlattenedTheme>;
  } = {
    contextless: {},
    contextual: {}
  }
) => (theme: Theme) =>
  transform(
    theme,
    ({ contextless, contextual }, themeNode, key) => {
      if (typeof themeNode === 'object') {
        const nestedEntries = Object.entries(themeNode);
        if (nestedEntries.length === 0) {
          throwKeyError(
            keyPrefix,
            key,
            'Empty nested config objects are not allowed.'
          );
        }

        const contexts = nestedEntries.filter(([nestedKey]) =>
          isContextKey(nestedKey)
        );
        if (contexts.length !== 0 && contexts.length !== nestedEntries.length) {
          throwKeyError(
            keyPrefix,
            key,
            'Mixing contextual keys and regular keys is not allowed.'
          );
        }

        if (contexts.length > 0) {
          for (const [contextKey, value] of contexts) {
            if (!isPrimitiveValue(value)) {
              throwKeyError(
                keyPrefix,
                key,
                'Contextual configs must be primitive values.'
              );
            }
            const contextName = contextFromContextKey(contextKey);
            if (!contextual[contextName]) {
              contextual[contextName] = {};
            }
            contextual[contextName][buildKey(keyPrefix, key)] = value as
              | string
              | number;
          }
          return;
        }

        flattenTheme([...keyPrefix, key], {
          contextless,
          contextual
        })(themeNode);
        return;
      }

      if (isPrimitiveValue(themeNode)) {
        contextless[buildKey(keyPrefix, key)] = themeNode;
        return;
      }

      throwKeyError(
        keyPrefix,
        key,
        `Unsupported value type '${themeNode}' (${typeof themeNode}).`
      );
    },
    acc
  );
/* eslint-enable no-param-reassign */

const flattenedThemeToRule = (selector: string, theme: FlattenedTheme) =>
  Object.entries(theme).reduce(
    (builtRule, [key, value]) =>
      builtRule.append(
        decl({
          prop: serializeConfigKey(key),
          value: String(value)
        })
      ),
    rule({ selector })
  );

function themeToCSS(
  theme: Theme,
  { contextClassNamePrefix }: { contextClassNamePrefix: string }
) {
  const { contextless, contextual } = flattenTheme([])(theme);

  const css = root();
  css.append(flattenedThemeToRule(':root', contextless));
  for (const [contextName, contextualTheme] of Object.entries(contextual)) {
    css.append(
      flattenedThemeToRule(
        `.${cssesc(`${contextClassNamePrefix}${contextName}`, {
          isIdentifier: true
        })}`,
        contextualTheme
      )
    );
  }

  return css.toString();
}

export interface Config {
  contextClassNamePrefix: string;
  getFileName: (themeName: string) => string;
  themes: ThemeList;
}

export function configCreatorCSS({
  themes,
  contextClassNamePrefix,
  getFileName
}: Config) {
  return new BroccoliMergeTrees(
    Object.entries(themes).map(
      ([name, theme]) =>
        new BroccoliFileCreator(
          getFileName(name),
          themeToCSS(theme, { contextClassNamePrefix })
        )
    ),
    { annotation: 'ember-makeup:config-creator-css' }
  );
}
