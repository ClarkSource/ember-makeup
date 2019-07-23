import { assert } from '@ember/debug';
import Evented from '@ember/object/evented';
import Service from '@ember/service';

// @TODO: This fails, when the primary host does not depend on `ember-makeup`
// directly. What should the correct behavior be? I think we should throw a
// build error, similar to `ember-cli-resolve-asset`.
import config from 'ember-makeup/config';

import pEvent from 'p-event';

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
  private computedStyle!: CSSStyleDeclaration;

  private isReady = false;

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
    return `${this.classNamePrefix}${context}`;
  }

  private getPropertyValue(key: string) {
    return this.computedStyle
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

    await this.createLinkElement(this.themePaths[themeName]);
    this.computedStyle = window.getComputedStyle(document.documentElement);

    this.isReady = true;

    this.trigger('theme-change');
  }
}

declare module '@ember/service' {
  interface Registry {
    makeup: MakeupService;
  }
}
