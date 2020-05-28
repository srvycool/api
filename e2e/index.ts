import { surveyMultipleChoiceTest } from "./surveyMultipleChoice";
import { surveyTextareaTest } from "./surveyTextarea";
import { AppSyncSign4Client } from "./utils/AppSyncSign4Client";

async function main() {
  const endpoint = process.env.ENDPOINT;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  if (
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey ||
    !region ||
    !sessionToken
  ) {
    throw new Error("Environment variables missing!");
  }

  const client = new AppSyncSign4Client({
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    sessionToken,
  });

  await Promise.all([
    surveyMultipleChoiceTest(client),
    surveyTextareaTest(client),
  ]);
}

main().catch(console.error);
