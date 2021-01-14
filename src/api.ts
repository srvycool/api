import * as cdk from '@aws-cdk/core';
import { GraphQLStack } from './stacks/graphql-stack';
import { ProxyStack } from './stacks/proxy-stack';

interface ApiStackProps extends cdk.StackProps {
  environment: string;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    const environment = props.environment;

    const api = new GraphQLStack(this, `GraphQLStack`, { environment });

    const proxy = new ProxyStack(this, `ProxyStack`, {
      environment,
      graphqlApi: {
        url: api.url,
        arn: api.arn,
      },
    });

    new cdk.CfnOutput(this, 'GraphQLEndpoint', {
      value: proxy.url,
    });
  }
}
