import '../../pair-components/textarea';

import {MobxLitElement} from '@adobe/lit-mobx';
import {CSSResultGroup, html, nothing} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import '@material/web/checkbox/checkbox.js';

import {core} from '../../core/core';
import {AuthService} from '../../services/auth.service';
import {HomeService} from '../../services/home.service';
import {Pages, RouterService} from '../../services/router.service';
import {ExperimentEditor} from '../../services/experiment.editor';

import {
  Visibility
} from '@deliberation-lab/utils';

import {styles} from './experiment_settings_editor.scss';

/** Editor for adjusting experiment settings */
@customElement('experiment-settings-editor')
export class ExperimentSettingsEditor extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];

  private readonly experimentEditor = core.getService(ExperimentEditor);

  override render() {
    return html`
      ${this.renderMetadata()}
      <div class="divider"></div>
      ${this.renderPermissions()}
      <div class="divider"></div>
      ${this.renderCohortParticipantConfig()}
      <div class="divider"></div>
      ${this.renderAttentionChecks()}
      <div class="divider"></div>
      ${this.renderProlificConfig()}
      <div class="spacer"></div>
    `;
  }

  private renderMetadata() {
    const updateName = (e: InputEvent) => {
      const name = (e.target as HTMLTextAreaElement).value;
      this.experimentEditor.updateMetadata({ name });
    };

    const updateDescription = (e: InputEvent) => {
      const description = (e.target as HTMLTextAreaElement).value;
      this.experimentEditor.updateMetadata({ description });
    };

    const updatePublicName = (e: InputEvent) => {
      const publicName = (e.target as HTMLTextAreaElement).value;
      this.experimentEditor.updateMetadata({ publicName });
    };

    return html`
      <div class="section">
        <div class="title">Metadata</div>
        <pr-textarea
          label="Private experiment name"
          placeholder="Internal experiment name (not visible to participants)"
          variant="outlined"
          .value=${this.experimentEditor.experiment.metadata.name ?? ''}
          @input=${updateName}
        >
        </pr-textarea>
        <pr-textarea
          label="Private experiment description"
          placeholder="Experiment description (not visible to participants)"
          variant="outlined"
          .value=${this.experimentEditor.experiment.metadata.description ?? ''}
          @input=${updateDescription}
        >
        </pr-textarea>
        <pr-textarea
          label="Public experiment name"
          placeholder="External experiment name (shown to participants)"
          variant="outlined"
          .value=${this.experimentEditor.experiment.metadata.publicName ?? ''}
          @input=${updatePublicName}
        >
        </pr-textarea>
      </div>
    `;
  }

  private renderPermissions() {
    const isPublic = this.experimentEditor.experiment.permissions.visibility ===
      Visibility.PUBLIC;

    const updateVisibility = () => {
      const visibility = isPublic ? Visibility.PRIVATE : Visibility.PUBLIC;
      this.experimentEditor.updatePermissions({visibility});
    };

    return html`
      <div class="section">
        <div class="title">Permissions</div>
        <div class="checkbox-wrapper">
          <md-checkbox
            touch-target="wrapper"
            ?checked=${isPublic}
            @click=${updateVisibility}
          >
          </md-checkbox>
          <div>
            Make experiment public (all researchers on platform can
            view and edit)
          </div>
        </div>
      </div>
    `;
  }

  private renderCohortParticipantConfig() {
    // TODO: Consolidate helper functions with the ones under
    // cohorts_settings_dialog.ts (as they're basically the same,
    // just updating experiment config vs. cohort config)
    return html`
      <div class="section">
        <div class="title">Default cohort settings</div>
        <div class="description">
          Note: Cohorts within your experiment will be automatically created
          with these settings. You can update each individual cohort's settings
          later.
        </div>
        ${this.renderMaxParticipantConfig()}
        ${this.renderIncludeAllParticipantsConfig()}
      </div>
    `;
  }

  private renderMinParticipantConfig() {
    const minParticipants =
      this.experimentEditor.experiment.defaultCohortConfig.minParticipantsPerCohort;

    const updateCheck = () => {
      if (minParticipants === null) {
        this.experimentEditor.updateCohortConfig({ minParticipantsPerCohort: 0 });
      } else {
        this.experimentEditor.updateCohortConfig({ minParticipantsPerCohort: null });
      }
    };

    const updateNum = (e: InputEvent) => {
      const num = Number((e.target as HTMLTextAreaElement).value);
      this.experimentEditor.updateCohortConfig({ minParticipantsPerCohort: num });
    };

    return html`
      <div class="config-item">
        <div class="checkbox-wrapper">
          <md-checkbox
            touch-target="wrapper"
            ?checked=${minParticipants !== null}
            @click=${updateCheck}
          >
          </md-checkbox>
          <div>
            Require minimum number of participants in cohort
            to start experiment
          </div>
        </div>
        <div class="number-input">
          <label for="minParticipants">
            Minimum number of participants
          </label>
          <input
            type="number"
            id="minParticipants"
            name="minParticipants"
            min="0"
            .value=${minParticipants ?? 0}
            @input=${updateNum}
          />
        </div>
      </div>
    `;
  }

  private renderMaxParticipantConfig() {
    const maxParticipants =
      this.experimentEditor.experiment.defaultCohortConfig.maxParticipantsPerCohort;

    const updateCheck = () => {
      if (maxParticipants === null) {
        this.experimentEditor.updateCohortConfig({ maxParticipantsPerCohort: 100 });
      } else {
        this.experimentEditor.updateCohortConfig({ maxParticipantsPerCohort: null });
      }
    };

    const updateNum = (e: InputEvent) => {
      const num = Number((e.target as HTMLTextAreaElement).value);
      this.experimentEditor.updateCohortConfig({ maxParticipantsPerCohort: num });
    };

    return html`
      <div class="config-item">
        <div class="checkbox-wrapper">
          <md-checkbox
            touch-target="wrapper"
            ?checked=${maxParticipants !== null}
            @click=${updateCheck}
          >
          </md-checkbox>
          <div>
            Limit cohort to maximum number of participants
          </div>
        </div>
        <div class="number-input">
          <label for="maxParticipants">
            Maximum number of participants
          </label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            min="0"
            .value=${maxParticipants ?? 100}
            @input=${updateNum}
          />
        </div>
      </div>
    `;
  }

  private renderIncludeAllParticipantsConfig() {
    const includeAllParticipants =
      this.experimentEditor.experiment.defaultCohortConfig.includeAllParticipantsInCohortCount;
    const updateCheck = () => {
      const includeAllParticipantsInCohortCount = !includeAllParticipants;
      this.experimentEditor.updateCohortConfig(
        { includeAllParticipantsInCohortCount }
      );
    };

    return html`
      <div class="config-item">
        <div class="checkbox-wrapper">
          <md-checkbox
            touch-target="wrapper"
            ?checked=${includeAllParticipants}
            @click=${updateCheck}
          >
          </md-checkbox>
          <div>
            Include all participants (even ones who have left the experiment)
            in cohort count
          </div>
        </div>
      </div>
    `;
  }

  private renderAttentionChecks() {
    const isAttention = this.experimentEditor.experiment.attentionCheckConfig.enableAttentionChecks;

    const updateAttention = () => {
      const enableAttentionChecks = !isAttention;
      this.experimentEditor.updateAttentionCheckConfig({enableAttentionChecks});
    };

    return html`
      <div class="section">
        <div class="title">Attention Checks</div>
        <div class="description">
          Note: If an attention check popup is not clicked within the given time,
          the participant is removed from the experiment
        </div>
        <div class="checkbox-wrapper">
          <md-checkbox
            touch-target="wrapper"
            ?checked=${isAttention}
            @click=${updateAttention}
          >
          </md-checkbox>
          <div>
            Enable attention checks
          </div>
        </div>
        ${isAttention ? this.renderAttentionWaitSeconds() : nothing}
        ${isAttention ? this.renderAttentionPopupSeconds() : nothing}
      </div>
    `;
  }

  private renderAttentionWaitSeconds() {
    const waitSeconds =
      this.experimentEditor.experiment.attentionCheckConfig.waitSeconds;

    const updateNum = (e: InputEvent) => {
      const waitSeconds = Number((e.target as HTMLTextAreaElement).value);
      this.experimentEditor.updateAttentionCheckConfig({ waitSeconds });
    };

    return html`
      <div class="number-input">
        <label for="waitSeconds">
          Wait time (in seconds) before attention check popup
        </label>
        <input
          type="number"
          id="waitSeconds"
          name="waitSeconds"
          min="0"
          .value=${waitSeconds}
          @input=${updateNum}
        />
      </div>
    `;
  }

  private renderAttentionPopupSeconds() {
    const popupSeconds =
      this.experimentEditor.experiment.attentionCheckConfig.popupSeconds;

    const updateNum = (e: InputEvent) => {
      const popupSeconds = Number((e.target as HTMLTextAreaElement).value);
      this.experimentEditor.updateAttentionCheckConfig({ popupSeconds });
    };

    return html`
      <div class="number-input">
        <label for="popupSeconds">
          Duration of attention check popup (in seconds)
        </label>
        <input
          type="number"
          id="popupSeconds"
          name="popupSeconds"
          min="0"
          .value=${popupSeconds}
          @input=${updateNum}
        />
      </div>
    `;
  }

  private renderProlificConfig() {
    const config = this.experimentEditor.experiment.prolificConfig;
    const isProlific = config.enableProlificIntegration;

    const updateProlificIntegration = () => {
      const enableProlificIntegration = !isProlific;
      this.experimentEditor.updateProlificConfig({enableProlificIntegration});
    };

    return html`
      <div class="section">
        <div class="title">Prolific Integration</div>
        <div class="checkbox-wrapper">
          <md-checkbox
            touch-target="wrapper"
            ?checked=${isProlific}
            @click=${updateProlificIntegration}
          >
          </md-checkbox>
          <div>
            Enable integration with Prolific
          </div>
        </div>
        ${isProlific ? this.renderProlificRedirectCodes() : nothing}
      </div>
    `;
  }

  private renderProlificRedirectCodes() {
    const updateDefault = (e: InputEvent) => {
      const defaultRedirectCode = (e.target as HTMLTextAreaElement).value;
      this.experimentEditor.updateProlificConfig({ defaultRedirectCode });
    };

    const updateAttention = (e: InputEvent) => {
      const attentionFailRedirectCode = (e.target as HTMLTextAreaElement).value;
      this.experimentEditor.updateProlificConfig({ attentionFailRedirectCode });
    };

    return html`
      <div class="inner-setting">
        <pr-textarea
          label="Default redirect code (e.g., when experiment ends)"
          placeholder="Add Prolific redirect code"
          variant="outlined"
          .value=${this.experimentEditor.experiment.prolificConfig.defaultRedirectCode ?? ''}
          @input=${updateDefault}
        >
        </pr-textarea>
        <pr-textarea
          label="Attention redirect code (used when participants fail attention checks)"
          placeholder="Add Prolific redirect code for attention check failures"
          variant="outlined"
          .value=${this.experimentEditor.experiment.prolificConfig.attentionFailRedirectCode ?? ''}
          @input=${updateAttention}
        >
        </pr-textarea>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'experiment-settings-editor': ExperimentSettingsEditor;
  }
}
