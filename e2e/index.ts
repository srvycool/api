import { surveyMultipleChoiceTest } from './surveyMultipleChoice';
import { surveyTextareaTest } from './surveyTextarea';
import { AppSyncClient } from './utils/AppSyncClient';

async function main() {
  const endpoint = process.env.ENDPOINT;

  if (!endpoint) {
    throw new Error('process.env.ENDPOINT missing!');
  }

  const client = new AppSyncClient({
    endpoint: endpoint,
  });

  await Promise.all([
    surveyMultipleChoiceTest(client),
    surveyTextareaTest(client),
  ]);
}

main().catch(console.error);
