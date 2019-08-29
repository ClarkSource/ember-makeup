import Helper from '@ember/component/helper';
import { action } from '@ember/object';
import { join } from '@ember/runloop';
import { inject as service } from '@ember/service';

import { localClass as originalLocalClass } from 'ember-css-modules/helpers/local-class';
import MakeupService from 'ember-makeup/services/makeup';

export default class LocalClassHelper extends Helper {
  @service makeup!: MakeupService;

  private hasContexts = false;

  init() {
    super.init();

    this.makeup.on('theme-change', this.onThemeChange);
  }

  willDestroy() {
    super.willDestroy();

    this.makeup.off('theme-change', this.onThemeChange);
  }

  @action
  private onThemeChange() {
    // @TODO: https://github.com/emberjs/ember.js/issues/14774
    if (this.hasContexts) join(() => this.recompute());
  }

  compute(params: [string], named: { from: string }) {
    const localClasses = originalLocalClass(params, named);
    const { contextClassNamePrefix } = this.makeup;

    // If the magic context class name prefix is not contained in the class
    // list, just pass through the unchanged local classes.
    this.hasContexts = localClasses.includes(contextClassNamePrefix);
    if (!this.hasContexts) return localClasses;

    // Forward all regular local classes and resolve all context classes.
    return localClasses
      .split(' ')
      .map(className =>
        className.startsWith(contextClassNamePrefix)
          ? this.makeup.resolveContext(
              className.slice(contextClassNamePrefix.length)
            )
          : className
      )
      .join(' ');
  }
}
