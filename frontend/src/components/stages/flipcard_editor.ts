import '../../pair-components/button';
import '../../pair-components/icon_button';
import '../../pair-components/tooltip';
import './base_stage_editor';

import {MobxLitElement} from '@adobe/lit-mobx';
import {CSSResultGroup, html, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';

import {core} from '../../core/core';
import {AnalyticsService} from '../../services/analytics.service';
import {ExperimentEditor} from '../../services/experiment.editor';

import {
  FlipCardConfig,
  FlipCardStageConfig,
  createFlipCardConfig,
} from '@deliberation-lab/utils';

import {styles} from './flipcard_editor.scss';

/**
 * FlipCard stage editor
 */
@customElement('flipcard-editor')
export class FlipCardEditor extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];

  private readonly analyticsService = core.getService(AnalyticsService);
  private readonly experimentEditor = core.getService(ExperimentEditor);

  @property() stage!: FlipCardStageConfig;
  @state() selectedCardIndex = -1;
  @state() editingCardTitle = '';
  @state() editingCardFrontContent = '';
  @state() editingCardBackContent = '';
  @state() editingCardImageUrl = '';
  @state() editingCardBackImageUrl = '';
  @state() isAddingCard = false;

  override render() {
    return html`
      <div class="editor-container">
        <div class="editor-section">
          <div class="header-with-button">
            <h3>FlipCard Configuration</h3>
            <pr-button
              @click=${() => this.startAddCard()}
              variant="tonal"
              color="primary"
              >Add Card</pr-button
            >
          </div>
          ${this.renderCardList()}
        </div>
        
        ${this.renderCardEditor()}
      </div>
    `;
  }

  private renderCardList() {
    if (this.stage.cards.length === 0) {
      return html`<div class="empty-list">No cards added yet. Click "Add Card" to create your first card.</div>`;
    }

    return html`
      <div class="card-list">
        ${this.stage.cards.map((card, index) => this.renderCardItem(card, index))}
      </div>
    `;
  }

  private renderCardItem(card: FlipCardConfig, index: number) {
    const isSelected = index === this.selectedCardIndex;
    
    return html`
      <div
        class=${classMap({
          'card-item': true,
          'selected': isSelected,
          'expanded': isSelected
        })}
      >
        <div class="card-item-header">
          <div class="card-item-content">
            <div class="card-item-title">${card.title}</div>
            <div class="card-item-preview">
              <div>Front: ${card.frontContent.substring(0, 30)}${card.frontContent.length > 30 ? '...' : ''}</div>
              <div>Back: ${card.backContent.substring(0, 30)}${card.backContent.length > 30 ? '...' : ''}</div>
            </div>
          </div>
          <div class="card-item-actions">
            <pr-tooltip text=${isSelected ? "Collapse" : "Edit Card"} position="TOP">
              <pr-icon-button
                icon=${isSelected ? "expand_less" : "edit"}
                variant="tonal"
                color="tertiary"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  if (isSelected) {
                    this.cancelEdit();
                  } else {
                    this.selectCard(index);
                  }
                }}
              ></pr-icon-button>
            </pr-tooltip>
            <pr-tooltip text="Delete Card" position="TOP">
              <pr-icon-button
                icon="delete"
                variant="tonal"
                color="error"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this.deleteCard(index);
                }}
              ></pr-icon-button>
            </pr-tooltip>
          </div>
        </div>
        
        ${isSelected ? this.renderInlineEditor() : nothing}
      </div>
    `;
  }

  private renderCardEditor() {
    if (!this.isAddingCard) {
      return nothing;
    }

    return html`
      <div class="card-item expanded">
        <div class="card-item-header">
          <div class="card-item-title">Add New Card</div>
          <div class="card-item-actions">
            <pr-tooltip text="Cancel" position="TOP">
              <pr-icon-button
                icon="close"
                variant="tonal"
                color="tertiary"
                @click=${() => this.cancelEdit()}
              ></pr-icon-button>
            </pr-tooltip>
          </div>
        </div>
        
        ${this.renderInlineEditor(true)}
      </div>
    `;
  }
  
  private renderInlineEditor(isAdding = false) {
    const saveButtonText = isAdding ? 'Add Card' : 'Save Changes';
    
    return html`
      <div class="inline-editor">
        <div class="inline-editor-row">
          <div class="form-field" style="flex: 1;">
            <label for="card-title">Card Title:</label>
            <input
              id="card-title"
              type="text"
              .value=${this.editingCardTitle}
              @input=${(e: Event) => this.editingCardTitle = (e.target as HTMLInputElement).value}
              placeholder="Enter card title"
            />
          </div>
        </div>
        
        <div class="inline-editor-row">
          <div class="form-field" style="flex: 1;">
            <label for="card-image">Front Image URL (optional):</label>
            <input
              id="card-image"
              type="text"
              .value=${this.editingCardImageUrl}
              @input=${(e: Event) => this.editingCardImageUrl = (e.target as HTMLInputElement).value}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div class="form-field" style="flex: 1;">
            <label for="card-back-image">Back Image URL (optional):</label>
            <input
              id="card-back-image"
              type="text"
              .value=${this.editingCardBackImageUrl}
              @input=${(e: Event) => this.editingCardBackImageUrl = (e.target as HTMLInputElement).value}
              placeholder="https://example.com/backimage.jpg"
            />
          </div>
        </div>
        
        <div class="inline-editor-row">
          <div class="form-field" style="flex: 1;">
            <label for="card-front-content">Front Content:</label>
            <textarea
              id="card-front-content"
              .value=${this.editingCardFrontContent}
              @input=${(e: Event) => this.editingCardFrontContent = (e.target as HTMLTextAreaElement).value}
              placeholder="Enter front side content"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-field" style="flex: 1;">
            <label for="card-back-content">Back Content:</label>
            <textarea
              id="card-back-content"
              .value=${this.editingCardBackContent}
              @input=${(e: Event) => this.editingCardBackContent = (e.target as HTMLTextAreaElement).value}
              placeholder="Enter back side content"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="inline-editor-actions">
          <pr-button
            variant="default"
            @click=${() => this.cancelEdit()}
          >
            Cancel
          </pr-button>
          <pr-button
            variant="tonal"
            color="primary"
            @click=${() => this.saveCard()}
          >
            ${saveButtonText}
          </pr-button>
        </div>
      </div>
    `;
  }


  private selectCard(index: number) {
    this.isAddingCard = false;
    this.selectedCardIndex = index;
    const card = this.stage.cards[index];
    
    this.editingCardTitle = card.title;
    this.editingCardFrontContent = card.frontContent;
    this.editingCardBackContent = card.backContent;
    this.editingCardImageUrl = card.imageUrl || '';
    this.editingCardBackImageUrl = card.backImageUrl || '';
  }

  private startAddCard() {
    this.isAddingCard = true;
    this.selectedCardIndex = -1;
    
    // Reset form fields
    this.editingCardTitle = '';
    this.editingCardFrontContent = '';
    this.editingCardBackContent = '';
    this.editingCardImageUrl = '';
    this.editingCardBackImageUrl = '';
  }

  private cancelEdit() {
    this.isAddingCard = false;
    this.selectedCardIndex = -1;
  }

  private saveCard() {
    if (!this.editingCardTitle || !this.editingCardFrontContent || !this.editingCardBackContent) {
      // Show error or validation message
      return;
    }

    const cardConfig: FlipCardConfig = createFlipCardConfig({
      title: this.editingCardTitle,
      frontContent: this.editingCardFrontContent,
      backContent: this.editingCardBackContent,
    });

    if (this.editingCardImageUrl) {
      cardConfig.imageUrl = this.editingCardImageUrl;
    }

    if (this.editingCardBackImageUrl) {
      cardConfig.backImageUrl = this.editingCardBackImageUrl;
    }

    let updatedCards = [...this.stage.cards];

    if (this.isAddingCard) {
      // Add new card
      updatedCards.push(cardConfig);
    } else {
      // Update existing card
      updatedCards[this.selectedCardIndex] = cardConfig;
    }

    // Clone the stage and update it
    const updatedStage = {...this.stage, cards: updatedCards};
    this.experimentEditor.updateStage(updatedStage);

    // Reset the form
    this.cancelEdit();
  }

  private deleteCard(index: number) {
    if (index < 0 || index >= this.stage.cards.length) {
      return;
    }

    const updatedCards = [...this.stage.cards];
    updatedCards.splice(index, 1);

    // Clone the stage and update it
    const updatedStage = {...this.stage, cards: updatedCards};
    this.experimentEditor.updateStage(updatedStage);

    // If the deleted card was being edited, close the editor
    if (this.selectedCardIndex === index) {
      this.cancelEdit();
    } else if (this.selectedCardIndex > index) {
      // Adjust selected index if needed
      this.selectedCardIndex--;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flipcard-editor': FlipCardEditor;
  }
}