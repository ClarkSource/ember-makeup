import Evented from '@ember/object/evented';
import Service from '@ember/service';

export default class MakeupService extends Service.extend(Evented) {
  readonly classNamePrefix: string = 'ember-makeup/contexts/';

  resolveContext(key: string): string {
    return key;
  }
}

declare module '@ember/service' {
  interface Registry {
    makeup: MakeupService;
  }
}
