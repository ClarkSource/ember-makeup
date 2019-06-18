export interface Theme {
  [key: string]: Theme | string | number;
}

export type ThemeList = Record<string, Theme>;
