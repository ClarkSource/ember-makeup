import Application from '@ember/application';

import loadInitializers from 'ember-load-initializers';

import config from './config/environment';
import Resolver from './resolver';

const { modulePrefix, podModulePrefix } = config;

export default class TestApplication extends Application {
  modulePrefix = modulePrefix;
  podModulePrefix = podModulePrefix;
  Resolver = Resolver;

  engines = {
    testLazyEngine: {
      dependencies: {
        services: ['makeup']
      }
    }
  };
}

loadInitializers(TestApplication, modulePrefix);
