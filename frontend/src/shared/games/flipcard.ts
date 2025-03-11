import {
  StageConfig,
  StageGame,
  createInfoStage,
  createMetadataConfig,
  createProfileStage,
  createStageTextConfig,
  ProfileType,
  createFlipCardStage,
  createFlipCardConfig,
} from '@deliberation-lab/utils';

// ****************************************************************************
// Experiment config
// ****************************************************************************
export const FLIPCARD_GAME_METADATA = createMetadataConfig({
  name: 'FlipCard Selection',
  publicName: 'FlipCard Selection',
  description:
    'A stage where participants can flip cards to learn more about options before making a selection.',
});

export function getFlipCardStageConfigs(): StageConfig[] {
  const stages: StageConfig[] = [];

  stages.push(PROFILE_STAGE);
  stages.push(INFO_STAGE);
  stages.push(FLIPCARD_STAGE);

  return stages;
}

const PROFILE_STAGE = createProfileStage({
  id: 'profile',
  name: 'View randomly generated profile',
  descriptions: createStageTextConfig({
    primaryText:
      "This identity is how other players will see you during today's experiment.",
  }),
  game: StageGame.NONE,
  profileType: ProfileType.ANONYMOUS_ANIMAL,
});

const GAME_RULES = `
  In this stage, you will be presented with several cards, each representing a different option.
  
  You can flip cards to reveal more information about each option by clicking the "Learn More" button.
  
  Once you've explored the options, select the card that best matches your preference by clicking "Select"
  and then confirming your choice.
  
  Your selection and card interaction data will be recorded.
`;

const INFO_STAGE = createInfoStage({
  id: 'info',
  name: 'Game rules',
  infoLines: [GAME_RULES],
  game: StageGame.NONE,
});

// Example card data
const EXAMPLE_CARDS = [
  createFlipCardConfig({
    title: 'Mountain Retreat',
    frontContent: 'A peaceful cabin in the mountains with scenic views.',
    backContent: 'This location offers hiking trails, wildlife viewing, and stargazing opportunities. Perfect for those seeking solitude and connection with nature.',
    imageUrl: 'https://source.unsplash.com/random?mountains',
    backImageUrl: 'https://source.unsplash.com/random?cabin',
  }),
  createFlipCardConfig({
    title: 'Beach Resort',
    frontContent: 'A luxurious beachfront resort with white sand beaches.',
    backContent: 'Enjoy swimming, snorkeling, and sunset walks along the shore. All-inclusive packages available with gourmet dining options.',
    imageUrl: 'https://source.unsplash.com/random?beach',
    backImageUrl: 'https://source.unsplash.com/random?resort',
  }),
  createFlipCardConfig({
    title: 'City Adventure',
    frontContent: 'An exciting urban experience in a vibrant metropolitan area.',
    backContent: 'Explore museums, theaters, restaurants, and nightlife. Guided tours available to help you discover hidden gems and local favorites.',
    imageUrl: 'https://source.unsplash.com/random?city',
    backImageUrl: 'https://source.unsplash.com/random?cityscape',
  }),
  createFlipCardConfig({
    title: 'Countryside Escape',
    frontContent: 'A charming farmhouse surrounded by rolling hills and meadows.',
    backContent: 'Experience farm-to-table dining, horseback riding, and countryside walks. Perfect for families looking for a peaceful retreat.',
    imageUrl: 'https://source.unsplash.com/random?countryside',
    backImageUrl: 'https://source.unsplash.com/random?farm',
  }),
];

const FLIPCARD_STAGE = createFlipCardStage(EXAMPLE_CARDS, {
  id: 'flipcard',
  name: 'Choose Your Ideal Vacation',
  game: StageGame.NONE,
  descriptions: createStageTextConfig({
    primaryText: 'Explore the options and select your ideal vacation destination.',
    infoText: 'Click "Learn More" to see additional details about each option.',
    helpText: 'After reviewing the options, select one and confirm your choice.',
  }),
  progress: {
    minParticipants: 1,
    waitForAllParticipants: false,
    showParticipantProgress: true,
  },
  minCards: 2,
  maxCards: 4,
});