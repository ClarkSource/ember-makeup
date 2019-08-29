import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';

import MakeupService from 'ember-makeup/services/makeup';

export interface SetThemeButtonArgs {
  theme: string;
}

export default class SetThemeButtonComponent extends Component<
  SetThemeButtonArgs
> {
  @service makeup!: MakeupService;

  @action
  setTheme() {
    this.makeup.setTheme(this.args.theme);
  }
}
