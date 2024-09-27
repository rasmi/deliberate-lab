import '../../pair-components/button';
import '../../pair-components/icon_button';
import '../../pair-components/info_popup';

import {MobxLitElement} from '@adobe/lit-mobx';
import {CSSResultGroup, html, nothing} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import {StageConfig} from '@deliberation-lab/utils';

import {styles} from './participant_header.scss';

/** Header component for participant preview */
@customElement('participant-header')
export class Header extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];

  @property() stage: StageConfig|undefined = undefined;

  override render() {
    if (!this.stage) {
      return nothing;
    }

    return html`
      <div class="header">
        <div class="left">
          ${this.stage.name}
        </div>
        <div class="right">
          ${this.renderInfo()}
          ${this.renderHelp()}
        </div>
      </div>
    `;
  }

  private renderInfo() {
    if (!this.stage || this.stage.descriptions.infoText.length === 0) {
      return nothing;
    }
    return html`
      <info-popup .popupText=${this.stage.descriptions.infoText}></info-popup>
    `;
  }

  private renderHelp() {
    if (!this.stage || this.stage.descriptions.helpText.length === 0) {
      return nothing;
    }
    return html`
      <info-popup .showHelpIcon=${true} .popupText=${this.stage.descriptions.helpText}></info-popup>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'participant-header': Header;
  }
}