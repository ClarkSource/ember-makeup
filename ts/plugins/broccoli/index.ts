import BroccoliPersistentFilter from 'broccoli-persistent-filter';

export default class EmberMakeupBroccoliPlugin extends BroccoliPersistentFilter {
  processString(_contents: string, _relativePath: string): string | object {
    throw new Error('Method not implemented.');
  }
}
