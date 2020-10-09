import * as cdk from "@aws-cdk/core";
import {
  GraphqlApi,
  FieldLogLevel,
  MappingTemplate,
  CfnFunctionConfiguration,
  CfnResolver,
  AuthorizationType, Schema
} from "@aws-cdk/aws-appsync";
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
} from "@aws-cdk/aws-dynamodb";
import * as templates from "../templates";
import { AwsIntegration, Cors, Model, RestApi } from "@aws-cdk/aws-apigateway";
import { Policy, PolicyStatement, Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { Fn } from "@aws-cdk/core";

const environment = process.env.ENVIRONMENT;

export class ServerlessSurveyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const surveyTable = new Table(this, "SurveyTable", {
      partitionKey: {
        name: "node",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "path",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      serverSideEncryption: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new GraphqlApi(this, "ServerlessSurvey", {
      name: `ServerlessSurvey ${environment}`,
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      schema: Schema.fromAsset("./schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.IAM
        },
      }
    });

    const proxyServiceIntegrationPolicy = new Policy(this, `ServerlessSurvey Proxy Policy ${environment}`, {
      statements: [
        new PolicyStatement({
          actions: ['appsync:GraphQL'],
          resources: [`${api.arn}/*`],
        }),
      ],
    });

    const proxyServiceIntegrationRole = new Role(this, `ServerlessSurvey Proxy Role ${environment}`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    proxyServiceIntegrationRole.attachInlinePolicy(proxyServiceIntegrationPolicy)

    const proxy = new RestApi(this, `ServerlessSurvey ${environment}`);
    const proxyGraphqlEndpoint = proxy.root.addResource('graphql');

    proxyGraphqlEndpoint.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS
    });

    proxyGraphqlEndpoint.addMethod('ANY',
      new AwsIntegration({
        service: 'appsync-api',
        subdomain: Fn.select(0, Fn.split('.', Fn.select(1, Fn.split('https://', api.graphqlUrl)))),
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
            'application/json': Model.EMPTY_MODEL
          },
        }
      ]
    });

    const dataSource = api.addDynamoDbDataSource(
      "SurveyTableDataSoure",
      surveyTable
    );

    const functionSurveyByID = new CfnFunctionConfiguration(
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

    const functionSurveyMultipleChoiceSubmit = new CfnFunctionConfiguration(
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

    const functionSurveyTextareaSubmit = new CfnFunctionConfiguration(
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

    const resolverQuerySurvey = new CfnResolver(this, "ResolverQuerySurvey", {
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
      requestMappingTemplate: MappingTemplate.fromString(
        templates.mutationSurveyMultipleChoiceCreate.request(
          surveyTable.tableName
        )
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        templates.mutationSurveyMultipleChoiceCreate.response
      ),
    });

    dataSource.createResolver({
      typeName: "SurveyMultipleChoice",
      fieldName: "answers",
      requestMappingTemplate: MappingTemplate.fromString(
        templates.surveyMultipleChoiceAnswers.request
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        templates.surveyMultipleChoiceAnswers.response
      ),
    });

    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "surveyTextareaCreate",
      requestMappingTemplate: MappingTemplate.fromString(
        templates.mutationSurveyTextareaCreate.request
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        templates.mutationSurveyTextareaCreate.response
      ),
    });

    const resolverSurveyMultipleChoiceSubmit = new CfnResolver(
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

    const resolverSurveyTextAreaSubmit = new CfnResolver(
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
      requestMappingTemplate: MappingTemplate.fromString(
        templates.surveyTextareaSubmission.request
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        templates.surveyTextareaSubmission.response
      ),
    });

    new cdk.CfnOutput(this, "GraphQLEndpoint", {
      value: `https://${proxy.restApiId}.execute-api.${this.region}.amazonaws.com/prod/graphql`,
    });
  }
}
