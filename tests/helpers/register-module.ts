declare const define: {
  // @see https://github.com/ember-cli/loader.js?#defineexportsfoo-
  exports(moduleName: string, moduleExports: object): void;
};

const semiRandom = Date.now();
let i = 0;

export default function registerModule(moduleExports: object): string {
  const semiRandomModuleName = `random-module/${semiRandom}/${i++}`;
  define.exports(semiRandomModuleName, moduleExports);
  return semiRandomModuleName;
}
