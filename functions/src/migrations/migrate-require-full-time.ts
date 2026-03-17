/**
 * One-time migration script to convert requireFullTime to timeMinimumInMinutes.
 *
 * For any stage with requireFullTime: true, this sets
 * timeMinimumInMinutes = timeLimitInMinutes (making the minimum equal to the
 * maximum, which is the equivalent behavior).
 *
 * Usage:
 *   cd functions
 *   npm run migrate:require-full-time            # Preview changes (dry run)
 *   npm run migrate:require-full-time:apply      # Apply changes
 *
 * Options:
 *   --apply    Apply changes (default is dry run)
 */

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'deliberate-lab',
  });
}

const db = admin.firestore();

interface MigrationResult {
  experimentId: string;
  stageId: string;
  stageName: string;
  stageKind: string;
  timeLimitInMinutes: number | null;
  error?: string;
}

async function migrateStages(dryRun: boolean): Promise<MigrationResult[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`requireFullTime → timeMinimumInMinutes Migration`);
  console.log(
    `Mode: ${dryRun ? 'DRY RUN (no changes will be written)' : 'LIVE'}`,
  );
  console.log(`${'='.repeat(60)}\n`);

  const results: MigrationResult[] = [];

  const experimentsSnapshot = await db.collection('experiments').get();
  console.log(`Found ${experimentsSnapshot.size} experiments to check.\n`);

  for (const experimentDoc of experimentsSnapshot.docs) {
    const experimentId = experimentDoc.id;
    const stagesSnapshot = await db
      .collection('experiments')
      .doc(experimentId)
      .collection('stages')
      .get();

    for (const stageDoc of stagesSnapshot.docs) {
      const stage = stageDoc.data();

      if (!stage.requireFullTime) continue;

      const result: MigrationResult = {
        experimentId,
        stageId: stageDoc.id,
        stageName: stage.name || 'Unnamed',
        stageKind: stage.kind || 'unknown',
        timeLimitInMinutes: stage.timeLimitInMinutes ?? null,
      };

      try {
        const timeMinimumInMinutes = stage.timeLimitInMinutes ?? null;

        console.log(`[${experimentId}] Stage "${stage.name}" (${stage.kind}):`);
        console.log(
          `  requireFullTime: true → timeMinimumInMinutes: ${timeMinimumInMinutes}`,
        );

        if (!dryRun) {
          await stageDoc.ref.update({
            timeMinimumInMinutes,
            requireFullTime: admin.firestore.FieldValue.delete(),
          });
          console.log(`  Updated in Firestore.`);
        } else {
          console.log(`  [DRY RUN] Would update in Firestore.`);
        }
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        console.error(`  Error: ${result.error}`);
      }

      results.push(result);
    }
  }

  return results;
}

async function main() {
  const dryRun = !process.argv.includes('--apply');
  const results = await migrateStages(dryRun);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary`);
  console.log(`${'='.repeat(60)}`);

  const migrated = results.filter((r) => !r.error);
  const errors = results.filter((r) => r.error);

  console.log(`Stages migrated: ${migrated.length}`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`);
    for (const e of errors) {
      console.log(`  [${e.experimentId}] ${e.stageId}: ${e.error}`);
    }
  }

  if (dryRun && migrated.length > 0) {
    console.log(`\nRun without --dry-run to apply changes.`);
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
