import BroccoliPersistentFilter from 'broccoli-persistent-filter';

export default class EmberMakeupBroccoliPlugin extends BroccoliPersistentFilter {
  processString(contents: string, relativePath: string): string | object {
    throw new Error('Method not implemented.');
  }
}
