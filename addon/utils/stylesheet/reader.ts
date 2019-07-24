import { unescape } from '../css';

export const makeStylesheetReader = ({
  customPropertyPrefix,
  classNamePrefix
}: {
  customPropertyPrefix: string;
  classNamePrefix: string;
}) => (sheet: CSSStyleSheet) => {
  const getContextFromSelector = (selector: string) =>
    unescape(selector).slice(classNamePrefix.length + 1);

  const getKeyFromCustomProperty = (property: string) =>
    unescape(property).slice(customPropertyPrefix.length + 2);

  const contextless: Record<string, string> = {};
  const contextual: Record<string, Record<string, string>> = {};

  for (const rule of (sheet.cssRules as unknown) as Iterable<CSSStyleRule>) {
    let props = contextless;
    if (rule.selectorText !== ':root') {
      const context = getContextFromSelector(rule.selectorText);
      if (!contextual[context]) {
        contextual[context] = {};
      }
      props = contextual[context];
    }

    for (const prop of rule.style) {
      if (!prop.startsWith('--')) continue;
      props[getKeyFromCustomProperty(prop)] = rule.style
        .getPropertyValue(prop)
        .trim();
    }
  }

  return { contextless, contextual };
};
