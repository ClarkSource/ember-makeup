import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import Evented from '@ember/object/evented';
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

import config from 'ember-makeup/config';
import { makeStylesheetReader } from 'ember-makeup/utils/stylesheet/reader';

import pEvent from 'p-event';

// @TODO: This fails, when the primary host does not depend on `ember-makeup`
// directly. What should the correct behavior be? I think we should throw a
// build error, similar to `ember-cli-resolve-asset`.

function removeNode(node: Node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}

export default class MakeupService extends Service.extend(Evented) {
  readonly customPropertyPrefix: string = config.options.customPropertyPrefix;
  readonly classNamePrefix: string = config.options.contextClassNamePrefix;
  readonly themePaths: Record<string, string> = config.themePaths;

  /**
   * All browsers that do not support `CSS.supports` also do not support custom
   * properties.
   */
  readonly supportsCustomProperties = Boolean(
    window.CSS && CSS.supports('--foo: var(--bar)')
  );

  get stylesheetReader() {
    return makeStylesheetReader({
      customPropertyPrefix: this.customPropertyPrefix,
      classNamePrefix: this.classNamePrefix
    });
  }

  @tracked
  private linkElement?: HTMLLinkElement;

  private isReady = false;

  @computed('linkElement')
  get properties() {
    if (!this.linkElement || !this.linkElement.sheet) return undefined;

    const sheet = this.linkElement.sheet as CSSStyleSheet;
    return this.stylesheetReader(sheet);
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.prefixContext(context!);
  }

  private prefixContext(context: string) {
    return `${this.classNamePrefix}${context}`;
  }

  private getPropertyValue(key: string, context?: string): string | undefined {
    if (!this.properties) return undefined;

    if (context) {
      return (
        this.properties.contextual[context] &&
        this.properties.contextual[context][key]
      );
    }

    return this.properties.contextless[key];
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
    this.isReady = true;

    this.trigger('theme-change');
  }
}

declare module '@ember/service' {
  interface Registry {
    makeup: MakeupService;
  }
}
