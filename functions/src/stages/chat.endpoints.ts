import {Value} from '@sinclair/typebox/value';
import {
  ChatStageConfig,
  ChatStageParticipantAnswer,
  CreateChatMessageData,
  StageConfig,
  StageKind,
  UpdateChatStageParticipantAnswerData,
} from '@deliberation-lab/utils';
import * as admin from 'firebase-admin';
import {Timestamp} from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import {onCall} from 'firebase-functions/v2/https';

import {app} from '../app';
import {getFirestoreStage} from '../utils/firestore';
import {
  checkConfigDataUnionOnPath,
  isUnionError,
  prettyPrintError,
  prettyPrintErrors,
} from '../utils/validation';

/** Create chat messages. */

// ************************************************************************* //
// createChatMessage endpoint                                                //
//                                                                           //
// Input structure: {                                                        //
//   experimentId, cohortId, stageId, participantId (private), chatMessage   //
// }                                                                         //
// Validation: utils/src/chat.validation.ts                                  //
// ************************************************************************* //

export const createChatMessage = onCall(async (request) => {
  const startTime = Date.now();
  const {data} = request;

  console.log(
    `[PERF-ENDPOINT] createChatMessage START - Experiment: ${data.experimentId}, Stage: ${data.stageId}, Participant: ${data.participantId}, ChatId: ${data.chatMessage.id}, Timestamp: ${startTime}`,
  );

  // Define document references
  const privateChatDocument = app
    .firestore()
    .collection('experiments')
    .doc(data.experimentId)
    .collection('participants')
    .doc(data.participantId)
    .collection('stageData')
    .doc(data.stageId)
    .collection('privateChats')
    .doc(data.chatMessage.id);

  const groupChatDocument = app
    .firestore()
    .collection('experiments')
    .doc(data.experimentId)
    .collection('cohorts')
    .doc(data.cohortId)
    .collection('publicStageData')
    .doc(data.stageId)
    .collection('chats')
    .doc(data.chatMessage.id);

  const chatMessage = {...data.chatMessage, timestamp: Timestamp.now()};

  const stageStart = Date.now();
  const stage = await getFirestoreStage(data.experimentId, data.stageId);
  console.log(
    `[PERF-ENDPOINT] Stage fetched - Kind: ${stage?.kind}, Elapsed: ${Date.now() - stageStart}ms`,
  );

  if (!stage) {
    throw new functions.https.HttpsError('not-found', 'Stage not found');
  }

  // Run document write as transaction to ensure consistency
  const transactionStart = Date.now();
  await app.firestore().runTransaction(async (transaction) => {
    // Add chat message
    // (see chat.triggers for auto-generated agent responses)
    switch (stage.kind) {
      case StageKind.PRIVATE_CHAT:
        console.log(
          `[PERF-ENDPOINT] Writing private chat message to Firestore`,
        );
        transaction.set(privateChatDocument, chatMessage);
        return {id: privateChatDocument.id};
      default:
        // Otherwise, write to public data
        console.log(`[PERF-ENDPOINT] Writing public chat message to Firestore`);
        transaction.set(groupChatDocument, chatMessage);
        return {id: groupChatDocument.id};
    }
  });
  console.log(
    `[PERF-ENDPOINT] Transaction completed - Elapsed: ${Date.now() - transactionStart}ms`,
  );
  console.log(
    `[PERF-ENDPOINT] createChatMessage END - Total elapsed: ${Date.now() - startTime}ms`,
  );

  return {id: ''};
});

// ************************************************************************* //
// updateChatStageParticipantAnswer endpoint                                 //
//                                                                           //
// Input structure: { experimentId, cohortId, participantPrivateId,          //
//                    participantPublicId, chatStageParticipantAnswer }      //
// Validation: utils/src/stages/chat_stage.validation.ts                     //
// ************************************************************************* //

export const updateChatStageParticipantAnswer = onCall(async (request) => {
  const {data} = request;

  // Validate input
  const validInput = Value.Check(UpdateChatStageParticipantAnswerData, data);
  if (!validInput) {
    handleUpdateChatStageParticipantAnswerValidationErrors(data);
  }

  // Define document reference
  const document = app
    .firestore()
    .collection('experiments')
    .doc(data.experimentId)
    .collection('participants')
    .doc(data.participantPrivateId)
    .collection('stageData')
    .doc(data.chatStageParticipantAnswer.id);

  // Set random timeout to avoid data contention with transaction
  await new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 2000);
  });

  // Run document write as transaction to ensure consistency
  await app.firestore().runTransaction(async (transaction) => {
    transaction.set(document, data.chatStageParticipantAnswer);
  });

  return {id: document.id};
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleUpdateChatStageParticipantAnswerValidationErrors(data: any) {
  for (const error of Value.Errors(
    UpdateChatStageParticipantAnswerData,
    data,
  )) {
    if (isUnionError(error)) {
      const nested = checkConfigDataUnionOnPath(data, error.path);
      prettyPrintErrors(nested);
    } else {
      prettyPrintError(error);
    }
  }

  throw new functions.https.HttpsError('invalid-argument', 'Invalid data');
}
