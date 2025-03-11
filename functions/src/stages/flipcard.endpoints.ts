import {
  FlipCardEvent,
  FlipCardStageParticipantAnswer,
  FlipCardStagePublicData,
  createFlipCardStageParticipantAnswer,
  createFlipCardStagePublicData,
} from '@deliberation-lab/utils';

import * as admin from 'firebase-admin';
import {Timestamp} from 'firebase-admin/firestore';
import {onCall} from 'firebase-functions/v2/https';

import {app} from '../app';

/**
 * Record a participant's interaction with a card (flip, select, confirm)
 * { experimentId, cohortId, stageId, participantId, eventType, cardId }
 */
export const setFlipCardInteraction = onCall(async (request) => {
  const {data} = request;

  try {
    // Define participant stage data document reference
    const participantStageDoc = app
      .firestore()
      .collection('experiments')
      .doc(data.experimentId)
      .collection('participants')
      .doc(data.participantId)
      .collection('stageData')
      .doc(data.stageId);

    const result = await app.firestore().runTransaction(async (transaction) => {
      const docSnapshot = await transaction.get(participantStageDoc);
      
      let participantData: FlipCardStageParticipantAnswer;
      
      if (!docSnapshot.exists) {
        // Initialize data if it doesn't exist
        participantData = createFlipCardStageParticipantAnswer(data.stageId);
      } else {
        participantData = docSnapshot.data() as FlipCardStageParticipantAnswer;
      }

      // Add the interaction to the history
      participantData.interactions.push({
        eventType: data.eventType as FlipCardEvent,
        cardId: data.cardId,
        timestamp: Timestamp.now(),
      });

      // Update selection if this is a selection event
      if (data.eventType === FlipCardEvent.SELECT) {
        participantData.selectedCardId = data.cardId;
      } else if (data.eventType === FlipCardEvent.CONFIRM && data.cardId === participantData.selectedCardId) {
        // If confirming the current selection, update the public data
        const publicDoc = app
          .firestore()
          .collection('experiments')
          .doc(data.experimentId)
          .collection('cohorts')
          .doc(data.cohortId)
          .collection('publicStageData')
          .doc(data.stageId);

        // Get the public stage data and update it
        const publicDataSnapshot = await transaction.get(publicDoc);
        if (publicDataSnapshot.exists) {
          const publicData = publicDataSnapshot.data() as FlipCardStagePublicData;
          publicData.participantSelections[data.participantId] = participantData.selectedCardId;
          transaction.set(publicDoc, publicData);
        } else {
          // Create public data if it doesn't exist
          const newPublicData = createFlipCardStagePublicData(data.stageId);
          newPublicData.participantSelections[data.participantId] = participantData.selectedCardId;
          transaction.set(publicDoc, newPublicData);
        }
      }

      // Update the participant's stage data
      transaction.set(participantStageDoc, participantData);
      
      return {success: true};
    });

    return result;
  } catch (error) {
    console.error('Error in setFlipCardInteraction:', error);
    return {success: false, error: error.message};
  }
});