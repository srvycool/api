import { GraphQLClient } from "graphql-request";
import { surveyMultipleChoiceTest } from "./surveyMultipleChoice";
import { surveyTextareaTest } from "./surveyTextarea";

async function main() {
  const endpoint = process.env.ENDPOINT;
  const apiKey = process.env.API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("Environment variable ENDPOINT or API_KEY missing!");
  }

  const client = new GraphQLClient(endpoint, {
    headers: { "x-api-key": apiKey },
  });

  await Promise.all([
    surveyMultipleChoiceTest(client),
    surveyTextareaTest(client),
  ]);
}

main().catch(console.error);
