import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';

interface ProxyStackProps extends cdk.StackProps {
  environment: string;
  graphqlApi: {
    url: string;
    arn: string;
  };
}

export class ProxyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ProxyStackProps) {
    super(scope, id, props);

    const proxyServiceIntegrationPolicy = new iam.Policy(
      this,
      `ServerlessSurvey Proxy Policy ${props.environment}`,
      {
        statements: [
          new iam.PolicyStatement({
            actions: ['appsync:GraphQL'],
            resources: [`${props.graphqlApi.arn}/*`],
          }),
        ],
      }
    );

    const proxyServiceIntegrationRole = new iam.Role(
      this,
      `ServerlessSurvey Proxy Role ${props.environment}`,
      {
        assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      }
    );
    proxyServiceIntegrationRole.attachInlinePolicy(
      proxyServiceIntegrationPolicy
    );

    const proxy = new apigateway.RestApi(
      this,
      `ServerlessSurvey ${props.environment}`
    );
    const proxyGraphqlEndpoint = proxy.root.addResource('graphql');

    proxyGraphqlEndpoint.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
    });

    proxyGraphqlEndpoint.addMethod(
      'ANY',
      new apigateway.AwsIntegration({
        service: 'appsync-api',
        subdomain: cdk.Fn.select(
          0,
          cdk.Fn.split(
            '.',
            cdk.Fn.select(1, cdk.Fn.split('https://', props.graphqlApi.url))
          )
        ),
        path: 'graphql',
        integrationHttpMethod: 'ANY',
        options: {
          credentialsRole: proxyServiceIntegrationRole,
          integrationResponses: [
            {
              statusCode: '200',
              responseParameters: {
                'method.response.header.access-control-allow-origin': `'*'`,
              },
              responseTemplates: {
                'application/json': '',
              },
            },
          ],
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.access-control-allow-origin': true,
            },
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );

    new cdk.CfnOutput(this, 'GraphQLEndpoint', {
      value: `https://${proxy.restApiId}.execute-api.${this.region}.amazonaws.com/prod/graphql`,
    });
  }
}
