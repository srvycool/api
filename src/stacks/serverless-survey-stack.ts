import * as cdk from "@aws-cdk/core";
import * as appsync from "@aws-cdk/aws-appsync";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as templates from "../templates";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as iam from "@aws-cdk/aws-iam";

interface CustomProps extends cdk.StackProps {
  environment: string;
}

export class ServerlessSurveyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: CustomProps) {
    super(scope, id, props);

    const surveyTable = new dynamodb.Table(this, "SurveyTable", {
      partitionKey: {
        name: "node",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "path",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      serverSideEncryption: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new appsync.GraphqlApi(this, "ServerlessSurvey", {
      name: `ServerlessSurvey ${props.environment}`,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
      schema: appsync.Schema.fromAsset("./schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM
        },
      }
    });

    const proxyServiceIntegrationPolicy = new iam.Policy(this, `ServerlessSurvey Proxy Policy ${props.environment}`, {
      statements: [
        new iam.PolicyStatement({
          actions: ['appsync:GraphQL'],
          resources: [`${api.arn}/*`],
        }),
      ],
    });

    const proxyServiceIntegrationRole = new iam.Role(this, `ServerlessSurvey Proxy Role ${props.environment}`, {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });
    proxyServiceIntegrationRole.attachInlinePolicy(proxyServiceIntegrationPolicy)

    const proxy = new apigateway.RestApi(this, `ServerlessSurvey ${props.environment}`);
    const proxyGraphqlEndpoint = proxy.root.addResource('graphql');

    proxyGraphqlEndpoint.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS
    });

    proxyGraphqlEndpoint.addMethod('ANY',
      new apigateway.AwsIntegration({
        service: 'appsync-api',
        subdomain: cdk.Fn.select(0, cdk.Fn.split('.', cdk.Fn.select(1, cdk.Fn.split('https://', api.graphqlUrl)))),
        path: 'graphql',
        integrationHttpMethod: 'ANY',
        options: {
          credentialsRole: proxyServiceIntegrationRole,
          integrationResponses: [{
            statusCode: '200',
            responseParameters: {
              'method.response.header.access-control-allow-origin': `'*'`
            },
            responseTemplates: {
              'application/json': ''
            }
          }]
        }
      }), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.access-control-allow-origin': true
          },
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL
          },
        }
      ]
    });

    const dataSource = api.addDynamoDbDataSource(
      "SurveyTableDataSoure",
      surveyTable
    );

    const functionSurveyByID = new appsync.CfnFunctionConfiguration(
      this,
      "FunctionSurveyByID",
      {
        apiId: api.apiId,
        dataSourceName: dataSource.name,
        functionVersion: "2018-05-29",
        name: "FunctionSurveyByID",
        requestMappingTemplate: templates.functionSurveyByID.request,
        responseMappingTemplate: templates.functionSurveyByID.response,
      }
    );

    api.addSchemaDependency(functionSurveyByID);
    functionSurveyByID.addDependsOn(dataSource.ds);

    const functionSurveyMultipleChoiceSubmit = new appsync.CfnFunctionConfiguration(
      this,
      "FunctionSurveyMultipleChoiceSubmit",
      {
        apiId: api.apiId,
        dataSourceName: dataSource.name,
        functionVersion: "2018-05-29",
        name: "FunctionSurveyMultipleChoiceSubmit",
        requestMappingTemplate:
          templates.functionSurveyMultipleChoiceSubmit.request,
        responseMappingTemplate:
          templates.functionSurveyMultipleChoiceSubmit.response,
      }
    );

    api.addSchemaDependency(functionSurveyMultipleChoiceSubmit);
    functionSurveyMultipleChoiceSubmit.addDependsOn(dataSource.ds);

    const functionSurveyTextareaSubmit = new appsync.CfnFunctionConfiguration(
      this,
      "FunctionSurveyTextareaSubmit",
      {
        apiId: api.apiId,
        dataSourceName: dataSource.name,
        functionVersion: "2018-05-29",
        name: "FunctionSurveyTextareaSubmit",
        requestMappingTemplate: templates.functionSurveyTextareaSubmit.request,
        responseMappingTemplate:
          templates.functionSurveyTextareaSubmit.response,
      }
    );

    api.addSchemaDependency(functionSurveyTextareaSubmit);
    functionSurveyTextareaSubmit.addDependsOn(dataSource.ds);

    const resolverQuerySurvey = new appsync.CfnResolver(this, "ResolverQuerySurvey", {
      apiId: api.apiId,
      typeName: "Query",
      fieldName: "survey",
      kind: "PIPELINE",
      pipelineConfig: {
        functions: [functionSurveyByID.getAtt("FunctionId").toString()],
      },
      requestMappingTemplate: templates.querySurvey.request,
      responseMappingTemplate: templates.querySurvey.response,
    });

    resolverQuerySurvey.addDependsOn(functionSurveyByID);
    resolverQuerySurvey.addDependsOn(functionSurveyTextareaSubmit);

    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "surveyMultipleChoiceCreate",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        templates.mutationSurveyMultipleChoiceCreate.request(
          surveyTable.tableName
        )
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        templates.mutationSurveyMultipleChoiceCreate.response
      ),
    });

    dataSource.createResolver({
      typeName: "SurveyMultipleChoice",
      fieldName: "answers",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        templates.surveyMultipleChoiceAnswers.request
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        templates.surveyMultipleChoiceAnswers.response
      ),
    });

    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "surveyTextareaCreate",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        templates.mutationSurveyTextareaCreate.request
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        templates.mutationSurveyTextareaCreate.response
      ),
    });

    const resolverSurveyMultipleChoiceSubmit = new appsync.CfnResolver(
      this,
      "ResolverSurveyMultipleChoiceSubmit",
      {
        apiId: api.apiId,
        typeName: "Mutation",
        fieldName: "surveyMultipleChoiceSubmit",
        kind: "PIPELINE",
        pipelineConfig: {
          functions: [
            functionSurveyMultipleChoiceSubmit.getAtt("FunctionId").toString(),
            functionSurveyByID.getAtt("FunctionId").toString(),
          ],
        },
        requestMappingTemplate:
          templates.mutationSurveyMultipleChoiceSubmit.request,
        responseMappingTemplate:
          templates.mutationSurveyMultipleChoiceSubmit.response,
      }
    );

    resolverSurveyMultipleChoiceSubmit.addDependsOn(functionSurveyByID);
    resolverSurveyMultipleChoiceSubmit.addDependsOn(
      functionSurveyMultipleChoiceSubmit
    );

    const resolverSurveyTextAreaSubmit = new appsync.CfnResolver(
      this,
      "ResolverSurveyTextareaSubmit",
      {
        apiId: api.apiId,
        typeName: "Mutation",
        fieldName: "surveyTextareaSubmit",
        kind: "PIPELINE",
        pipelineConfig: {
          functions: [
            functionSurveyTextareaSubmit.getAtt("FunctionId").toString(),
            functionSurveyByID.getAtt("FunctionId").toString(),
          ],
        },
        requestMappingTemplate: templates.mutationSurveyTextareaSubmit.request,
        responseMappingTemplate:
          templates.mutationSurveyTextareaSubmit.response,
      }
    );

    resolverSurveyTextAreaSubmit.addDependsOn(functionSurveyByID);
    resolverSurveyTextAreaSubmit.addDependsOn(functionSurveyTextareaSubmit);

    dataSource.createResolver({
      typeName: "SurveyTextarea",
      fieldName: "submissions",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        templates.surveyTextareaSubmission.request
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        templates.surveyTextareaSubmission.response
      ),
    });

    new cdk.CfnOutput(this, "GraphQLEndpoint", {
      value: `https://${proxy.restApiId}.execute-api.${this.region}.amazonaws.com/prod/graphql`,
    });
  }
}
