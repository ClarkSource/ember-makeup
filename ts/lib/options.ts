export interface MakeupOptions {
  intermediateOutputPath?: string;
}

export const DEFAULT_OPTIONS: MakeupOptions = Object.freeze({});

export function computeOptions(options?: MakeupOptions): MakeupOptions {
  if (options && typeof options === 'object') {
    return Object.assign({}, DEFAULT_OPTIONS, options);
  }

  return Object.assign({}, DEFAULT_OPTIONS);
}
