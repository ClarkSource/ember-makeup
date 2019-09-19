import { join, dirname } from 'path';

import BroccoliMultifilter from 'broccoli-multifilter';
import { BroccoliNode } from 'broccoli-plugin';
import fg from 'fast-glob';
import makeDir from 'make-dir';

import { readFile, writeFile } from '../../../lib/utils/async-fs';
import { SchemaUsage } from '../../../plugins/postcss';
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
  Schemas = 1
}

export class BroccoliConfigCreatorCSSCompatibility extends BroccoliMultifilter {
  private themes: string[] = [];
  private schemas: string[] = [];

  protected schemaExtension = 'makeup.json';

  constructor(
    themes: BroccoliNode,
    schemas: BroccoliNode,
    options?: ConfigCreatorCSSCompatibilityOptions
  ) {
    super([themes, schemas], options);
  }

  private async scanFiles() {
    [this.themes, this.schemas] = await Promise.all([
      fg('**/*.json', { cwd: this.inputPaths[InputPath.Themes] }),
      fg(`**/*.${this.schemaExtension}`, {
        cwd: this.inputPaths[InputPath.Schemas]
      })
    ]);
  }

  private prefixPath(inputPath: InputPath, filePath: string) {
    return join(this.inputPaths[inputPath], filePath);
  }

  protected async generateCompatibilityCSS(
    theme: Theme,
    usages: SchemaUsage[]
  ) {
    const css = generateCompatibilityCSS(theme, usages);
    return css.toString();
  }

  protected async buildTheme(themePath: string, outputDirectory: string) {
    const absoluteThemePath = this.prefixPath(InputPath.Themes, themePath);
    const theme: Theme = JSON.parse(await readFile(absoluteThemePath, 'utf8'));

    const absoluteStylePaths = this.schemas.map(stylePath =>
      this.prefixPath(InputPath.Schemas, stylePath)
    );

    await Promise.all(
      this.schemas.map(async (path, i) => {
        const absolutePath = absoluteStylePaths[i];
        const outputPath = join(
          outputDirectory,
          `${path.slice(0, -(this.schemaExtension.length + 1))}.${
            theme.name
          }.css`
        );
        const { usages } = JSON.parse(await readFile(absolutePath, 'utf8')) as {
          usages: SchemaUsage[];
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
