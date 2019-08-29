import BroccoliPersistentFilter, {
  BroccoliPersistentFilterOptions
} from 'broccoli-persistent-filter';
import { BroccoliNode } from 'broccoli-plugin';
import { safeLoad, LoadOptions } from 'js-yaml';

interface BroccoliYAMLToJSONOptions
  extends BroccoliPersistentFilterOptions,
    Omit<LoadOptions, 'filename'> {
  indentation?: number;
}

export default class BroccoliYAMLToJSON extends BroccoliPersistentFilter {
  private options: BroccoliYAMLToJSONOptions;

  constructor(
    inputNode: BroccoliNode,
    options: BroccoliYAMLToJSONOptions = {}
  ) {
    super(inputNode, {
      extensions: ['yml', 'yaml'],
      targetExtension: 'json',
      ...options
    });
    this.options = options;
  }

  processString(contents: string, relativePath: string) {
    return JSON.stringify(
      safeLoad(contents, { ...this.options, filename: relativePath }),
      null,
      this.options.indentation
    );
  }
}
