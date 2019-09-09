import { extname } from 'path';

export const stripExtension = (path: string) =>
  path.slice(0, -extname(path).length);
