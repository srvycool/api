import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GraphQLApiStack } from './stacks/graphql-api-stack';
import { ProxyStack } from './stacks/proxy-stack';

const environment = process.env.ENVIRONMENT;

if (!environment) {
  throw new Error('Environment is missing!');
}

const app = new cdk.App();

const api = new GraphQLApiStack(app, `GraphQLApiStack${environment}`, {
  environment,
});

new ProxyStack(app, `ProxyStack${environment}`, {
  environment,
  graphqlApi: {
    url: api.url,
    arn: api.arn,
  },
});
