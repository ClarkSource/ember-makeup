import transform from 'lodash.transform';
import { JsonObject } from 'type-fest';

import { isContextKey, contextFromContextKey } from '../lib/config-key';

const isObject = (subject: unknown): subject is Record<string, any> =>
  subject instanceof Object && !Array.isArray(subject);

type ThemeValue = string | number;

const isThemeValue = (value: any): value is ThemeValue =>
  typeof value === 'string' || typeof value === 'number';

const buildKey = (keyPrefix: string[], key: string) =>
  [...keyPrefix, key].join('.');

const createKeyError = (keyPrefix: string[], key: string, message: string) =>
  new TypeError(`'${buildKey(keyPrefix, key)}': ${message}`);

interface ThemeSource {
  components: JsonObject;
  tokens?: JsonObject;
}
export function isThemeSource(
  themeSource: unknown
): themeSource is ThemeSource {
  if (!isObject(themeSource)) return false;
  if (!isObject(themeSource.components)) return false;

  return true;
}

export type FlattenedTheme = Record<string, ThemeValue>;

export interface ProcessedTheme {
  contextless: FlattenedTheme;
  contextual: Record<string, FlattenedTheme>;
}

/* eslint-disable no-param-reassign */
const flattenTheme = (
  options: {
    allowContexts: boolean;
    processValue?: (value: ThemeValue) => ThemeValue;
  },
  keyPrefix: string[] = [],
  acc: {
    contextless: FlattenedTheme;
    contextual: Record<string, FlattenedTheme>;
  } = {
    contextless: {},
    contextual: {}
  }
) => (theme: JsonObject) =>
  transform(
    theme,
    ({ contextless, contextual }, themeNode, key) => {
      if (typeof themeNode === 'object') {
        if (!themeNode || Array.isArray(themeNode)) {
          throw createKeyError(keyPrefix, key, '');
        }

        const nestedEntries = Object.entries(themeNode);
        if (nestedEntries.length === 0) {
          throw createKeyError(
            keyPrefix,
            key,
            'Empty nested config objects are not allowed.'
          );
        }

        const contexts = nestedEntries.filter(([nestedKey]) =>
          isContextKey(nestedKey)
        );
        if (contexts.length !== 0 && contexts.length !== nestedEntries.length) {
          throw createKeyError(
            keyPrefix,
            key,
            'Mixing contextual keys and regular keys is not allowed.'
          );
        }

        if (contexts.length > 0) {
          for (const [contextKey, value] of contexts) {
            if (!isThemeValue(value)) {
              throw createKeyError(
                keyPrefix,
                key,
                'Contextual configs must be primitive values.'
              );
            }
            const contextName = contextFromContextKey(contextKey);
            if (!contextual[contextName]) {
              contextual[contextName] = {};
            }
            contextual[contextName][
              buildKey(keyPrefix, key)
            ] = options.processValue ? options.processValue(value) : value;
          }
          return;
        }

        flattenTheme(options, [...keyPrefix, key], {
          contextless,
          contextual
        })(themeNode);
        return;
      }

      if (isThemeValue(themeNode)) {
        contextless[buildKey(keyPrefix, key)] = options.processValue
          ? options.processValue(themeNode)
          : themeNode;
        return;
      }

      throw createKeyError(
        keyPrefix,
        key,
        `Unsupported value type '${themeNode}' (${typeof themeNode}).`
      );
    },
    acc
  );
/* eslint-enable no-param-reassign */

const makeInterpolator = (tokens: FlattenedTheme) => (value: ThemeValue) =>
  typeof value === 'string'
    ? value.replace(
        /\$\{([^}]+)\}|\$([^\s]+)/g,
        (_, withCurly, withoutCurly) => {
          const id = withCurly || withoutCurly;
          if (!(id in tokens)) throw new TypeError(`Token '${id}' is unknown.`);
          return String(tokens[id]);
        }
      )
    : value;

export function processTheme(themeSource: ThemeSource): ProcessedTheme {
  const tokens = themeSource.tokens
    ? flattenTheme({ allowContexts: false })(themeSource.tokens).contextless
    : {};
  const interpolateWithTokens = makeInterpolator(tokens);
  const components = flattenTheme({
    allowContexts: true,
    processValue: interpolateWithTokens
  })(themeSource.components);

  return components;
}
