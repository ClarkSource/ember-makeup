import EmberRouter from '@ember/routing/router';

import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.mount('test-lazy-engine', { as: 'lazy-engine' });

  this.route('contextual-example');
  this.route('squares');
});
