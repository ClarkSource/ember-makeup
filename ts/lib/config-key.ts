import cssesc from 'cssesc';

const CONFIG_KEY_REGEX = /^[\w-.]+$/i;
const ROOT_CONFIG_KEY_REGEX = /^\/[\w-.]+$/i;

export const isValidResolvedConfigKey = (string: string) =>
  CONFIG_KEY_REGEX.test(string);

export const isValidRootConfigKey = (string: string) =>
  ROOT_CONFIG_KEY_REGEX.test(string);

export const isValidConfigKey = (string: string) =>
  isValidResolvedConfigKey(string) || isValidRootConfigKey(string);

export const containsQuotes = (string: string) =>
  string.includes('"') || string.includes("'") || string.includes('`');

export const resolveRootConfigKey = (key: string) => key.slice(1);

export const serializeConfigKey = (key: string) =>
  `--${cssesc(key, { isIdentifier: true })}`;

export const isContextKey = (key: string) => key.startsWith('$');

export const contextFromContextKey = (key: string) => key.slice(1);
