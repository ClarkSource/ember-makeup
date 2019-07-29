import { WriteFileOptions } from 'fs';

import BroccoliPlugin from 'broccoli-plugin';

/**
 * Convenience function for creating an instance of the `Creator` / `Class`.
 *
 * @param filename The path of the file to create.
 * @param content The contents to write into the file.
 * @param options
 */
declare function index(
  filename: string,
  content: index.ContentProvider,
  options?: index.Options
): index.Class;

// @todo https://github.com/typescript-eslint/typescript-eslint/issues/60
// eslint-disable-next-line no-redeclare
declare namespace index {
  type Content = string | Uint8Array | Buffer;
  type ContentProvider = Content | Promise<Content> | (() => Content);

  interface Options extends Extract<WriteFileOptions, object> {
    /**
     *  A note to help tell multiple plugin instances apart.
     */
    annotation?: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class Class extends BroccoliPlugin {
    /**
     * @param filename The path of the file to create.
     * @param content The contents to write into the file.
     * @param options
     */
    constructor(filename: string, content: ContentProvider, options?: Options);

    private filename: string;

    private content: ContentProvider;

    private fileOptions: Options;
  }
}

export = index;
