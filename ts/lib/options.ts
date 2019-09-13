export interface MakeupOptions {
  pathPrefix?: string;
  customPropertyPrefix?: string;
  contextClassNamePrefix?: string;
  contextKeyword?: string;

  ignoreVersionCheck?: boolean;
}

export type FinalMakeupOptions = Readonly<Required<MakeupOptions>>;

export const DEFAULT_OPTIONS: FinalMakeupOptions = Object.freeze({
  pathPrefix: 'ember-makeup',
  customPropertyPrefix: 'ember-makeup/cfg/',
  contextClassNamePrefix: 'ember-makeup/context/',
  contextKeyword: 'context',

  ignoreVersionCheck: false
});

export function computeOptions(options?: MakeupOptions): FinalMakeupOptions {
  if (options && typeof options === 'object') {
    return { ...DEFAULT_OPTIONS, ...options };
  }

  return { ...DEFAULT_OPTIONS };
}
