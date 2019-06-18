import Component from '@ember/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

import MakeupService from 'ember-makeup/services/makeup';

export default class SetThemeButton extends Component {
  @service makeup!: MakeupService;

  theme!: string;

  @action
  setTheme() {
    this.makeup.setTheme(this.theme);
  }
}
