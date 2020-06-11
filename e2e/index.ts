import { notDeepStrictEqual } from "assert";
import { surveyMultipleChoiceTest } from "./surveyMultipleChoice";
import { surveyTextareaTest } from "./surveyTextarea";
import { AppSyncSign4Client } from "./utils/AppSyncSign4Client";
import { Credentials } from "../token.json";

async function main() {
  const endpoint = process.env.ENDPOINT;
  const region = process.env.AWS_REGION;
  const accessKeyId = Credentials.AccessKeyId;
  const secretAccessKey = Credentials.SecretAccessKey;
  const sessionToken = Credentials.SessionToken;

  notDeepStrictEqual(endpoint, undefined, "process.env.ENDPOINT missing!");
  notDeepStrictEqual(region, undefined, "process.env.AWS_REGION missing!");
  notDeepStrictEqual(accessKeyId, undefined, "accessKeyId missing!");
  notDeepStrictEqual(secretAccessKey, undefined, "secretAccessKey missing!");
  notDeepStrictEqual(sessionToken, undefined, "sessionToken missing!");

  const client = new AppSyncSign4Client({
    endpoint: endpoint!,
    region: region!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    sessionToken: sessionToken!,
  });

  await Promise.all([
    surveyMultipleChoiceTest(client),
    surveyTextareaTest(client),
  ]);
}

main().catch(console.error);
