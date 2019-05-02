import { addon } from './lib/utils/ember-cli-entities';

export default addon({
  name: require(`${__dirname}/../package`).name as string
});
