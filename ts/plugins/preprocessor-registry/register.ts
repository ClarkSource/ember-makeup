import Registry from 'ember-cli-preprocessor-registry';
import get from 'lodash.get';

import { PrePlugin, PostPlugin } from '.';
import { EmberMakeupAddon } from '../../addon';

export function register(
  owner: EmberMakeupAddon,
  type: 'self' | 'parent',
  registry: Registry
) {
  if (type !== 'parent') return;

  const TYPE = 'css';

  // Get a list of all already registered plugins.
  const registeredPlugins = [...registry.registeredForType(TYPE)];

  // Remove all already registered plugins.
  for (const plugin of registeredPlugins) registry.remove(TYPE, plugin);

  // Find the `ember-css-modules` `OutputStylesProcessor`, if present.
  const emberCSSModulesPluginIndex = registeredPlugins.findIndex(
    plugin => get(plugin, 'owner.name') === 'ember-css-modules'
  );

  // Add the `PrePlugin` _right_ behind the `OutputStylesProcessor`, or to the
  // beginning of the array.
  registeredPlugins.splice(
    // If the plugin is not present: `-1 + 1 = 0`
    emberCSSModulesPluginIndex + 1,
    0,
    new PrePlugin(owner)
  );

  // Add the PostPlugin.
  // The list now looks like: [PrePlugin, ..., PostPlugin]
  registeredPlugins.push(new PostPlugin(owner));

  // Add all plugins back in.
  for (const plugin of registeredPlugins) registry.add(TYPE, plugin);
}
