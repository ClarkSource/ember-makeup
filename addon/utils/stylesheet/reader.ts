import { unescape } from '../css';

export const makeStylesheetReader = ({
  customPropertyPrefix,
  contextClassNamePrefix
}: {
  customPropertyPrefix: string;
  contextClassNamePrefix: string;
}) => (sheet: CSSStyleSheet) => {
  const getContextFromSelector = (selector: string) =>
    unescape(selector).slice(contextClassNamePrefix.length + 1);

  const getKeyFromCustomProperty = (property: string) =>
    unescape(property).slice(customPropertyPrefix.length + 2);

  const contextless: Record<string, string> = {};
  const contextual: Record<string, Record<string, string>> = {};

  for (const rule of (sheet.cssRules as unknown) as Iterable<CSSStyleRule>) {
    let properties = contextless;
    if (rule.selectorText !== ':root') {
      const context = getContextFromSelector(rule.selectorText);
      if (!contextual[context]) {
        contextual[context] = {};
      }
      properties = contextual[context];
    }

    for (const property of rule.style) {
      if (!property.startsWith('--')) continue;
      properties[
        getKeyFromCustomProperty(property)
      ] = rule.style.getPropertyValue(property).trim();
    }
  }

  return { contextless, contextual };
};
