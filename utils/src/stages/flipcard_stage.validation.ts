import {Type, type Static} from '@sinclair/typebox';
import {UnifiedTimestampSchema} from '../shared.validation';
import {StageKind} from './stage';
import {
  StageGameSchema,
  StageTextConfigSchema,
  StageProgressConfigSchema,
} from './stage.validation';
import {FlipCardEvent} from './flipcard_stage';

/** Shorthand for strict TypeBox object validation */
const strict = {additionalProperties: false} as const;

/** FlipCard Config validation schema */
export const FlipCardConfigSchema = Type.Object(
  {
    id: Type.String(),
    title: Type.String(),
    frontContent: Type.String(),
    backContent: Type.String(),
    imageUrl: Type.Optional(Type.String()),
    backImageUrl: Type.Optional(Type.String()),
  },
  strict
);

/** FlipCard stage config data validation */
export const FlipCardStageConfigSchema = Type.Object(
  {
    id: Type.String(),
    kind: Type.Literal(StageKind.FLIPCARD),
    game: StageGameSchema,
    name: Type.String(),
    descriptions: StageTextConfigSchema,
    progress: StageProgressConfigSchema,
    cards: Type.Array(FlipCardConfigSchema),
    minCards: Type.Optional(Type.Number()),
    maxCards: Type.Optional(Type.Number()),
  },
  strict
);

/** FlipCard event types validation */
export const FlipCardEventSchema = Type.Enum(FlipCardEvent);

/** FlipCard interaction validation */
export const FlipCardInteractionSchema = Type.Object(
  {
    eventType: FlipCardEventSchema,
    cardId: Type.String(),
    timestamp: UnifiedTimestampSchema,
  },
  strict
);

/** setFlipCardInteraction endpoint data validation */
export const SetFlipCardInteractionData = Type.Object(
  {
    experimentId: Type.String({minLength: 1}),
    cohortId: Type.String({minLength: 1}),
    stageId: Type.String({minLength: 1}),
    participantId: Type.String({minLength: 1}),
    eventType: FlipCardEventSchema,
    cardId: Type.String({minLength: 1}),
  },
  strict
);

export type SetFlipCardInteractionData = Static<typeof SetFlipCardInteractionData>;

/** setFlipCardSelection endpoint data validation */
export const SetFlipCardSelectionData = Type.Object(
  {
    experimentId: Type.String({minLength: 1}),
    cohortId: Type.String({minLength: 1}),
    stageId: Type.String({minLength: 1}),
    participantId: Type.String({minLength: 1}),
    cardId: Type.String({minLength: 1}),
  },
  strict
);

export type SetFlipCardSelectionData = Static<typeof SetFlipCardSelectionData>;