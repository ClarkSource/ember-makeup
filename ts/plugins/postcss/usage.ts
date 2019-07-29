/**
 * A `Usage` is reported for every occurrence of the `cfg` function.
 */
export interface Usage {
  /**
   * The list of selectors of the rule of this declaration this config value is
   * used in.
   *
   * @example ['.foo', '.bar > .foo']
   */
  selectors: string[];

  /**
   * The name of the property of the declaration this config value is used in.
   *
   * @example 'border-color'
   */
  property: string;

  /**
   * The original full value of the declaration this config value is used in.
   */
  originalValue: string;

  /**
   * The fully resolved config key that is referenced, i.e. the part inside of
   * the `cfg()` function.
   *
   * @example 'some-component.border.color'
   */
  key: string;

  /**
   * The file path of the current file.
   */
  path: string;
}

export enum Plugin {}
