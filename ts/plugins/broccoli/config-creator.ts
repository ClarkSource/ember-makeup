import { Class as BroccoliFileCreator } from 'broccoli-file-creator';
import { EmberMakeupConfig } from '../../../addon/config';

export function configCreator(
  configModuleName: string,
  config: EmberMakeupConfig
) {
  return new BroccoliFileCreator(
    `${configModuleName}.js`,
    `define.exports('${configModuleName}', { default: ${JSON.stringify(
      config
    )} });`
  );
}
