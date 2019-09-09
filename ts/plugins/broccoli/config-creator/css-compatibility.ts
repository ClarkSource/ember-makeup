import { join, dirname } from 'path';

import BroccoliMultifilter from 'broccoli-multifilter';
import { BroccoliNode } from 'broccoli-plugin';
import fg from 'fast-glob';
import makeDir from 'make-dir';

import { readFile, writeFile } from '../../../lib/utils/async-fs';
import { Usage } from '../../../plugins/postcss';
import { generateCompatibilityCSS } from '../../postcss/compatibility-css';
import { Theme } from './css';

export interface ConfigCreatorCSSCompatibilityOptions {
  customPropertyPrefix: string;
  contextClassNamePrefix: string;

  name?: string;
  annotation?: string;
}

enum InputPath {
  Themes = 0,
  Styles = 1
}

export class BroccoliConfigCreatorCSSCompatibility extends BroccoliMultifilter {
  private themes: string[] = [];
  private styles: string[] = [];

  protected styleExtension = 'makeup.json';

  constructor(
    themes: BroccoliNode,
    styles: BroccoliNode,
    options?: ConfigCreatorCSSCompatibilityOptions
  ) {
    super([themes, styles], options);
  }

  private async scanFiles() {
    [this.themes, this.styles] = await Promise.all([
      fg('**/*.json', { cwd: this.inputPaths[InputPath.Themes] }),
      fg(`**/*.${this.styleExtension}`, {
        cwd: this.inputPaths[InputPath.Styles]
      })
    ]);
  }

  private prefixPath(inputPath: InputPath, filePath: string) {
    return join(this.inputPaths[inputPath], filePath);
  }

  protected async generateCompatibilityCSS(theme: Theme, usages: Usage[]) {
    const css = generateCompatibilityCSS(theme, usages);
    return css.toString();
  }

  protected async buildTheme(themePath: string, outputDirectory: string) {
    const absoluteThemePath = this.prefixPath(InputPath.Themes, themePath);
    const theme: Theme = JSON.parse(await readFile(absoluteThemePath, 'utf8'));

    const absoluteStylePaths = this.styles.map(stylePath =>
      this.prefixPath(InputPath.Styles, stylePath)
    );

    await Promise.all(
      this.styles.map(async (path, i) => {
        const absolutePath = absoluteStylePaths[i];
        const outputPath = join(
          outputDirectory,
          `${path.slice(0, -(this.styleExtension.length + 1))}.${
            theme.name
          }.css`
        );
        const { usages } = JSON.parse(await readFile(absolutePath, 'utf8')) as {
          usages: Usage[];
        };

        const compatibilityCSS = await this.generateCompatibilityCSS(
          theme,
          usages
        );

        await makeDir(dirname(outputPath));
        await writeFile(outputPath, compatibilityCSS, 'utf8');
      })
    );

    return { dependencies: [absoluteThemePath, ...absoluteStylePaths] };
  }

  async build() {
    await this.scanFiles();
    await this.buildAndCache(this.themes, this.buildTheme);
  }
}
