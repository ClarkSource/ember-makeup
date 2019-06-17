import Evented from '@ember/object/evented';
import Service from '@ember/service';

import config from 'ember-makeup/config';

export default class MakeupService extends Service.extend(Evented) {
  readonly classNamePrefix: string = config.contextClassNamePrefix;

  resolveContext(key: string): string {
    return key;
  }
}

declare module '@ember/service' {
  interface Registry {
    makeup: MakeupService;
  }
}