import Helper from '@ember/component/helper';
import { action } from '@ember/object';
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
    if (this.hasContexts) this.recompute();
  }

  compute(params: [string], named: { from: string }) {
    const localClasses = originalLocalClass(params, named);
    const { classNamePrefix } = this.makeup;

    // If the magic context class name prefix is not contained in the class
    // list, just pass through the unchanged local classes.
    this.hasContexts = localClasses.includes(classNamePrefix);
    if (!this.hasContexts) return localClasses;

    // Forward all regular local classes and resolve all context classes.
    return localClasses
      .split(' ')
      .map(className =>
        className.startsWith(classNamePrefix)
          ? this.makeup.resolveContext(className.slice(classNamePrefix.length))
          : className
      )
      .join(' ');
  }
}
