import postcss from 'postcss';

import { Usage } from '.';
import { Theme } from '../broccoli/config-creator';

export function generateCompatibilityCSS(theme: Theme, usages: Usage[]) {
  const root = postcss.root();

  for (const usage of usages) {
    root.append(
      postcss.rule({
        selectors: usage.selectors,
        nodes: [
          postcss.decl({
            prop: usage.property,
            value:
              // @todo handle contextual properties and multiple `cfg()` per decl
              (theme.contextless[usage.key] as string) || usage.originalValue
          })
        ]
      })
    );
  }

  return root;
}
