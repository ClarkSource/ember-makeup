import generate from './schema/generate';

const commands = [generate];

export default Object.fromEntries(
  commands.map(command => [command.name, command])
);
