import '../../pair-components/button';
import '../progress/progress_stage_completed';
import './stage_description';
import './stage_footer';

import {MobxLitElement} from '@adobe/lit-mobx';
import {CSSResultGroup, html, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';

import {core} from '../../core/core';
import {CohortService} from '../../services/cohort.service';
import {ParticipantAnswerService} from '../../services/participant.answer';
import {ParticipantService} from '../../services/participant.service';
import {
  FlipCardConfig,
  FlipCardEvent,
  FlipCardStageConfig,
  FlipCardStageParticipantAnswer,
  StageKind,
} from '@deliberation-lab/utils';

import {styles} from './flipcard_view.scss';

/**
 * FlipCard stage view for participants.
 */
@customElement('flipcard-participant-view')
export class FlipCardParticipantView extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];

  private readonly cohortService = core.getService(CohortService);
  private readonly participantAnswerService = core.getService(
    ParticipantAnswerService,
  );
  private readonly participantService = core.getService(ParticipantService);

  @property() stage: FlipCardStageConfig | null = null;
  @state() flippedCards: Set<string> = new Set();
  @state() selectedCard: string | null = null;
  @state() confirmedCard: string | null = null;

  override render() {
    if (!this.stage) {
      return nothing;
    }

    const stageAnswer = this.participantService.getStageAnswer(
      this.stage.id,
    ) as FlipCardStageParticipantAnswer;

    // Initialize state from existing data if available
    if (stageAnswer && this.selectedCard === null) {
      this.selectedCard = stageAnswer.selectedCardId;
      
      // Initialize flipped cards from interactions
      if (stageAnswer.interactions) {
        stageAnswer.interactions.forEach((interaction) => {
          if (interaction.eventType === FlipCardEvent.FLIP) {
            this.flippedCards.add(interaction.cardId);
          }
        });
      }
    }

    return html`
      <stage-description .stage=${this.stage}></stage-description>
      <div class="flipcard-container">
        ${this.renderConfirmButton()}
        ${this.selectedCard && !this.confirmedCard
          ? html`<div class="selection-text">
              You've selected a card. Please confirm your selection.
            </div>`
          : nothing}
        <div class="cards-container">
          ${this.stage.cards.map((card) => this.renderCard(card))}
        </div>
      </div>
      <stage-footer .disabled=${this.participantService.disableStage || !this.confirmedCard}>
        ${this.stage.progress.showParticipantProgress
          ? html`<progress-stage-completed></progress-stage-completed>`
          : nothing}
      </stage-footer>
    `;
  }

  private renderCard(card: FlipCardConfig) {
    const isFlipped = this.flippedCards.has(card.id);
    const isSelected = this.selectedCard === card.id;
    const isConfirmed = this.confirmedCard === card.id;
    const isDisabled = this.participantService.disableStage || this.confirmedCard !== null;

    const cardClasses = classMap({
      card: true,
      flipped: isFlipped,
      selected: isSelected,
    });

    return html`
      <div class=${cardClasses}>
        <div class="card-front">
          <h3 class="card-title">${card.title}</h3>
          ${card.imageUrl
            ? html`<img class="card-image" src=${card.imageUrl} alt=${card.title} />`
            : nothing}
          <div class="card-content">${card.frontContent}</div>
          <div class="card-actions">
            <pr-button
              @click=${(e: Event) => {
                e.stopPropagation();
                this.handleFlip(card.id);
              }}
              ?disabled=${isDisabled}
              variant="outlined"
            >
              Learn More
            </pr-button>
            <pr-button
              @click=${(e: Event) => {
                e.stopPropagation();
                this.handleSelect(card.id);
              }}
              ?disabled=${isDisabled || isConfirmed}
              variant=${isSelected && !isConfirmed ? 'default' : 'tonal'}
              color=${isSelected ? 'primary' : 'tertiary'}
            >
              ${isSelected ? 'Selected' : 'Select'}
            </pr-button>
          </div>
        </div>
        <div class="card-back">
          <h3 class="card-title">${card.title}</h3>
          ${card.backImageUrl
            ? html`<img class="card-image" src=${card.backImageUrl} alt=${card.title} />`
            : nothing}
          <div class="card-content">${card.backContent}</div>
          <div class="card-actions">
            <pr-button
              @click=${(e: Event) => {
                e.stopPropagation();
                this.handleFlip(card.id);
              }}
              ?disabled=${isDisabled}
              variant="outlined"
            >
              Back
            </pr-button>
          </div>
        </div>
      </div>
    `;
  }

  private renderConfirmButton() {
    if (!this.selectedCard || this.confirmedCard) {
      return nothing;
    }

    return html`
      <div class="confirm-container">
        <pr-button
          @click=${(e: Event) => {
            e.stopPropagation();
            this.handleConfirm();
          }}
          ?disabled=${this.participantService.disableStage}
          color="primary"
          size="large"
        >
          Confirm Selection
        </pr-button>
      </div>
    `;
  }

  private async handleFlip(cardId: string) {
    if (this.participantService.disableStage || this.confirmedCard) {
      return;
    }

    // Toggle the flipped state
    if (this.flippedCards.has(cardId)) {
      this.flippedCards.delete(cardId);
    } else {
      this.flippedCards.add(cardId);
    }

    // Record the flip interaction
    if (this.stage) {
      await this.participantService.setFlipCardInteraction(
        this.stage.id,
        FlipCardEvent.FLIP,
        cardId,
      );
    }

    this.requestUpdate();
  }

  private async handleSelect(cardId: string) {
    if (this.participantService.disableStage || this.confirmedCard) {
      return;
    }

    // Toggle selection if already selected, otherwise select
    this.selectedCard = this.selectedCard === cardId ? null : cardId;

    // Record the selection interaction
    if (this.stage && this.selectedCard) {
      await this.participantService.setFlipCardInteraction(
        this.stage.id,
        FlipCardEvent.SELECT,
        cardId,
      );
    }

    this.requestUpdate();
  }

  private async handleConfirm() {
    if (this.participantService.disableStage || !this.selectedCard || this.confirmedCard) {
      return;
    }

    this.confirmedCard = this.selectedCard;

    // Record the confirmation interaction
    if (this.stage) {
      await this.participantService.setFlipCardInteraction(
        this.stage.id,
        FlipCardEvent.CONFIRM,
        this.selectedCard,
      );
    }

    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flipcard-participant-view': FlipCardParticipantView;
  }
}