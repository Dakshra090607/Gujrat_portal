import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { RegulationSet, SourceDocument, SourcePage, State, models } from '../src/models/index.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '../..');
const manifestPath = path.join(rootDir, 'data/extracted/manifest.json');

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (manifest.documents.length !== 3 || manifest.totals.pdfPages !== 292) {
    throw new Error('Unexpected extraction manifest coverage; refusing to seed source metadata.');
  }

  await connectDatabase();
  await Promise.all(Object.values(models).map((model) => model.createIndexes()));
  const state = await State.findOneAndUpdate(
    { countryCode: 'IN', code: 'GJ' },
    { $set: { name: 'Gujarat', countryCode: 'IN', code: 'GJ', isActive: true } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );
  const set = await RegulationSet.findOneAndUpdate(
    { countryCode: 'IN', stateId: state._id, framework: 'CGDCR', version: '2017' },
    {
      $set: {
        countryCode: 'IN',
        stateId: state._id,
        framework: 'CGDCR',
        version: '2017',
        title: 'Comprehensive General Development Control Regulations 2017',
        isActive: true,
      },
    },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );

  let imported = 0;
  for (const document of manifest.documents) {
    const storagePath = path.resolve(rootDir, document.filename);
    const raw = await fs.readFile(storagePath);
    const actualHash = createHash('sha256').update(raw).digest('hex');
    if (actualHash !== document.sha256) throw new Error(`Source hash mismatch; refusing to seed ${document.filename}`);
    const partSlug = document.part.toLowerCase().replace(' ', '-');
    const extraction = JSON.parse(await fs.readFile(path.join(rootDir, 'data/extracted', `${partSlug}.json`), 'utf8'));
    const values = {
      regulationSetId: set._id,
      stateId: state._id,
      countryCode: 'IN',
      framework: 'CGDCR',
      version: '2017',
      part: document.part,
      partTitle: document.part === 'Part I' ? 'Procedure Regulations' : document.part === 'Part II' ? 'Planning Regulations' : 'Performance Regulation',
      filename: document.filename,
      storagePath,
      sha256: document.sha256,
      byteSize: (await fs.stat(storagePath)).size,
      pageCount: document.pdfPageCount,
      extractionTool: `${extraction.extraction.tool} + ${extraction.extraction.tableTool}`,
      extractionVersion: `${extraction.extraction.toolVersion} + ${extraction.extraction.tableToolVersion}`,
      extractionStatus: 'EXTRACTED',
      metadata: extraction.sourceDocument.metadata,
    };
    const sourceDocument = await SourceDocument.findOneAndUpdate(
      { sha256: values.sha256 },
      { $set: values },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
    );
    const pageOperations = extraction.pages.map((page) => ({
      updateOne: {
        filter: { sourceDocumentId: sourceDocument._id, pdfPageNumber: page.pdfPageNumber },
        update: {
          $set: {
            sourceDocumentId: sourceDocument._id,
            pdfPageNumber: page.pdfPageNumber,
            printedPageLabel: page.printedPageLabel,
            extractedText: page.text,
            textCharacterCount: page.textCharacterCount,
            textExtractionStatus: page.textExtractionStatus,
            ocrRequired: page.ocrRequired,
            candidateSnippets: page.candidates,
            tableCandidates: page.tableCandidates,
          },
        },
        upsert: true,
      },
    }));
    if (pageOperations.length) await SourcePage.bulkWrite(pageOperations, { ordered: true });
    imported += 1;
  }

  await RegulationSet.updateOne({ _id: set._id }, { $set: { sourceDocumentIds: await SourceDocument.find({ regulationSetId: set._id }).distinct('_id') } });
  const pageCount = await SourcePage.countDocuments();
  console.log(`Seeded Gujarat + CGDCR-2017 source data: ${imported} documents, ${pageCount} source pages. No regulation or parameter candidates were promoted.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
