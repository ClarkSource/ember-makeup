import { readFile as _readFile, writeFile as _writeFile } from 'fs';
import { promisify } from 'util';

export const readFile = promisify(_readFile);
export const writeFile = promisify(_writeFile);
