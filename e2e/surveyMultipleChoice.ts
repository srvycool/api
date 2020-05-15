import { GraphQLClient } from "graphql-request";
import { deepEqual } from "assert";

interface SurveyMultipleChoiceCreate {
  surveyMultipleChoiceCreate: { id: string };
}

interface SurveyMultipleChoice {
  __typename: "SurveyMultipleChoice";
  id: string;
  label: string;
  answers: {
    id: string;
    label: string;
    votes: number;
  }[];
}

const question = "Coffee?";

async function create(client: GraphQLClient) {
  return client.request<SurveyMultipleChoiceCreate>(
    `
    mutation SurveyMultipleChoiceCreate($question: String!) {
      surveyMultipleChoiceCreate(question: $question, answers: ["yes", "no"]) {
        id
      }
    }
  `,
    { question }
  );
}

async function submit(
  client: GraphQLClient,
  surveyID: string,
  answerID: string
) {
  return client.request<{ surveyMultipleChoiceSubmit: SurveyMultipleChoice }>(
    `
    mutation SurveyMultipleChoiceSubmit($surveyID: ID!, $answerID: ID!) {
      surveyMultipleChoiceSubmit(surveyID: $surveyID, answerID: $answerID) {
        id
        label
        answers {
          id
          label
          votes
        }
      }
    }
  `,
    { surveyID, answerID }
  );
}

async function query(client: GraphQLClient, surveyID: string) {
  return client.request<{ survey: SurveyMultipleChoice }>(
    `
    query Survey($surveyID: ID!) {
      survey(id: $surveyID) {
        __typename
        id
        label
        
        ... on SurveyMultipleChoice {
          answers {
            id
            label
            votes
          }
        }
      }
    }
  `,
    { surveyID }
  );
}

export async function surveyMultipleChoiceTest(client: GraphQLClient) {
  const { surveyMultipleChoiceCreate } = await create(client);
  const { survey } = await query(client, surveyMultipleChoiceCreate.id);

  deepEqual(survey.__typename, "SurveyMultipleChoice");
  deepEqual(survey.label, question);

  const { surveyMultipleChoiceSubmit } = await submit(
    client,
    survey.id,
    survey.answers[0].id
  );

  deepEqual(surveyMultipleChoiceSubmit.answers[0].votes, 1);
}
