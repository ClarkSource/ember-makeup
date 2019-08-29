import fromPairs from 'lodash.frompairs';

import generate from './schema/generate';

const commands = [generate];

export default fromPairs(commands.map(command => [command.name, command]));
