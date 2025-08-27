import '../progress/progress_stage_completed';
import '../chat/chat_interface';
import '../chat/chat_message';

import {MobxLitElement} from '@adobe/lit-mobx';
import {CSSResultGroup, html, nothing} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import {core} from '../../core/core';
import {ParticipantService} from '../../services/participant.service';

import {ChatMessage, PrivateChatStageConfig} from '@deliberation-lab/utils';

import {styles} from './group_chat_participant_view.scss';

/** Private chat interface for participants */
@customElement('private-chat-participant-view')
export class PrivateChatView extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];

  private readonly participantService = core.getService(ParticipantService);
  private renderCount = 0;
  private lastRenderTime = 0;

  @property() stage: PrivateChatStageConfig | undefined = undefined;

  override render() {
    const renderStartTime = performance.now();
    this.renderCount++;

    if (!this.stage) {
      console.log(
        `[PERF-UI] PrivateChatView render #${this.renderCount} - No stage`,
      );
      return nothing;
    }

    const chatMessages =
      this.participantService.privateChatMap[this.stage.id] ?? [];

    console.log(
      `[PERF-UI] PrivateChatView render #${this.renderCount} - Stage: ${this.stage.id}, Messages: ${chatMessages.length}, Time since last: ${this.lastRenderTime ? (renderStartTime - this.lastRenderTime).toFixed(2) : 'first'}ms`,
    );

    // Count participant messages
    const publicId = this.participantService.profile?.publicId ?? '';
    const participantMessageCount = chatMessages.filter(
      (msg) => msg.senderId === publicId && !msg.isError,
    ).length;

    // Check if we're waiting for a response (last message is from participant)
    const isWaitingForResponse =
      chatMessages.length > 0 &&
      chatMessages[chatMessages.length - 1].senderId === publicId;

    // Check if max number of turns reached (but only after response received)
    const maxTurnsReached =
      this.stage.maxNumberOfTurns !== null &&
      participantMessageCount >= this.stage.maxNumberOfTurns &&
      !isWaitingForResponse;

    // Check if conversation has ended (max turns reached and not waiting for response)
    const isConversationOver = maxTurnsReached;

    // Disable input if turn-taking is set and latest message
    // is from participant OR if conversation is over
    const isDisabledInput = () => {
      if (isConversationOver) {
        return true;
      }
      if (!this.stage?.isTurnBasedChat) {
        return false;
      }
      if (chatMessages.length === 0) {
        return false;
      }
      return isWaitingForResponse;
    };

    // Check if minimum number of turns met for progression
    // For turn-based chats, only count completed turns (where agent has responded)
    const minTurnsMet = this.stage.isTurnBasedChat
      ? participantMessageCount >= this.stage.minNumberOfTurns &&
        !isWaitingForResponse
      : participantMessageCount >= this.stage.minNumberOfTurns;

    const result = html`
      <chat-interface .stage=${this.stage} .disableInput=${isDisabledInput()}>
        ${chatMessages.map((message, index) => {
          console.log(
            `[PERF-UI] Rendering message ${index + 1}/${chatMessages.length} - ID: ${message.id}`,
          );
          return this.renderChatMessage(message);
        })}
        ${isDisabledInput() && !isConversationOver
          ? this.renderWaitingMessage()
          : nothing}
        ${isConversationOver ? this.renderConversationEndedMessage() : nothing}
      </chat-interface>
      <stage-footer .disabled=${!minTurnsMet}>
        ${this.stage.progress.showParticipantProgress
          ? html`<progress-stage-completed></progress-stage-completed>`
          : nothing}
        ${!minTurnsMet && !isConversationOver
          ? this.renderMinTurnsMessage(participantMessageCount)
          : nothing}
      </stage-footer>
    `;

    const renderEndTime = performance.now();
    console.log(
      `[PERF-UI] PrivateChatView render #${this.renderCount} END - Elapsed: ${(renderEndTime - renderStartTime).toFixed(2)}ms`,
    );
    this.lastRenderTime = renderEndTime;

    return result;
  }

  private renderWaitingMessage() {
    const sendError = () => {
      this.participantService.sendErrorChatMessage({
        message: 'Request canceled',
      });
    };

    return html`
      <div class="description">
        <div>Waiting for a response...</div>
        <pr-tooltip text="Cancel">
          <pr-icon-button
            icon="stop_circle"
            color="neutral"
            variant="default"
            @click=${sendError}
          >
          </pr-icon-button>
        </pr-tooltip>
      </div>
    `;
  }

  private renderChatMessage(chatMessage: ChatMessage) {
    const renderMsgStart = performance.now();
    let result;
    if (chatMessage.isError) {
      result = html`<div class="description error">
        ${chatMessage.message}
      </div>`;
    } else {
      result = html`<chat-message .chat=${chatMessage}></chat-message>`;
    }
    console.log(
      `[PERF-UI] renderChatMessage - ID: ${chatMessage.id}, Error: ${chatMessage.isError}, Elapsed: ${(performance.now() - renderMsgStart).toFixed(2)}ms`,
    );
    return result;
  }

  private renderConversationEndedMessage() {
    return html`
      <div class="description">
        The conversation has ended. Please proceed to the next stage.
      </div>
    `;
  }

  private renderMinTurnsMessage(currentCount: number) {
    const remaining = this.stage!.minNumberOfTurns - currentCount;
    return html`
      <div class="description">
        Please send at least ${remaining} more
        message${remaining === 1 ? '' : 's'} before proceeding.
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'private-chat-participant-view': PrivateChatView;
  }
}
