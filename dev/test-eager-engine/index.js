// eslint-disable-next-line node/no-extraneous-require
const EngineAddon = require('ember-engines/lib/engine-addon');

module.exports = EngineAddon.extend({
  name: require('./package').name,

  isDevelopingAddon() {
    return true;
  },

  lazyLoading: {
    enabled: false
  }
});
