import {generateId, UnifiedTimestamp} from '../shared';
import {
  BaseStageConfig,
  BaseStageParticipantAnswer,
  BaseStagePublicData,
  StageGame,
  StageKind,
  createStageTextConfig,
  createStageProgressConfig,
} from './stage';

/** FlipCard stage data structures */

/**
 * FlipCard stage configuration.
 */
export interface FlipCardStageConfig extends BaseStageConfig {
  kind: StageKind.FLIPCARD;
  cards: FlipCardConfig[];
  minCards?: number;
  maxCards?: number;
}

/**
 * Configuration for an individual card.
 */
export interface FlipCardConfig {
  id: string;
  title: string;
  frontContent: string;
  backContent: string;
  imageUrl?: string;
  backImageUrl?: string;
}

/**
 * FlipCard participant event types
 */
export enum FlipCardEvent {
  FLIP = 'flip',
  SELECT = 'select',
  CONFIRM = 'confirm',
}

/**
 * Record of participant interactions with cards.
 */
export interface FlipCardInteraction {
  eventType: FlipCardEvent;
  cardId: string;
  timestamp: UnifiedTimestamp;
}

/**
 * FlipCardStageParticipantAnswer
 *
 * This is saved as a participant doc (with stage ID as doc ID) under
 * experiments/{experimentId}/participants/{participantId}/stageData
 */
export interface FlipCardStageParticipantAnswer extends BaseStageParticipantAnswer {
  kind: StageKind.FLIPCARD;
  selectedCardId: string | null;
  interactions: FlipCardInteraction[];
}

/**
 * FlipCardStagePublicData
 *
 * This is saved as a stage doc (with stage ID as doc ID) under
 * experiments/{experimentId}/cohorts/{cohortId}/publicStageData
 */
export interface FlipCardStagePublicData extends BaseStagePublicData {
  kind: StageKind.FLIPCARD;
  // Map of participant ID to their selection
  participantSelections: Record<string, string>;
}

// ************************************************************************* //
// FUNCTIONS                                                                 //
// ************************************************************************* //

/** Create a FlipCard stage. */
export function createFlipCardStage(
  cards: FlipCardConfig[],
  config: Partial<FlipCardStageConfig> = {}
): FlipCardStageConfig {
  return {
    id: config.id ?? generateId(),
    kind: StageKind.FLIPCARD,
    game: config.game ?? StageGame.NONE,
    name: config.name ?? 'FlipCard',
    descriptions: config.descriptions ?? createStageTextConfig(),
    progress:
      config.progress ??
      createStageProgressConfig({ waitForAllParticipants: true }),
    cards,
  };
}

/** Create a card configuration. */
export function createFlipCardConfig(
  config: Partial<FlipCardConfig> & { title: string; frontContent: string; backContent: string }
): FlipCardConfig {
  return {
    id: config.id ?? generateId(),
    title: config.title,
    frontContent: config.frontContent,
    backContent: config.backContent,
    imageUrl: config.imageUrl,
    backImageUrl: config.backImageUrl,
  };
}

/** Create FlipCard stage public data. */
export function createFlipCardStagePublicData(
  id: string
): FlipCardStagePublicData {
  return {
    id,
    kind: StageKind.FLIPCARD,
    participantSelections: {},
  };
}

/** Create FlipCard stage participant answer. */
export function createFlipCardStageParticipantAnswer(
  id: string
): FlipCardStageParticipantAnswer {
  return {
    id,
    kind: StageKind.FLIPCARD,
    selectedCardId: null,
    interactions: [],
  };
}