import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

import MakeupService from 'dummy/services/makeup';

export default class ApplicationController extends Controller {
  @service makeup!: MakeupService;

  get themeNames() {
    return Object.keys(this.makeup.themePaths);
  }
}
