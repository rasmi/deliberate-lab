/**
 * Default config for the stockpicker game.
 */

import {
  StageKind, 
  StageGame, 
  StageConfig,
  StockConfig,
  createStageTextConfig, 
  createStageProgressConfig,
  createStockpickerStage,
  createMetadataConfig,
  createInfoStage,
  createProfileStage,
  ProfileType
} from '@deliberation-lab/utils';

/**
 * Default sample stocks for the Stock Picker game
 */
export const DEFAULT_STOCKS = [
  {
    id: 'stockA',
    name: 'TechFuture Inc.',
    ticker: 'TFIN',
    metrics: {
      bestYearPerformance: '+42%',
      worstYearPerformance: '-15%',
      analystConsensus: 'Strong Buy',
      socialMediaHype: 'Very High',
    },
    historicalPerformance: [
      {month: 'Jan', value: 1000},
      {month: 'Feb', value: 1050},
      {month: 'Mar', value: 1120},
      {month: 'Apr', value: 1180},
      {month: 'May', value: 1250},
      {month: 'Jun', value: 1200},
      {month: 'Jul', value: 1300},
      {month: 'Aug', value: 1350},
      {month: 'Sep', value: 1400},
      {month: 'Oct', value: 1420},
      {month: 'Nov', value: 1380},
      {month: 'Dec', value: 1450},
    ],
    riskAnalysis:
      'TechFuture Inc. is a high-growth technology company focused on artificial intelligence and cloud computing. While the company has shown strong revenue growth and market expansion, it faces significant competition from established tech giants. The stock has demonstrated high volatility but has generally trended upward over the past year. Analysts cite strong product pipeline and innovative research as key strengths, though regulatory concerns around AI ethics could pose future challenges.',
  },
  {
    id: 'stockB',
    name: 'StableGrowth Corp.',
    ticker: 'SGRO',
    metrics: {
      bestYearPerformance: '+18%',
      worstYearPerformance: '-8%',
      analystConsensus: 'Buy',
      socialMediaHype: 'Moderate',
    },
    historicalPerformance: [
      {month: 'Jan', value: 1000},
      {month: 'Feb', value: 1020},
      {month: 'Mar', value: 1040},
      {month: 'Apr', value: 1035},
      {month: 'May', value: 1050},
      {month: 'Jun', value: 1070},
      {month: 'Jul', value: 1090},
      {month: 'Aug', value: 1100},
      {month: 'Sep', value: 1120},
      {month: 'Oct', value: 1140},
      {month: 'Nov', value: 1150},
      {month: 'Dec', value: 1170},
    ],
    riskAnalysis:
      'StableGrowth Corp. is a well-established consumer goods company with a diverse product portfolio and global reach. The company has maintained consistent revenue growth and dividend payments for over a decade. Its conservative management approach and strong balance sheet provide resilience during economic downturns. While not capturing the explosive growth of tech stocks, SGRO offers lower volatility and more predictable returns. Market analysts consider it a cornerstone investment for balanced portfolios seeking moderate growth with reduced risk.',
  },
];

// ****************************************************************************
// Experiment config
// ****************************************************************************
export const STOCKPICKER_GAME_METADATA = createMetadataConfig({
  name: 'Stock Portfolio Allocation Game',
  publicName: 'Stock Portfolio Allocation Game',
  description: 'Analyze stock information and make investment decisions.',
});

export function getStockpickerStageConfigs(): StageConfig[] {
  const stages: StageConfig[] = [];

  stages.push(PROFILE_STAGE);
  stages.push(INFO_STAGE);
  stages.push(STOCKPICKER_STAGE);

  return stages;
}

const PROFILE_STAGE = createProfileStage({
  id: 'profile',
  name: 'View randomly generated profile',
  descriptions: createStageTextConfig({
    primaryText:
      "This identity is how you'll be seen during the stock allocation game.",
  }),
  game: StageGame.NONE,
  profileType: ProfileType.ANONYMOUS_ANIMAL,
});

const GAME_RULES = `
# Stock Portfolio Allocation Game

In this game, you'll take on the role of an investment advisor making portfolio allocation decisions.

## Your Task:
1. Review detailed information about two different stocks
2. Analyze their performance metrics, historical data, and risk factors
3. Decide how to allocate your investment portfolio between these stocks
4. Submit your final allocation when you're confident in your decision

## Key Points:
- You can adjust the allocation using sliders
- Your allocation percentages must add up to 100%
- Once confirmed, your allocation cannot be changed
- The game tests your ability to assess risk and potential return

Good luck with your investment decisions!
`;

const INFO_STAGE = createInfoStage({
  id: 'info',
  name: 'Game Rules',
  infoLines: [GAME_RULES],
  game: StageGame.NONE,
});

const STOCKPICKER_STAGE = createStockpickerStage(DEFAULT_STOCKS, {
  id: 'stockpicker',
  name: 'Stock Portfolio Allocation',
  descriptions: {
    primaryText: 'Explore stock information and make investment decisions.',
    infoText: 'Review the performance metrics and analysis for each stock, then decide how to allocate your portfolio between them.',
    helpText: 'Use the sliders to adjust your allocation percentages. The total must add up to 100%.',
  },
  game: StageGame.NONE,
  progress: {
    minParticipants: 1,
    waitForAllParticipants: true,
    showParticipantProgress: true,
  },
  enableTimeout: false,
  timeoutSeconds: 0,
});

/**
 * Create default stockpicker stage - for individual use
 */
export function createDefaultStockpickerStage(): StageConfig {
  return createStockpickerStage(DEFAULT_STOCKS, {
    name: 'Stock Picker',
    descriptions: {
      primaryText: 'Explore stock information and make investment decisions.',
      infoText: 'Review the performance metrics and analysis for each stock, then decide how to allocate your portfolio between them.',
      helpText: 'Use the sliders to adjust your allocation percentages. The total must add up to 100%.',
    },
    progress: {
      minParticipants: 1,
      waitForAllParticipants: true,
      showParticipantProgress: true,
    },
    enableTimeout: false,
    timeoutSeconds: 0,
  });
}