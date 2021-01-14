import AWS from 'aws-sdk';
import { surveyMultipleChoiceTest } from './surveyMultipleChoice';
import { surveyTextareaTest } from './surveyTextarea';
import { AppSyncClient } from './utils/AppSyncClient';
import { transformPascalCase } from './utils/transformPascalCase';

async function main() {
  const environment = process.env.ENVIRONMENT;

  if (!environment) {
    throw new Error('process.env.ENVIRONMENT missing!');
  }

  let endpoint;
  try {
    const cloudformation = new AWS.CloudFormation();
    const stackName = `SrvyCoolApi${transformPascalCase(environment)}`;
    const stacks = await cloudformation
      .describeStacks({
        StackName: stackName,
      })
      .promise();

    endpoint = stacks.Stacks![0].Outputs?.find(
      (o) => o.OutputKey === 'GraphQLEndpoint'
    )?.OutputValue;
  } catch (e) {
    throw new Error(`Couldn't fetch stack, Error : ${e}`);
  }

  const client = new AppSyncClient({
    endpoint,
  });

  await Promise.all([
    surveyMultipleChoiceTest(client),
    surveyTextareaTest(client),
  ]);
}

main().catch(console.error);
