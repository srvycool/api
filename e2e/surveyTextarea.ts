import { AppSyncSign4Client } from "./utils/AppSyncSign4Client";
import { deepEqual } from "assert";

interface SurveyTextareaCreate {
  surveyTextareaCreate: { id: string };
}

interface SurveyTextarea {
  __typename: "SurveyTextarea";
  id: string;
  label: string;
  submissions: {
    id: string;
    text: string;
  }[];
}

const question = "How are you?";
const submission = "Awesome!";

async function create(client: AppSyncSign4Client) {
  return client.request<SurveyTextareaCreate>(
    `
    mutation SurveyTextareaCreate($question: String!) {
      surveyTextareaCreate(question: $question) {
        id
      }
    }
  `,
    { question }
  );
}

async function submit(
  client: AppSyncSign4Client,
  surveyID: string,
  text: string
) {
  return client.request<{ surveyTextareaSubmit: SurveyTextarea }>(
    `
    mutation SurveyTextareaSubmit($surveyID: ID!, $text: String!) {
      surveyTextareaSubmit(surveyID: $surveyID, text: $text) {
        id
        label
        submissions {
          id
          text
        }
      }
    }
  `,
    { surveyID, text }
  );
}

async function query(client: AppSyncSign4Client, surveyID: string) {
  return client.request<{ survey: SurveyTextarea }>(
    `
    query Survey($surveyID: ID!) {
      survey(id: $surveyID) {
        __typename
        id
        label
        
        ... on SurveyTextarea {
          submissions {
            id
            text
          }
        }
      }
    }
  `,
    { surveyID }
  );
}

export async function surveyTextareaTest(client: AppSyncSign4Client) {
  const { surveyTextareaCreate } = await create(client);
  const { survey } = await query(client, surveyTextareaCreate.id);

  deepEqual(survey.__typename, "SurveyTextarea");
  deepEqual(survey.label, question);

  const { surveyTextareaSubmit } = await submit(client, survey.id, submission);

  deepEqual(surveyTextareaSubmit.submissions[0].text, submission);
}
