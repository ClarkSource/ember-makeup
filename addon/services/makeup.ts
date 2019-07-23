import { assert } from '@ember/debug';
import Evented from '@ember/object/evented';
import Service from '@ember/service';

// @TODO: This fails, when the primary host does not depend on `ember-makeup`
// directly. What should the correct behavior be? I think we should throw a
// build error, similar to `ember-cli-resolve-asset`.
import config from 'ember-makeup/config';

import pEvent from 'p-event';
import { computed } from '@ember/object';

function removeNode(node: Node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}

export default class MakeupService extends Service.extend(Evented) {
  readonly customPropertyPrefix: string = config.options.customPropertyPrefix;
  readonly classNamePrefix: string = config.options.contextClassNamePrefix;
  readonly themePaths: Record<string, string> = config.themePaths;

  private linkElement?: HTMLLinkElement;
  private computedStyles: Record<string, CSSStyleDeclaration> = Object.create(
    null
  );

  private isReady = false;

  /**
   * This is a cached element that is appended to the `:root`, so that we can
   * use it to compute styles with in `getComputedStyle`.
   */
  @computed()
  private get probeElement() {
    const element = document.createElement('div');

    // Intentionally using `appendChild` over `append` here, since it is
    // supported in IE11.
    document.documentElement.appendChild(element);

    return element;
  }

  willDestroy() {
    super.willDestroy();
    this.destroyLinkElement();
  }

  private async createLinkElement(href: string) {
    const linkElement = document.createElement('link');
    linkElement.setAttribute('rel', 'stylesheet');
    linkElement.setAttribute('href', href);
    document.head.appendChild(linkElement);

    try {
      await pEvent(linkElement, 'load');

      // Only destroy the old link element _after_ the new one loaded
      // successfully, to avoid FOUC.
      this.destroyLinkElement();

      this.linkElement = linkElement;
    } catch (error) {
      // When loading the new link element failed, still destroy the old link
      // element.
      this.destroyLinkElement();

      // But also cleanup the new link element.
      removeNode(linkElement);

      throw error;
    }
  }

  private destroyLinkElement() {
    if (this.linkElement) {
      removeNode(this.linkElement);
      this.linkElement = undefined;
    }
  }

  resolveContext(key: string): string | undefined {
    if (!this.isReady) return undefined;

    const context = this.getPropertyValue(key);
    assert(`Could not resolve context '${key}'.`, Boolean(context));
    return this.prefixContext(context!);
  }

  private prefixContext(context: string) {
    return `${this.classNamePrefix}${context}`;
  }

  private getPropertyValue(key: string, context?: string): string | undefined {
    if (!this.isReady) return undefined;

    return this.getComputedStyle(context)
      .getPropertyValue(`--${this.customPropertyPrefix}${key}`)
      .trim();
  }

  async setTheme(themeName: string) {
    assert(
      `'${themeName}' is not in the list of known themes: ${Object.keys(
        this.themePaths
      ).join(', ')}`,
      themeName in this.themePaths
    );

    this.isReady = false;

    await this.createLinkElement(this.themePaths[themeName]);
    this.computedStyles = Object.create(null);

    this.isReady = true;

    this.trigger('theme-change');
  }

  /**
   * Returns the computed style for either the document `:root`, if `context` is
   * empty, or the computed style for the given `context`.
   *
   * This can then be used call `getPropertyValue` on to resolve a value.
   *
   * @param context
   */
  private getComputedStyle(context?: string): CSSStyleDeclaration {
    const cacheKey = context ? `context-${context}` : `root`;

    if (!this.computedStyles[cacheKey]) {
      let element: HTMLElement = document.documentElement;
      if (context) {
        element = this.probeElement;
        element.className = this.prefixContext(context);
      }
      this.computedStyles[cacheKey] = window.getComputedStyle(element);
    }
    return this.computedStyles[cacheKey];
  }
}

declare module '@ember/service' {
  interface Registry {
    makeup: MakeupService;
  }
}
