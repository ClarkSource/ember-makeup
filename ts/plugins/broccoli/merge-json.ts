import { readFile as _readFile, writeFile as _writeFile } from 'fs';
import { resolve, sep } from 'path';
import { promisify } from 'util';

import BroccoliPlugin, {
  BroccoliPluginOptions,
  BroccoliNode
} from 'broccoli-plugin';
import fg, { Pattern, Options as GlobOptions } from 'fast-glob';
import fromPairs from 'lodash.frompairs';
import pProps from 'p-props';
import { JsonValue, JsonObject } from 'type-fest';

const readFile = promisify(_readFile);
const writeFile = promisify(_writeFile);

const ENFORCED_GLOB_OPTIONS = {
  absolute: false,
  objectMode: false,
  onlyDirectories: false,
  onlyFiles: true,
  stats: false,
  unique: true
};

const DEFAULT_OPTIONS = {
  indentation: 2,
  pattern: '**/*.json'
};

export interface BroccoliMergeJSONOptions
  extends Omit<BroccoliPluginOptions, 'persistentOutput' | 'needsCache'>,
    Omit<GlobOptions, 'cwd' | keyof typeof ENFORCED_GLOB_OPTIONS> {
  outputFileName?: string;

  // Processing
  preprocess?: (json: JsonValue) => JsonValue | Promise<JsonValue>;
  postprocess?: (json: JsonValue) => JsonValue | Promise<JsonValue>;

  // JSON serialization
  indentation?: number;

  // glob
  pattern?: Pattern | Pattern[];
}

export class BroccoliMergeJSON extends BroccoliPlugin {
  protected readonly options: BroccoliMergeJSONOptions &
    Pick<Required<BroccoliMergeJSONOptions>, keyof typeof DEFAULT_OPTIONS>;

  constructor(
    inputNodes: BroccoliNode[],
    options: BroccoliMergeJSONOptions = {}
  ) {
    super(inputNodes, {
      ...options,
      persistentOutput: false,
      needsCache: false
    });

    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async build() {
    const jsonNodes = await Promise.all(
      this.inputPaths.map(inputPath => this.readInputNode(inputPath))
    );
    const joined = this.joinNodes(jsonNodes);
    const processed = this.options.postprocess
      ? await this.options.postprocess(joined)
      : joined;
    await this.writeOutputFile(processed);
  }

  protected async glob(cwd: string): Promise<string[]> {
    return fg(this.options.pattern, {
      ...this.options,
      ...ENFORCED_GLOB_OPTIONS,
      cwd
    });
  }

  protected async readJSONFile(absolutePath: string): Promise<JsonValue> {
    const json = JSON.parse(await readFile(absolutePath, 'utf8'));
    if (!this.options.preprocess) return json;
    return this.options.preprocess(json);
  }

  private async readInputNode(inputPath: string) {
    const filePaths = await this.glob(inputPath);
    const files: {
      [filePath: string]: JsonValue;
    } = await pProps(
      fromPairs(
        filePaths.map(filePath => [
          filePath,
          this.readJSONFile(resolve(inputPath, filePath))
        ])
      )
    );
    return files;
  }

  protected joinNodes(nodes: { [filePath: string]: JsonValue }[]): JsonObject {
    return nodes.reduce(
      (mergedNodes, node) =>
        Object.entries(node).reduce(
          (mergedFiles, [filePath, json]) =>
            this.deepSetWithFilePath(mergedFiles, filePath, json),
          mergedNodes
        ),
      {}
    );
  }

  protected deepSetWithFilePath(
    merged: JsonObject,
    filePath: string,
    value: JsonValue
  ) {
    const keyPath = filePath.slice(0, -'.json'.length).split(sep);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const leafKey = keyPath.pop()!;

    const immediateParentNode = keyPath.reduce((needle, keySegment) => {
      if (keySegment in needle) {
        if (typeof needle[keySegment] !== 'object' || !needle[keySegment]) {
          throw new TypeError(
            `Expected '${keyPath.join(
              '.'
            )}' to resolve to an object. Failed at '${keySegment}'.`
          );
        }
      } else {
        // eslint-disable-next-line no-param-reassign
        needle[keySegment] = {};
      }
      return needle[keySegment] as JsonObject;
    }, merged);

    if (leafKey in immediateParentNode) {
      throw new TypeError(`'${[keyPath, leafKey].join('.')}' is already set.`);
    }

    immediateParentNode[leafKey] = value;

    return merged;
  }

  protected getOutputFileName(_joined: JsonValue) {
    return this.options.outputFileName || 'merged.json';
  }

  protected serialize(joined: JsonValue) {
    return JSON.stringify(joined, null, this.options.indentation);
  }

  protected async writeOutputFile(joined: JsonValue) {
    const outputFileName = this.getOutputFileName(joined);
    const outputPath = resolve(this.outputPath, outputFileName);
    const content = this.serialize(joined);
    await writeFile(outputPath, content);
  }
}
