import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { backfillReviewQueue, ensureReviewIndexes } from '../src/modules/review/service.js';

try {
  await connectDatabase();
  await ensureReviewIndexes();
  const result = await backfillReviewQueue();
  console.log(`Review queue backfill complete: ${result.sourceDocuments} source documents, ${result.insertedReviewItems} new review items, ${result.totalReviewItems} total review items. Source pages were not modified.`);
} catch (error) {
  console.error(`Review queue backfill failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
