import { PrePlugin, PostPlugin } from './';
import Registry from 'ember-cli-preprocessor-registry';
import { EmberMakeupAddon } from '../../addon';

export function register(
  owner: EmberMakeupAddon,
  type: 'self' | 'parent',
  registry: Registry
) {
  if (type !== 'parent') return;

  const TYPE = 'css';

  // Get a list of all already registered plugins.
  const registeredPlugins = Array.from(registry.registeredForType(TYPE));

  // Remove all already registered plugins.
  for (const plugin of registeredPlugins) registry.remove(TYPE, plugin);

  // Put the PrePlugin first.
  registry.add(TYPE, new PrePlugin(owner));

  // Add all removed plugins back in.
  for (const plugin of registeredPlugins) registry.add(TYPE, plugin);

  // Add the PostPlugin.
  // The list now looks like: [PrePlugin, ..., PostPlugin]
  registry.add(TYPE, new PostPlugin(owner));
}
