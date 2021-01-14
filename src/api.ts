import * as cdk from '@aws-cdk/core';
import { GraphQL } from './graphql/graphql';
import { Proxy } from './proxy/proxy';

export interface ApiStackProps extends cdk.StackProps {
  environment: string;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    const graphql = new GraphQL(this, `GraphQL`, {
      environment: props.environment,
    });

    const proxy = new Proxy(this, `Proxy`, {
      environment: props.environment,
      graphqlApi: {
        url: graphql.url,
        arn: graphql.arn,
      },
    });

    new cdk.CfnOutput(this, 'GraphQLEndpoint', {
      value: proxy.url,
    });
  }
}
