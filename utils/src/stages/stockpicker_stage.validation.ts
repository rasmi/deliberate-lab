import {Type, type Static} from '@sinclair/typebox';
import {UnifiedTimestampSchema} from '../shared.validation';
import {StageKind} from './stage';
import {
  StageGameSchema,
  StageTextConfigSchema,
  StageProgressConfigSchema,
} from './stage.validation';

// Import the types from stockpicker_stage
import {StockConfig, MonthlyPerformance, StockMetrics} from './stockpicker_stage';

/** Shorthand for strict TypeBox object validation */
const strict = {additionalProperties: false} as const;

export const StockMetricsSchema = Type.Object(
  {
    bestYearPerformance: Type.String(),
    worstYearPerformance: Type.String(),
    analystConsensus: Type.String(),
    socialMediaHype: Type.String(),
  },
  strict
);

export const MonthlyPerformanceSchema = Type.Object(
  {
    month: Type.String(),
    value: Type.Number(),
  },
  strict
);

export const StockConfigSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    ticker: Type.String(),
    metrics: StockMetricsSchema,
    historicalPerformance: Type.Array(MonthlyPerformanceSchema),
    riskAnalysis: Type.String(),
  },
  strict
);

export const StockpickerStageConfigSchema = Type.Object(
  {
    id: Type.String(),
    kind: Type.Literal(StageKind.STOCKPICKER),
    game: StageGameSchema,
    name: Type.String(),
    descriptions: StageTextConfigSchema,
    progress: StageProgressConfigSchema,
    stocks: Type.Array(StockConfigSchema),
    enableTimeout: Type.Boolean(),
    timeoutSeconds: Type.Number(),
  },
  strict
);

// We don't need to export this type since it's already exported from stockpicker_stage.ts
// This prevents duplicate export errors
type StockpickerStageConfigValidation = Static<typeof StockpickerStageConfigSchema>;

/** setStockAllocation endpoint data validation. */
export const SetStockAllocationData = Type.Object(
  {
    experimentId: Type.String({minLength: 1}),
    cohortId: Type.String({minLength: 1}),
    stageId: Type.String({minLength: 1}),
    participantId: Type.String({minLength: 1}),
    allocations: Type.Record(Type.String(), Type.Number()),
  },
  strict,
);

export type SetStockAllocationData = Static<typeof SetStockAllocationData>;

// Export the schemas
export * from './stockpicker_stage';

/** confirmStockAllocation endpoint data validation. */
export const ConfirmStockAllocationData = Type.Object(
  {
    experimentId: Type.String({minLength: 1}),
    cohortId: Type.String({minLength: 1}),
    stageId: Type.String({minLength: 1}),
    participantId: Type.String({minLength: 1}),
  },
  strict,
);

export type ConfirmStockAllocationData = Static<typeof ConfirmStockAllocationData>;