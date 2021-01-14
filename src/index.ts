import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ApiStack } from './api';
import { transformPascalCase } from './utils/transformPascalCase';

const environment = process.env.ENVIRONMENT;

if (!environment) {
  throw new Error('Environment is missing!');
}

const app = new cdk.App();

new ApiStack(app, `SrvyCoolApi${transformPascalCase(environment)}`, {
  environment,
});
