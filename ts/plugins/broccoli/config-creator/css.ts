import { BroccoliNode } from 'broccoli-plugin';
import { JsonValue, JsonObject } from 'type-fest';

import { processTheme, isThemeSource } from '../../../theme/process-theme';
import BroccoliJSONToCSS from '../json-to-css';
import { BroccoliMergeJSON } from '../merge-json';
import BroccoliYAMLToJSON from '../yaml-to-json';

export interface ConfigCreatorCSSOptions {
  themeName: string;

  customPropertyPrefix: string;
  contextClassNamePrefix: string;
}

export function configCreatorCSS(
  inputNode: BroccoliNode,
  {
    themeName,
    customPropertyPrefix,
    contextClassNamePrefix
  }: ConfigCreatorCSSOptions
) {
  const individualJSONFiles = new BroccoliYAMLToJSON(inputNode);
  const mergedJSON = new BroccoliMergeJSON([individualJSONFiles], {
    outputFileName: `${themeName}.json`,
    ignore: ['package.json'],
    postprocess(themeSource: JsonValue): JsonObject {
      if (!isThemeSource(themeSource))
        throw new TypeError(
          `'${themeName}' was not processed as a correct theme source.`
        );
      return (processTheme(themeSource) as unknown) as JsonObject;
    }
  });
  const cssTheme = new BroccoliJSONToCSS(mergedJSON, {
    customPropertyPrefix,
    contextClassNamePrefix
  });
  return cssTheme;
}
