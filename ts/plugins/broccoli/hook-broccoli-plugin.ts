import BroccoliPlugin from 'broccoli-plugin';
import { Usage } from '../postcss';

/**
 * Instruments a `BroccoliPlugin` to trigger callbacks when the build is
 * executed. The passed in `plugin` is patched in place, but also returned for
 * convenience.
 *
 * @param plugin The `BroccoliPlugin` to instrument.
 * @param start Optional function called right before the build starts.
 * @param finish Optional function called right after the build finishes.
 */
export function hookBroccoliPlugin<T extends BroccoliPlugin>(
  plugin: T,
  { start, finish }: { start?: () => void; finish?: () => void }
): T {
  const { getCallbackObject } = plugin;
  // eslint-disable-next-line no-param-reassign
  plugin.getCallbackObject = function() {
    const callbackObject = getCallbackObject.call(this);
    return {
      build() {
        if (start) start();
        const returnValue = callbackObject.build();
        if (finish) {
          if (returnValue && typeof returnValue.then === 'function')
            return returnValue.then((value: any) => (finish(), value));
          finish();
        }
        return returnValue;
      }
    };
  };

  return plugin;
}

export function collectUsages<T extends BroccoliPlugin>(
  reportUsages: (usages: Usage[]) => void,
  makePlugin: (reportUsage: (usage: Usage) => void) => T
): T {
  let usages: Usage[] = [];
  const plugin = makePlugin((usage: Usage) => {
    usages.push(usage);
  });
  return hookBroccoliPlugin(plugin, {
    finish() {
      reportUsages(usages);
      usages = [];
    }
  });
}
