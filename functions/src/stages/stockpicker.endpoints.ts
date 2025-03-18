import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {Value} from '@sinclair/typebox/value';
import {
  StageKind,
  SetStockAllocationData,
  ConfirmStockAllocationData,
} from '@deliberation-lab/utils';
import {AuthGuard} from '../utils/auth-guard';
import {onCall} from 'firebase-functions/v2/https';
import {app} from '../app';

const db = admin.firestore();

/**
 * Updates stock allocations for a participant.
 */
export const setStockAllocation = onCall(async (request) => {
  await AuthGuard.isExperimenter(request);
  const {data} = request;
  
  // Validate the request data
  if (!Value.Check(SetStockAllocationData, data)) {
    const errors = [...Value.Errors(SetStockAllocationData, data)];
    console.error('Validation errors:', errors);
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid request data'
    );
  }

  // Make sure allocations sum to 100%
  const allocations = data.allocations;
  const total = Object.values(allocations).reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Stock allocations must sum to 100%',
    );
  }

    const participantRef = app.firestore()
      .collection('experiments')
      .doc(data.experimentId)
      .collection('participants')
      .doc(data.participantId);

    const stageDataRef = participantRef
      .collection('stageData')
      .doc(data.stageId);

    // Check if participant has already submitted
    const stageData = await stageDataRef.get();
    if (stageData.exists && stageData.data()?.confirmed) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Allocation already confirmed',
      );
    }

    // Update participant's allocation
    await stageDataRef.set({
      id: data.stageId,
      kind: StageKind.STOCKPICKER,
      allocations: data.allocations,
      confirmed: false,
    }, { merge: true });

    return { success: true };
  }
);

/**
 * Confirms a participant's stock allocation.
 */
export const confirmStockAllocation = onCall(async (request) => {
  await AuthGuard.isExperimenter(request);
  const {data} = request;
  
  // Validate the request data
  if (!Value.Check(ConfirmStockAllocationData, data)) {
    const errors = [...Value.Errors(ConfirmStockAllocationData, data)];
    console.error('Validation errors:', errors);
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid request data'
    );
  }

  const participantRef = app.firestore()
    .collection('experiments')
    .doc(data.experimentId)
    .collection('participants')
    .doc(data.participantId);

  const stageDataRef = participantRef
    .collection('stageData')
    .doc(data.stageId);

  // Check if participant has already submitted
  const stageData = await stageDataRef.get();
  if (!stageData.exists || !stageData.data()?.allocations) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No allocations found to confirm',
    );
  }

  if (stageData.exists && stageData.data()?.confirmed) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Allocation already confirmed',
    );
  }

  // Confirm participant's allocation
  await stageDataRef.set({
    confirmed: true,
  }, { merge: true });

  return { success: true };
}
);