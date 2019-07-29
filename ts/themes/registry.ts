import EmberApp from 'ember-cli/lib/broccoli/ember-app';
import Addon from 'ember-cli/lib/models/addon';
import Project from 'ember-cli/lib/models/project';

import { ThemeProvider, ThemeList } from '.';

const isThemeProvider = (keyword: string) => (addon: Addon) =>
  addon.pkg && addon.pkg.keywords && addon.pkg.keywords.includes(keyword);

interface ThemeProviderCreator {
  createEmberMakeupThemeProvider(
    parent: Addon | Project,
    includer: Addon | EmberApp | Project
  ): ThemeProvider;
}

interface ThemeProviderAddon extends Addon, ThemeProviderCreator {}

// @TODO: refactor to use broccoli, to support automatic rebuilds.

export class ThemeProviderRegistry {
  private parent: Addon | Project;
  private includer: Addon | EmberApp | Project;

  private plugins: ThemeProvider[];

  constructor(
    parent: Addon | Project,
    includer: Addon | EmberApp | Project,
    keyword: string
  ) {
    this.parent = parent;
    this.includer = includer;

    this.plugins = this.parent.addons
      .filter(isThemeProvider(keyword))
      .map(addon => this.instantiatePluginFor(addon))
      .concat(this.instantiatePluginFromIncluder(includer))
      .filter(Boolean) as ThemeProvider[];

    if (
      typeof ((includer.options as unknown) as ThemeProviderAddon)
        .createEmberMakeupThemeProvider === 'function'
    ) {
      const plugin = this.instantiatePluginFor(
        (includer.options as unknown) as ThemeProviderAddon
      );
      if (plugin) this.plugins.push(plugin);
    }
  }

  private instantiatePluginFromIncluder(
    includer: Addon | EmberApp | Project
  ): ThemeProvider | undefined {
    if (
      !includer.options ||
      typeof includer.options.createEmberMakeupThemeProvider !== 'function'
    ) {
      return undefined;
    }
    return includer.options.createEmberMakeupThemeProvider(
      this.parent,
      this.includer
    );
  }

  private instantiatePluginFor(
    addon: Addon | ThemeProviderAddon
  ): ThemeProvider | undefined {
    if (
      typeof (addon as ThemeProviderAddon).createEmberMakeupThemeProvider !==
      'function'
    ) {
      this.parent.ui.writeWarnLine(
        `Addon '${addon.name}' has no 'createEmberMakeupThemeProvider' hook.`
      );
      return;
    }

    const plugin = (addon as ThemeProviderAddon).createEmberMakeupThemeProvider(
      this.parent,
      this.includer
    );
    if (!(plugin instanceof ThemeProvider)) {
      this.parent.ui.writeWarnLine(
        `Addon '${addon.name}' did not return a 'ThemeProvider' instance from its 'createEmberMakeupThemeProvider' hook.`
      );
    }

    return plugin;
  }

  getThemeNames(): string[] {
    return Object.keys(this.getThemes());
  }

  getThemes(): ThemeList {
    return Object.assign({}, ...this.plugins.map(plugin => plugin.getThemes()));
  }
}
