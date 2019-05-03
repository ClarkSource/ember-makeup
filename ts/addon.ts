import { addon } from './lib/utils/ember-cli-entities';
import BroccoliDebug from 'broccoli-debug';
import PreprocessorRegistryPlugin from './preprocessor-registry-plugin';

export default addon({
  name: require(`${__dirname}/../package`).name as string,

  get debugTree() {
    return BroccoliDebug.buildDebugCallback(this.name);
  },

  setupPreprocessorRegistry(type, registry) {
    if (type !== 'parent') return;

    registry.add('css', new PreprocessorRegistryPlugin(this));
  }
});
