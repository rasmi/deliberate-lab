import {generateId, UnifiedTimestamp} from '../shared';
import {
  BaseStageConfig,
  BaseStagePublicData,
  StageGame,
  StageKind,
  createStageTextConfig,
  createStageProgressConfig,
} from './stage';

/** Stock Picker game stage. */
export interface StockpickerStageConfig extends BaseStageConfig {
  kind: StageKind.STOCKPICKER;
  stocks: StockConfig[];
  // Add these properties to match the expected shape for StageConfig union
  enableTimeout: boolean;
  timeoutSeconds: number;
}

/** Configuration for a stock */
export interface StockConfig {
  id: string;
  name: string;
  ticker: string;
  metrics: StockMetrics;
  historicalPerformance: MonthlyPerformance[];
  riskAnalysis: string;
}

export interface StockMetrics {
  bestYearPerformance: string;
  worstYearPerformance: string;
  analystConsensus: string;
  socialMediaHype: string;
}

export interface MonthlyPerformance {
  month: string;
  value: number;
}

/**
 * StockpickerStagePublicData
 *
 * This is saved as a stage doc (with stage ID as doc ID) under
 * experiments/{experimentId}/cohorts/{cohortId}/publicStageData
 */
export interface StockpickerStagePublicData extends BaseStagePublicData {
  kind: StageKind.STOCKPICKER;
  // Track current allocation percentages
  allocations: Record<string, number>; // Maps stock id to allocation percentage
}

export interface StockpickerAllocation {
  stockId: string;
  percentage: number;
  timestamp: UnifiedTimestamp;
}

export interface StockpickerParticipantAnswer {
  id: string; // should match stage ID
  kind: StageKind.STOCKPICKER;
  allocations: Record<string, number>; // Maps stock id to allocation percentage
  confirmed: boolean;
}

// Constants
export const DEFAULT_ALLOCATION = 50; // Default even split between two stocks

// ************************************************************************* //
// FUNCTIONS                                                                 //
// ************************************************************************* //

/** Create stockpicker stage. */
export function createStockpickerStage(
  stocks: StockConfig[],
  config: Partial<StockpickerStageConfig> = {},
): StockpickerStageConfig {
  return {
    id: config.id ?? generateId(),
    kind: StageKind.STOCKPICKER,
    game: config.game ?? StageGame.NONE,
    name: config.name ?? 'Stock Picker',
    descriptions: config.descriptions ?? createStageTextConfig(),
    progress:
      config.progress ??
      createStageProgressConfig({waitForAllParticipants: true}),
    stocks,
    // Add timeout properties with defaults
    enableTimeout: config.enableTimeout ?? false,
    timeoutSeconds: config.timeoutSeconds ?? 0,
  };
}

/** Create stockpicker stage public data. */
export function createStockpickerStagePublicData(
  id: string, // stage ID
  stocks: StockConfig[],
): StockpickerStagePublicData {
  // Initialize with default allocation (evenly split)
  const allocations: Record<string, number> = {};
  stocks.forEach(stock => {
    allocations[stock.id] = DEFAULT_ALLOCATION;
  });
  
  return {
    id,
    kind: StageKind.STOCKPICKER,
    allocations,
  };
}