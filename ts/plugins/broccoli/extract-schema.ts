import BroccoliPersistentFilter from 'broccoli-persistent-filter';
import { BroccoliNode } from 'broccoli-plugin';
import { parse } from 'postcss';
import { unesc } from 'postcss-selector-parser/dist/util';
import parseValue from 'postcss-value-parser';

import { serializeConfigKey } from '../../lib/config-key';
import { map } from '../../lib/utils/postcss-value-parser';
import { SchemaUsage, VariableUsage } from '../postcss/usage';

export interface BroccoliExtractSchemaOptions {
  customPropertyPrefix: string;
}

export class BroccoliExtractSchema extends BroccoliPersistentFilter {
  private customPropertyPrefix: string;
  private marker: string;

  constructor(
    inputNode: BroccoliNode,
    { customPropertyPrefix }: BroccoliExtractSchemaOptions
  ) {
    super(inputNode, {
      async: true,
      extensions: ['css'],
      targetExtension: 'makeup.json'
    });
    this.customPropertyPrefix = customPropertyPrefix;
    this.marker = `var(${serializeConfigKey(customPropertyPrefix)}`;
  }

  processString(contents: string, relativePath: string) {
    const root = parse(contents, { map: false, from: relativePath });

    const usages: SchemaUsage[] = [];

    root.walkDecls(decl => {
      if (!decl.value.includes(this.marker)) return;
      if (decl.parent.type !== 'rule')
        throw decl.error(
          'Declaration containing ember-makeup variable has to be nested in a rule.'
        );

      usages.push({
        selectors: decl.parent.selectors,
        property: decl.prop,
        value: decl.value,
        tokens: this.extractTokens(decl.value)
      });
    });

    return JSON.stringify({ path: relativePath, usages });
  }

  private extractTokens(value: string) {
    return map(parseValue(value).nodes, node => {
      if (node.type !== 'function' || node.value !== 'var') return node;
      const functionNode = node as VariableUsage;

      if (
        functionNode.nodes.length !== 1 ||
        functionNode.nodes[0].type !== 'word'
      )
        return node;

      const key = this.extractConfigKey(functionNode.nodes[0].value);
      if (!key) return node;

      functionNode.isVariableUsage = true;
      functionNode.key = key;
      return functionNode;
    });
  }

  extractConfigKey(value: string) {
    const key = unesc(value).slice(2); // trim off the leading `--`
    if (!key.startsWith(this.customPropertyPrefix)) return undefined;
    return key.slice(this.customPropertyPrefix.length);
  }
}
